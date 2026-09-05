/**
 * The two generated TextMate grammars.
 *
 * Three layers:
 *   1. the committed JSON is byte-identical to a fresh generator run;
 *   2. the JSON is structurally valid (includes resolve, begin/end pair up);
 *   3. real NTGML tokenises into the expected scopes - a full line-by-line
 *      dump per fixture as a golden, plus targeted assertions for the rules
 *      that are easy to break silently.
 */

import * as assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { before, test } from 'node:test';

import * as oniguruma from 'vscode-oniguruma';
import * as vsctm from 'vscode-textmate';

import { FIXTURES, ROOT, expectGolden, lf, read } from './helpers';

const SYNTAXES = path.join(ROOT, 'syntaxes');
const GENERATOR = path.join(ROOT, 'out', 'tools', 'generate-grammar.js');

const LEGACY_SCOPE = 'source.ntgml.legacy';
const MODERN_SCOPE = 'source.ntgml';

const GRAMMAR_FILES: { scope: string; file: string }[] = [
	{ scope: LEGACY_SCOPE, file: 'ntgml-legacy.tmLanguage.json' },
	{ scope: MODERN_SCOPE, file: 'ntgml.tmLanguage.json' },
];

/** Real mods to tokenise as a backtracking canary, when they are installed. */
const REAL_MODS = process.env.NT_MODS_DIR ??
	'D:\\Games\\Steam\\steamapps\\common\\Nuclear Throne\\mods';

// --- loading -------------------------------------------------------------

let registry: vsctm.Registry;
const grammars: { [scope: string]: vsctm.IGrammar } = {};

before(async () => {
	assert.ok(fs.existsSync(GENERATOR), 'build the generator first: tsc -p tools');
	const wasm = fs.readFileSync(require.resolve('vscode-oniguruma/release/onig.wasm'));
	await oniguruma.loadWASM(wasm.buffer.slice(
		wasm.byteOffset, wasm.byteOffset + wasm.byteLength) as ArrayBuffer);

	registry = new vsctm.Registry({
		onigLib: Promise.resolve({
			createOnigScanner: (sources: string[]) => new oniguruma.OnigScanner(sources),
			createOnigString: (s: string) => new oniguruma.OnigString(s),
		}),
		loadGrammar: async (scopeName: string) => {
			const entry = GRAMMAR_FILES.find((g) => g.scope === scopeName);
			if (entry === undefined) { return null; }
			const file = path.join(SYNTAXES, entry.file);
			return vsctm.parseRawGrammar(read(file), file);
		},
	});

	for (const entry of GRAMMAR_FILES) {
		const grammar = await registry.loadGrammar(entry.scope);
		assert.ok(grammar, 'failed to load ' + entry.scope);
		grammars[entry.scope] = grammar;
	}
});

// --- tokenising helpers --------------------------------------------------

interface Token { text: string; scopes: string[]; }

/** Tokenise `text`, dropping the grammar's own scope from every token. */
function tokenizeLines(scope: string, text: string): Token[][] {
	const grammar = grammars[scope];
	let stack = vsctm.INITIAL;
	const out: Token[][] = [];
	for (const line of lf(text).split('\n')) {
		const result = grammar.tokenizeLine(line, stack);
		stack = result.ruleStack;
		out.push(result.tokens.map((t) => ({
			text: line.slice(t.startIndex, t.endIndex),
			scopes: t.scopes.filter((s) => s !== scope),
		})));
	}
	return out;
}

/**
 * The scopes of the first token whose text is `needle`. Unscoped runs are one
 * token, so the text is trimmed before comparing.
 */
function scopesOf(scope: string, code: string, needle: string): string[] {
	for (const line of tokenizeLines(scope, code)) {
		for (const token of line) {
			if (token.text.trim() === needle) { return token.scopes; }
		}
	}
	assert.fail('no token "' + needle + '" in: ' + code);
}

/** True when some token of `code` carries `wanted` (a full scope name). */
function hasScope(scope: string, code: string, wanted: string): boolean {
	for (const line of tokenizeLines(scope, code)) {
		for (const token of line) {
			if (token.scopes.indexOf(wanted) >= 0) { return true; }
		}
	}
	return false;
}

/**
 * A readable line-by-line dump. Unscoped whitespace is dropped so the golden
 * shows scope decisions rather than indentation.
 */
function dump(scope: string, text: string): string {
	const lines = lf(text).split('\n');
	const tokenised = tokenizeLines(scope, text);
	const out: string[] = [];
	tokenised.forEach((tokens, i) => {
		out.push(String(i + 1).padStart(4) + ' | ' + lines[i]);
		for (const token of tokens) {
			if (token.scopes.length === 0 && token.text.trim() === '') { continue; }
			out.push('     | ' + JSON.stringify(token.text) + '  ' +
				(token.scopes.length === 0 ? '-' : token.scopes.join(' ')));
		}
	});
	return out.join('\n') + '\n';
}

// --- 1. the committed files are what the generator writes ----------------

test('grammar: committed syntaxes/ matches a fresh generator run', () => {
	const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ntgml-grammar-'));
	try {
		const summary = execFileSync(process.execPath, [GENERATOR, '--out', tmp], {
			cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
		});
		assert.match(summary, /self-checks:\s+ok/);

		const fresh = fs.readdirSync(tmp).sort();
		assert.deepEqual(fresh, GRAMMAR_FILES.map((g) => g.file).sort());
		assert.deepEqual(fs.readdirSync(SYNTAXES).sort(), fresh, 'stale file in syntaxes/');
		for (const name of fresh) {
			assert.equal(lf(read(path.join(tmp, name))), lf(read(path.join(SYNTAXES, name))),
				name + ' differs from a fresh run; rerun `pnpm gen`');
		}
	} finally {
		fs.rmSync(tmp, { recursive: true, force: true });
	}
});

// --- 2. structure --------------------------------------------------------

interface RawRule {
	match?: string;
	begin?: string;
	end?: string;
	include?: string;
	name?: string;
	patterns?: RawRule[];
	captures?: { [k: string]: { name?: string } };
	beginCaptures?: { [k: string]: { name?: string } };
	endCaptures?: { [k: string]: { name?: string } };
}

interface RawGrammar {
	scopeName: string;
	fileTypes: string[];
	patterns: RawRule[];
	repository: { [k: string]: RawRule };
}

for (const entry of GRAMMAR_FILES) {
	test('grammar: ' + entry.file + ' is valid TextMate', () => {
		const grammar: RawGrammar = JSON.parse(read(path.join(SYNTAXES, entry.file)));
		assert.equal(grammar.scopeName, entry.scope);
		assert.ok(grammar.patterns.length > 0);

		const known = Object.keys(grammar.repository);
		const problems: string[] = [];
		const reached = new Set<string>();

		const walk = (rule: RawRule, where: string): void => {
			if (rule.include !== undefined && rule.include.charAt(0) === '#') {
				const target = rule.include.slice(1);
				if (known.indexOf(target) < 0) {
					problems.push(where + ': include of missing #' + target);
				} else if (!reached.has(target)) {
					reached.add(target);
					walk(grammar.repository[target], 'repository.' + target);
				}
			}
			if ((rule.begin === undefined) !== (rule.end === undefined)) {
				problems.push(where + ': begin/end are not paired');
			}
			if (rule.match !== undefined && rule.begin !== undefined) {
				problems.push(where + ': both match and begin');
			}
			for (const key of ['captures', 'beginCaptures', 'endCaptures'] as const) {
				const group = rule[key];
				if (group === undefined) { continue; }
				for (const n of Object.keys(group)) {
					if (!/^[0-9]+$/.test(n)) { problems.push(where + ': capture key ' + n); }
					if (!group[n].name) { problems.push(where + ': capture ' + n + ' has no scope'); }
				}
			}
			(rule.patterns || []).forEach((child, i) => walk(child, where + '[' + i + ']'));
		};

		grammar.patterns.forEach((rule, i) => walk(rule, 'patterns[' + i + ']'));
		for (const key of known) {
			if (!reached.has(key)) { problems.push('repository.' + key + ' is unreachable'); }
		}
		assert.deepEqual(problems, []);
	});
}

test('grammar: every scope name ends in .ntgml', () => {
	for (const entry of GRAMMAR_FILES) {
		const text = read(path.join(SYNTAXES, entry.file));
		const grammar: RawGrammar = JSON.parse(text);
		const bad: string[] = [];
		const check = (name: string | undefined): void => {
			if (name !== undefined && !/\.ntgml$/.test(name)) { bad.push(name); }
		};
		const walk = (rule: RawRule): void => {
			check(rule.name);
			for (const key of ['captures', 'beginCaptures', 'endCaptures'] as const) {
				const group = rule[key];
				if (group === undefined) { continue; }
				for (const n of Object.keys(group)) { check(group[n].name); }
			}
			(rule.patterns || []).forEach(walk);
		};
		grammar.patterns.forEach(walk);
		for (const key of Object.keys(grammar.repository)) { walk(grammar.repository[key]); }
		assert.deepEqual(bad, [], entry.file);
		assert.ok(!/\(\?i\)/.test(text), entry.file + ': NTGML is case sensitive');
	}
});

// --- 3. tokenisation -----------------------------------------------------

test('grammar: legacy fixture tokenises as expected', () => {
	const source = read(path.join(FIXTURES, 'grammar', 'sample.mod.gml'));
	expectGolden('grammar/sample.mod.gml.golden.txt', dump(LEGACY_SCOPE, source));
});

test('grammar: modern fixture tokenises as expected', () => {
	const source = read(path.join(FIXTURES, 'grammar', 'sample.mod.ntgml'));
	expectGolden('grammar/sample.mod.ntgml.golden.txt', dump(MODERN_SCOPE, source));
});

test('grammar: identifier tables come through with the right scope', () => {
	for (const scope of [LEGACY_SCOPE, MODERN_SCOPE]) {
		const at = (code: string, needle: string): string[] => scopesOf(scope, code, needle);
		assert.deepEqual(at('with (Player) {}', 'Player'), ['entity.name.object.ntgml']);
		assert.deepEqual(at('wep = wep_electric_guitar;', 'wep_electric_guitar'),
			['support.constant.weapon.ntgml']);
		assert.deepEqual(at('a = mut_throne_butt;', 'mut_throne_butt'),
			['support.constant.mutation.ntgml']);
		assert.deepEqual(at('a = char_fish;', 'char_fish'), ['support.constant.character.ntgml']);
		assert.deepEqual(at('a = crwn_death;', 'crwn_death'), ['support.constant.crown.ntgml']);
		assert.deepEqual(at('a = area_desert;', 'area_desert'), ['support.constant.area.ntgml']);
		assert.deepEqual(at('a = fa_left;', 'fa_left'), ['support.constant.ntgml']);
		assert.deepEqual(at('instance_nearest_nonself(x, y, Player);', 'instance_nearest_nonself'),
			['support.function.self.ntgml']);
		assert.deepEqual(at('instance_create(x, y, Player);', 'instance_create'),
			['support.function.ntgml']);
		assert.deepEqual(at('a = image_angle;', 'image_angle'), ['support.variable.builtin.ntgml']);
		assert.deepEqual(at('a = argument0;', 'argument0'), ['variable.language.argument.ntgml']);
		assert.deepEqual(at('sound_play(sndAllyDead);', 'sndAllyDead'), ['entity.name.sound.ntgml']);
		assert.deepEqual(at('draw_set_font(fntSmall);', 'fntSmall'), ['entity.name.font.ntgml']);
		assert.deepEqual(at('shader_set(shd16);', 'shd16'), ['entity.name.shader.ntgml']);
		assert.deepEqual(at('sprite_index = bak0;', 'bak0'), ['entity.name.sprite.ntgml']);
		assert.deepEqual(at('inst.on_death = f;', 'on_death'), ['variable.other.field.custom.ntgml']);
		assert.deepEqual(at('fork();', 'fork'), ['support.function.fork.ntgml']);
		assert.deepEqual(at('once trace("x");', 'once'), ['support.function.once.ntgml']);
		// A name the tables do not know stays unscoped.
		assert.deepEqual(at('my_own_thing = 1;', 'my_own_thing'), []);

		// A name after a `.` is that instance's field, not the built-in of the
		// same name - but the call form really is an API method.
		assert.deepEqual(at('global.frac = 1;', 'frac'), ['variable.other.member.ntgml']);
		assert.deepEqual(at('other.sprite_index = 0;', 'sprite_index'),
			['variable.other.member.ntgml']);
		assert.deepEqual(at('global . spaced = 2;', 'spaced'), ['variable.other.member.ntgml']);
		assert.deepEqual(at('inst.alarm_set(0, 30);', 'alarm_set'), ['support.function.self.ntgml']);
		// Custom-object callback fields keep their own scope after a `.`.
		assert.deepEqual(at('inst.on_death = f;', 'on_death'), ['variable.other.field.custom.ntgml']);

		for (const value of ['true', 'false', 'undefined', 'null', 'pi', 'infinity', 'NaN']) {
			assert.deepEqual(at('a = ' + value + ';', value), ['constant.language.ntgml'], value);
		}
	}
});

test('grammar: preprocessor', () => {
	for (const scope of [LEGACY_SCOPE, MODERN_SCOPE]) {
		assert.deepEqual(scopesOf(scope, '#define step', 'step'),
			['meta.preprocessor.define.ntgml', 'entity.name.function.event.ntgml']);
		assert.deepEqual(scopesOf(scope, '#define my_helper(a, b)', 'my_helper'),
			['meta.preprocessor.define.ntgml', 'entity.name.function.ntgml']);
		assert.deepEqual(scopesOf(scope, '#define my_helper(a, b)', 'a'),
			['meta.preprocessor.define.ntgml', 'variable.parameter.ntgml']);
		// weapon_fire is only an event for wep mods, but the grammar cannot know
		// the mod type, so every reserved event name in any mod type counts.
		assert.deepEqual(scopesOf(scope, '#define weapon_fire', 'weapon_fire'),
			['meta.preprocessor.define.ntgml', 'entity.name.function.event.ntgml']);

		assert.deepEqual(scopesOf(scope, '#pragma fast', 'fast'),
			['meta.preprocessor.pragma.ntgml', 'keyword.other.pragma.ntgml']);
		assert.deepEqual(scopesOf(scope, '\t#pragma no_using', 'no_using'),
			['meta.preprocessor.pragma.ntgml', 'keyword.other.pragma.ntgml']);
		assert.deepEqual(scopesOf(scope, '#pragma bogus', 'bogus'),
			['meta.preprocessor.pragma.ntgml', 'invalid.illegal.unknown-pragma.ntgml']);
		assert.deepEqual(scopesOf(scope, '#macro MAX_HP 20', 'MAX_HP'),
			['meta.preprocessor.macro.ntgml', 'entity.name.constant.macro.ntgml']);
		assert.deepEqual(scopesOf(scope, '#macro release:TAG 1', 'release'),
			['meta.preprocessor.macro.ntgml', 'entity.name.tag.config.ntgml']);

		// The macro body continues past a trailing backslash.
		const cont = tokenizeLines(scope, '#macro L 1, \\\n\t2\nvar after = 1;');
		const inMacro = (line: number): boolean =>
			cont[line].some((t) => t.scopes.indexOf('meta.preprocessor.macro.ntgml') >= 0);
		assert.ok(inMacro(1), 'continuation line should stay in the macro');
		assert.ok(!inMacro(2), 'the macro should end at the first unescaped line break');
	}
});

test('grammar: numbers, operators and word operators', () => {
	for (const scope of [LEGACY_SCOPE, MODERN_SCOPE]) {
		assert.deepEqual(scopesOf(scope, 'a = $ff8040;', '$ff8040'), ['constant.numeric.hex.ntgml']);
		assert.deepEqual(scopesOf(scope, 'a = 0xDE_AD;', '0xDE_AD'), ['constant.numeric.hex.ntgml']);
		assert.deepEqual(scopesOf(scope, 'a = 0b1010_0101;', '0b1010_0101'),
			['constant.numeric.binary.ntgml']);
		assert.deepEqual(scopesOf(scope, 'a = 1_000.25;', '1_000.25'),
			['constant.numeric.decimal.ntgml']);
		assert.deepEqual(scopesOf(scope, 'a = .5;', '.5'), ['constant.numeric.decimal.ntgml']);
		// No exponent form in NTGML: `e5` is an identifier, not part of the number.
		assert.deepEqual(scopesOf(scope, 'a = 1e5;', '1'), ['constant.numeric.decimal.ntgml']);

		for (const op of ['<>', '^^', '??', '??=']) {
			const scopes = scopesOf(scope, 'a = b ' + op + ' c;', op);
			assert.equal(scopes.length, 1, op);
			assert.match(scopes[0], /^keyword\.operator\./, op);
		}
		for (const word of ['and', 'or', 'not', 'xor', 'mod', 'div', 'in']) {
			assert.deepEqual(scopesOf(scope, 'a = b ' + word + ' c;', word),
				['keyword.operator.word.ntgml'], word);
		}
		assert.deepEqual(scopesOf(scope, 'if "hp" not in inst {}', 'not in'),
			['keyword.operator.word.ntgml']);
		assert.deepEqual(scopesOf(scope, 'wait 30;', 'wait'), ['keyword.control.wait.ntgml']);
		for (const op of ['&', '|', '^', '~', '<<', '>>']) {
			assert.deepEqual(scopesOf(scope, 'a = b ' + op + ' c;', op),
				['keyword.operator.bitwise.ntgml'], op);
		}
		for (const accessor of ['[|', '[?', '[#', '[@']) {
			assert.deepEqual(scopesOf(scope, 'a = b' + accessor + ' 0];', accessor),
				['keyword.operator.accessor.ntgml'], accessor);
		}
	}
});

test('grammar: strings', () => {
	for (const scope of [LEGACY_SCOPE, MODERN_SCOPE]) {
		assert.ok(hasScope(scope, 'a = "x";', 'string.quoted.double.ntgml'));
		assert.ok(hasScope(scope, "a = 'legacy';", 'string.quoted.single.ntgml'));
		assert.ok(hasScope(scope, 'a = `hp ${b + 1}`;', 'meta.template.expression.ntgml'));
		assert.deepEqual(scopesOf(scope, 'a = `hp $b`;', 'b'),
			['string.template.ntgml', 'variable.other.ntgml']);
		// `${ { } }` must not close the interpolation early.
		assert.ok(hasScope(scope, 'a = `${ f({ }) } tail`;', 'string.template.ntgml'));
		// No escape-sequence scopes in either dialect (spec 2.3).
		assert.ok(!hasScope(scope, 'a = "a\\nb";', 'constant.character.escape.ntgml'));
	}
});

test('grammar: dialect gating', () => {
	// `$"..."` interpolates in the modern dialect only.
	assert.ok(hasScope(MODERN_SCOPE, 'a = $"x {b}";', 'string.quoted.template.ntgml'));
	assert.ok(hasScope(MODERN_SCOPE, 'a = $"x {b}";', 'meta.template.expression.ntgml'));
	assert.ok(!hasScope(LEGACY_SCOPE, 'a = $"x {b}";', 'string.quoted.template.ntgml'));
	assert.ok(!hasScope(LEGACY_SCOPE, 'a = $"x {b}";', 'meta.template.expression.ntgml'));

	// `[$ key]` is a modern-only accessor.
	assert.deepEqual(scopesOf(MODERN_SCOPE, 'a = b[$ "k"];', '[$'),
		['keyword.operator.accessor.ntgml']);
	assert.ok(!hasScope(LEGACY_SCOPE, 'a = b[$ "k"];', 'keyword.operator.accessor.ntgml'));

	// function / new / static / constructor are modern only.
	assert.deepEqual(scopesOf(MODERN_SCOPE, 'function Counter(n = 0) constructor {}', 'function'),
		['meta.function.ntgml', 'storage.type.function.ntgml']);
	assert.deepEqual(scopesOf(MODERN_SCOPE, 'function Counter(n = 0) constructor {}', 'Counter'),
		['meta.function.ntgml', 'entity.name.function.ntgml']);
	assert.deepEqual(scopesOf(MODERN_SCOPE, 'function Counter(n = 0) constructor {}', 'n'),
		['meta.function.ntgml', 'variable.parameter.ntgml']);
	assert.deepEqual(scopesOf(MODERN_SCOPE, 'a = function(b) {};', 'function'),
		['meta.function.ntgml', 'storage.type.function.ntgml']);
	// A parameter list split over several lines still names its parameters,
	// and a call in a default value does not close the list early.
	const multiline = 'function f(\n\tvalue,\n\tlow = 0,\n\thigh = max(1, 2)\n) {}';
	assert.deepEqual(scopesOf(MODERN_SCOPE, multiline, 'value'),
		['meta.function.ntgml', 'variable.parameter.ntgml']);
	assert.deepEqual(scopesOf(MODERN_SCOPE, multiline, 'low'),
		['meta.function.ntgml', 'variable.parameter.ntgml']);
	assert.deepEqual(scopesOf(MODERN_SCOPE, multiline, 'high'),
		['meta.function.ntgml', 'variable.parameter.ntgml']);
	assert.ok(hasScope(MODERN_SCOPE, multiline, 'punctuation.section.parens.ntgml'));
	assert.deepEqual(scopesOf(MODERN_SCOPE, 'static n = 1;', 'static'), ['storage.type.ntgml']);
	assert.deepEqual(scopesOf(MODERN_SCOPE, 'a = new Counter();', 'new'),
		['keyword.operator.new.ntgml']);
	for (const word of ['function', 'new', 'static', 'constructor']) {
		const code = 'a = ' + word + ' b;';
		for (const unwanted of ['storage.type.function.ntgml', 'storage.type.ntgml',
			'keyword.operator.new.ntgml', 'meta.function.ntgml']) {
			assert.ok(!hasScope(LEGACY_SCOPE, code, unwanted), word + ' / ' + unwanted);
		}
	}

	// Known limitation: `#pragma gml 2` opts a .gml file into the modern dialect
	// for the game, but VS Code picks one grammar per file type, so the legacy
	// grammar keeps tokenising it as legacy.
	assert.ok(!hasScope(LEGACY_SCOPE, '#pragma gml 2\na = $"x {b}";',
		'string.quoted.template.ntgml'));

	// `finally` and `delete` are in the binary's keyword map with no known
	// dialect gate (spec 2.5), so both grammars colour them.
	for (const scope of [LEGACY_SCOPE, MODERN_SCOPE]) {
		assert.deepEqual(scopesOf(scope, 'try {} catch (e) {} finally {}', 'finally'),
			['keyword.control.ntgml']);
		assert.deepEqual(scopesOf(scope, 'delete a;', 'delete'), ['keyword.operator.delete.ntgml']);
	}
});

test('grammar: keeps up on real mods without backtracking', (t) => {
	if (!fs.existsSync(REAL_MODS)) {
		// Only present on a machine with the game installed.
		t.skip('no mods dir at ' + REAL_MODS + ' (set NT_MODS_DIR)');
		return;
	}
	const files: string[] = [];
	const walk = (dir: string): void => {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) { walk(full); }
			else if (/\.(gml|ntgml)$/.test(entry.name)) { files.push(full); }
		}
	};
	walk(REAL_MODS);
	if (files.length === 0) {
		t.skip('no .gml or .ntgml files under ' + REAL_MODS);
		return;
	}

	const sample = files.sort().slice(0, 40);
	let lines = 0;
	const started = Date.now();
	for (const file of sample) {
		const scope = /\.ntgml$/.test(file) ? MODERN_SCOPE : LEGACY_SCOPE;
		let text: string;
		try { text = read(file); } catch { continue; }
		lines += tokenizeLines(scope, text).length;
	}
	const elapsed = Date.now() - started;
	assert.ok(elapsed < 30000,
		'tokenising ' + sample.length + ' real mod files took ' + elapsed + 'ms for ' +
		lines + ' lines - suspect catastrophic backtracking');
});

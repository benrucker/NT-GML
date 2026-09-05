/**
 * Generates the two NTGML TextMate grammars from one template plus the
 * committed identifier tables.
 *
 *   pnpm gen                                  # API tables, then these
 *   node out/tools/generate-grammar.js --out <dir>
 *
 * Inputs (all committed, so this never needs the game installed):
 *   src/generated/{functions,constants,variables,assets,meta}.ts
 *   src/tables/{keywords,events,custom-objects}.ts
 *
 * Outputs:
 *   syntaxes/ntgml-legacy.tmLanguage.json   scope source.ntgml.legacy  (.gml)
 *   syntaxes/ntgml.tmLanguage.json          scope source.ntgml         (.ntgml)
 *
 * Both files come from one `buildGrammar(modern)` call each; everything that
 * differs between the dialects is gated on that flag (NTGML-SPEC.md section 1).
 * Output is deterministic: alternations are deduplicated and sorted (longest
 * first, then alphabetically), object keys are emitted in a fixed order and
 * lines end with `\n`.
 */

import * as fs from 'fs';
import * as path from 'path';

import { assets } from '../src/generated/assets';
import { constants } from '../src/generated/constants';
import { functions } from '../src/generated/functions';
import { meta } from '../src/generated/meta';
import { variables } from '../src/generated/variables';
import { customObjectFields } from '../src/tables/custom-objects';
import { modEvents, modTypes } from '../src/tables/events';
import { builtinConstants, keywords, pragmaNames, softKeywords } from '../src/tables/keywords';

const ROOT = path.resolve(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'syntaxes');

// --- TextMate model ------------------------------------------------------

interface Captures { [group: string]: { name: string }; }

interface Rule {
	comment?: string;
	name?: string;
	contentName?: string;
	match?: string;
	begin?: string;
	end?: string;
	captures?: Captures;
	beginCaptures?: Captures;
	endCaptures?: Captures;
	include?: string;
	patterns?: Rule[];
}

interface Grammar {
	comment: string;
	name: string;
	scopeName: string;
	fileTypes: string[];
	patterns: Rule[];
	repository: { [key: string]: Rule };
}

// --- helpers -------------------------------------------------------------

function fail(message: string): never {
	console.error('generate-grammar: ' + message);
	process.exit(1);
	throw new Error(message); // unreachable; keeps the return type honest
}

function escapeRe(name: string): string {
	return name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Deduplicated alternation body, longest first so the regex does not depend
 * on the order names arrive in. The `\b(?:...)\b` wrapper makes the order
 * irrelevant for correctness; it still saves the engine some backtracking.
 */
function alternation(names: string[]): string {
	const unique = Array.from(new Set(names));
	unique.sort((a, b) => (b.length - a.length) || (a < b ? -1 : a > b ? 1 : 0));
	return unique.map(escapeRe).join('|');
}

/** `\b(?:a|b|c)\b` - a whole-word match over a name table. */
function words(names: string[]): string {
	if (names.length === 0) { fail('empty word list'); }
	return '\\b(?:' + alternation(names) + ')\\b';
}

function caps(map: { [group: string]: string }): Captures {
	const out: Captures = {};
	// Integer-like keys iterate in ascending numeric order, so this is stable.
	for (const key of Object.keys(map)) { out[key] = { name: map[key] }; }
	return out;
}

function include(target: string): Rule {
	return { include: target };
}

// --- data ----------------------------------------------------------------

/** Every reserved mod event name, across every mod type (NTGML-SPEC.md 8.1). */
const eventNames: string[] = (() => {
	const set = new Set<string>();
	for (const type of modTypes) {
		for (const event of modEvents[type]) { set.add(event.name); }
	}
	return Array.from(set).sort();
})();

/**
 * Keyword buckets. The names come from `src/tables/keywords.ts`; this only
 * decides which scope each one gets. Every keyword in that table must appear
 * in exactly one bucket, so adding one there fails the build until it is
 * classified here.
 */
const KEYWORD_BUCKETS: { scope: string; names: string[] }[] = [
	{
		scope: 'keyword.control.ntgml',
		names: [
			'if', 'then', 'else', 'begin', 'end', 'for', 'while', 'do', 'until', 'repeat',
			'switch', 'case', 'default', 'break', 'continue', 'with', 'exit', 'return',
			'try', 'catch', 'throw', 'finally',
		],
	},
	{ scope: 'keyword.control.wait.ntgml', names: ['wait'] },
	{
		scope: 'storage.type.ntgml',
		names: ['var', 'globalvar', 'local', 'enum', 'static', 'constructor'],
	},
	{ scope: 'keyword.operator.new.ntgml', names: ['new'] },
	{ scope: 'keyword.operator.delete.ntgml', names: ['delete'] },
	{
		scope: 'keyword.operator.word.ntgml',
		names: ['mod', 'div', 'not', 'and', 'or', 'xor', 'in'],
	},
];

/** `function` is handled by the declaration rules, not by a bare keyword rule. */
const KEYWORDS_HANDLED_ELSEWHERE = ['function'];

/**
 * `softKeywords` from the same table: words the parser gives meaning to
 * without them being lexer keywords. `fork` and `once` are function-like AST
 * nodes (spec 2.5), so they get support-function scopes rather than keyword
 * ones; `region` / `endregion` only matter after a `#`, where the `#region`
 * rules already cover them.
 */
const SOFT_KEYWORD_BUCKETS: { scope: string; names: string[] }[] = [
	{ scope: 'support.function.fork.ntgml', names: ['fork'] },
	{ scope: 'support.function.once.ntgml', names: ['once'] },
];

const SOFT_KEYWORDS_HANDLED_ELSEWHERE = ['region', 'endregion'];

/**
 * `self other noone all global` are values, but they name a scope rather than
 * a literal, so they read better as `variable.language`.
 */
const LANGUAGE_VARIABLES = ['self', 'other', 'noone', 'all', 'global'];

function checkKeywordCoverage(): void {
	const bucketed = new Set<string>(KEYWORDS_HANDLED_ELSEWHERE);
	for (const bucket of KEYWORD_BUCKETS) {
		for (const name of bucket.names) {
			if (bucketed.has(name)) { fail('keyword in two buckets: ' + name); }
			bucketed.add(name);
		}
	}
	const table = new Set(keywords.map((k) => k.name));
	for (const name of Array.from(bucketed)) {
		if (!table.has(name)) { fail('bucketed word is not in src/tables/keywords.ts: ' + name); }
	}
	for (const name of Array.from(table)) {
		if (!bucketed.has(name)) {
			fail('keyword "' + name + '" from src/tables/keywords.ts is not in KEYWORD_BUCKETS');
		}
	}
	const soft = new Set<string>(SOFT_KEYWORDS_HANDLED_ELSEWHERE);
	for (const bucket of SOFT_KEYWORD_BUCKETS) {
		for (const name of bucket.names) {
			if (soft.has(name)) { fail('soft keyword in two buckets: ' + name); }
			soft.add(name);
		}
	}
	const softTable = new Set(softKeywords.map((k) => k.name));
	for (const name of Array.from(soft)) {
		if (!softTable.has(name)) { fail('bucketed word is not a soft keyword: ' + name); }
	}
	for (const name of Array.from(softTable)) {
		if (!soft.has(name)) { fail('soft keyword "' + name + '" is not in SOFT_KEYWORD_BUCKETS'); }
	}

	const constantTable = new Set(builtinConstants.map((k) => k.name));
	for (const name of LANGUAGE_VARIABLES) {
		if (!constantTable.has(name)) { fail('language variable is not a builtin constant: ' + name); }
	}
}

/** Constant families that get their own scope, keyed by name prefix. */
const CONSTANT_FAMILIES: { scope: string; prefixes: string[] }[] = [
	{ scope: 'support.constant.weapon.ntgml', prefixes: ['wep_'] },
	{ scope: 'support.constant.mutation.ntgml', prefixes: ['mut_'] },
	{ scope: 'support.constant.character.ntgml', prefixes: ['char_'] },
	// The dump spells crown constants `crwn_*`; `crown_*` is accepted too so a
	// future rename does not silently drop the scope.
	{ scope: 'support.constant.crown.ntgml', prefixes: ['crwn_', 'crown_'] },
	{ scope: 'support.constant.area.ntgml', prefixes: ['area_'] },
];

interface Tables {
	argumentVars: string[];
	builtinVars: string[];
	selfFunctions: string[];
	plainFunctions: string[];
	constantFamilies: { scope: string; names: string[] }[];
	otherConstants: string[];
}

function buildTables(): Tables {
	// Keywords and language constants win over the API tables, so drop any
	// name they already cover (none collide today; this keeps it that way).
	const reserved = new Set<string>();
	for (const k of keywords) { reserved.add(k.name); }
	for (const k of builtinConstants) { reserved.add(k.name); }
	for (const k of softKeywords) { reserved.add(k.name); }

	const argumentVars: string[] = [];
	const builtinVars: string[] = [];
	for (const v of variables) {
		if (reserved.has(v.name)) { continue; }
		if (/^argument(_count|[0-9]+)?$/.test(v.name)) { argumentVars.push(v.name); }
		else { builtinVars.push(v.name); }
	}

	const selfFunctions: string[] = [];
	const plainFunctions: string[] = [];
	for (const f of functions) {
		if (reserved.has(f.name)) { continue; }
		if (f.selfCtx > 0) { selfFunctions.push(f.name); }
		else { plainFunctions.push(f.name); }
	}

	const families = CONSTANT_FAMILIES.map((f) => ({ scope: f.scope, names: [] as string[] }));
	const otherConstants: string[] = [];
	for (const c of constants) {
		if (reserved.has(c.name)) { continue; }
		let placed = false;
		for (let i = 0; i < CONSTANT_FAMILIES.length && !placed; i++) {
			for (const prefix of CONSTANT_FAMILIES[i].prefixes) {
				if (c.name.indexOf(prefix) === 0) {
					families[i].names.push(c.name);
					placed = true;
					break;
				}
			}
		}
		if (!placed) { otherConstants.push(c.name); }
	}

	return {
		argumentVars: argumentVars,
		builtinVars: builtinVars,
		selfFunctions: selfFunctions,
		plainFunctions: plainFunctions,
		constantFamilies: families.filter((f) => f.names.length > 0),
		otherConstants: otherConstants,
	};
}

// --- the template --------------------------------------------------------

function buildGrammar(modern: boolean, tables: Tables): Grammar {
	const dialect = modern ? 'modern' : 'legacy';
	const inDialect = (name: string): boolean => {
		const entry = keywords.find((k) => k.name === name);
		return entry !== undefined && (entry.dialect === 'both' || modern);
	};

	const keywordRules: Rule[] = [];
	for (const bucket of KEYWORD_BUCKETS) {
		const names = bucket.names.filter(inDialect);
		if (names.length === 0) { continue; }
		keywordRules.push({ name: bucket.scope, match: words(names) });
	}

	const languageConstants = builtinConstants
		.filter((c) => (c.dialect === 'both' || modern) && LANGUAGE_VARIABLES.indexOf(c.name) < 0)
		.map((c) => c.name);

	const stringRules: Rule[] = [include('#string-template')];
	if (modern) { stringRules.push(include('#string-quote-template')); }
	stringRules.push(include('#string-double'), include('#string-single'));

	const topLevel: Rule[] = [
		include('#comments'),
		include('#preprocessor'),
		include('#strings'),
		include('#numbers'),
	];
	if (modern) { topLevel.push(include('#function-declaration')); }
	topLevel.push(
		include('#custom-fields'),
		include('#member-access'),
		include('#keywords'),
		include('#api-constants'),
		include('#api-variables'),
		include('#api-functions'),
		include('#assets'),
		include('#operators'),
		include('#punctuation')
	);

	const repository: { [key: string]: Rule } = {};

	repository.comments = {
		patterns: [
			{
				comment: 'GMS1-style documentation comment; NTGML has no JSDoc tags (spec 2.4).',
				name: 'comment.line.documentation.ntgml',
				match: '///.*$',
			},
			{ name: 'comment.line.double-slash.ntgml', match: '//.*$' },
			{ name: 'comment.block.ntgml', begin: '/\\*', end: '\\*/' },
		],
	};

	// --- preprocessor
	repository.preprocessor = {
		patterns: [
			{
				comment: 'A #define whose name is a reserved mod event (spec 8.1).',
				name: 'meta.preprocessor.define.ntgml',
				begin: '^[ \\t]*(#define)[ \\t]+(' + alternation(eventNames) + ')\\b',
				beginCaptures: caps({
					1: 'keyword.control.directive.define.ntgml',
					2: 'entity.name.function.event.ntgml',
				}),
				end: '$',
				patterns: [include('#define-arguments'), include('#comments')],
			},
			{
				name: 'meta.preprocessor.define.ntgml',
				begin: '^[ \\t]*(#define)[ \\t]+([A-Za-z_][A-Za-z0-9_]*)',
				beginCaptures: caps({
					1: 'keyword.control.directive.define.ntgml',
					2: 'entity.name.function.ntgml',
				}),
				end: '$',
				patterns: [include('#define-arguments'), include('#comments')],
			},
			{
				comment: 'A `#define` with no name.',
				match: '^[ \\t]*(#define)\\b',
				captures: caps({ 1: 'keyword.control.directive.define.ntgml' }),
			},
			include('#macro'),
			include('#pragma'),
			include('#region'),
		],
	};

	repository['define-arguments'] = {
		comment: 'Named `#define` arguments. Ends at the line break so a stray `(` cannot run away.',
		begin: '\\(',
		beginCaptures: caps({ 0: 'punctuation.definition.parameters.begin.ntgml' }),
		end: '\\)|$',
		endCaptures: caps({ 0: 'punctuation.definition.parameters.end.ntgml' }),
		patterns: [
			{
				match: '(?<=[(,])[ \\t]*([A-Za-z_][A-Za-z0-9_]*)',
				captures: caps({ 1: 'variable.parameter.ntgml' }),
			},
			{ match: ',', name: 'punctuation.separator.parameter.ntgml' },
		],
	};

	repository.macro = {
		comment: '`#macro name value` and `#macro config:name value`; a trailing \\ continues the body.',
		name: 'meta.preprocessor.macro.ntgml',
		begin: '^[ \\t]*(#macro)\\b[ \\t]*(?:([A-Za-z_][A-Za-z0-9_]*)(:))?[ \\t]*([A-Za-z_][A-Za-z0-9_]*)?',
		beginCaptures: caps({
			1: 'keyword.control.directive.macro.ntgml',
			2: 'entity.name.tag.config.ntgml',
			3: 'punctuation.separator.config.ntgml',
			4: 'entity.name.constant.macro.ntgml',
		}),
		// vscode-textmate appends the line break, so `$` can match after it too;
		// excluding a preceding newline keeps a continued macro open.
		end: '(?<![\\\\\\n])$',
		patterns: [
			{ match: '\\\\$', name: 'constant.character.escape.continuation.ntgml' },
			include('$self'),
		],
	};

	repository.pragma = {
		comment:
			'`#pragma` is matched wherever a statement can start, not only at the top of the file: ' +
			'`fast`, `not_fast` and `no_using` are statements inside a function body (spec 2.8). ' +
			'A word outside the nine known pragmas is one the loader rejects.',
		name: 'meta.preprocessor.pragma.ntgml',
		match:
			'^[ \\t]*(#pragma)\\b[ \\t]*(?:(' + alternation(pragmaNames) +
			')\\b|([A-Za-z_][A-Za-z0-9_]*))?[ \\t]*(.*)$',
		captures: caps({
			1: 'keyword.control.directive.pragma.ntgml',
			2: 'keyword.other.pragma.ntgml',
			3: 'invalid.illegal.unknown-pragma.ntgml',
			4: 'string.unquoted.pragma.ntgml',
		}),
	};

	repository.region = {
		comment: 'Editor-side folding the game parses and ignores (spec 2.8).',
		patterns: [
			{
				match: '^[ \\t]*(#region)\\b[ \\t]*(.*)$',
				captures: caps({
					1: 'keyword.control.directive.region.ntgml',
					2: 'entity.name.section.ntgml',
				}),
			},
			{
				match: '^[ \\t]*(#endregion)\\b.*$',
				captures: caps({ 1: 'keyword.control.directive.endregion.ntgml' }),
			},
		],
	};

	// --- strings (spec 2.3; no escape sequences and no @"raw" in either dialect)
	repository.strings = { patterns: stringRules };

	repository['string-template'] = {
		comment: 'Backtick template string: `${expr}` nests, bare `$ident` also interpolates.',
		name: 'string.template.ntgml',
		begin: '`',
		beginCaptures: caps({ 0: 'punctuation.definition.string.begin.ntgml' }),
		end: '`',
		endCaptures: caps({ 0: 'punctuation.definition.string.end.ntgml' }),
		patterns: [include('#template-expression'), include('#template-identifier')],
	};

	repository['template-expression'] = {
		name: 'meta.template.expression.ntgml',
		begin: '\\$\\{',
		beginCaptures: caps({ 0: 'punctuation.definition.template-expression.begin.ntgml' }),
		end: '\\}',
		endCaptures: caps({ 0: 'punctuation.definition.template-expression.end.ntgml' }),
		contentName: 'meta.embedded.line.ntgml',
		patterns: [include('#nested-braces'), include('$self')],
	};

	repository['template-identifier'] = {
		match: '(\\$)([A-Za-z_][A-Za-z0-9_]*)',
		captures: caps({
			1: 'punctuation.definition.template-expression.begin.ntgml',
			2: 'variable.other.ntgml',
		}),
	};

	repository['nested-braces'] = {
		comment: 'Keeps a `{ }` inside an interpolation from ending it early.',
		begin: '\\{',
		end: '\\}',
		patterns: [include('#nested-braces'), include('$self')],
	};

	if (modern) {
		repository['string-quote-template'] = {
			comment: 'GM2023-style template string, modern dialect only (spec 2.3).',
			name: 'string.quoted.template.ntgml',
			begin: '\\$"',
			beginCaptures: caps({ 0: 'punctuation.definition.string.begin.ntgml' }),
			end: '"',
			endCaptures: caps({ 0: 'punctuation.definition.string.end.ntgml' }),
			patterns: [include('#quote-template-expression')],
		};
		repository['quote-template-expression'] = {
			name: 'meta.template.expression.ntgml',
			begin: '\\{',
			beginCaptures: caps({ 0: 'punctuation.definition.template-expression.begin.ntgml' }),
			end: '\\}',
			endCaptures: caps({ 0: 'punctuation.definition.template-expression.end.ntgml' }),
			contentName: 'meta.embedded.line.ntgml',
			patterns: [include('#nested-braces'), include('$self')],
		};
	}

	repository['string-double'] = {
		name: 'string.quoted.double.ntgml',
		begin: '"',
		beginCaptures: caps({ 0: 'punctuation.definition.string.begin.ntgml' }),
		end: '"',
		endCaptures: caps({ 0: 'punctuation.definition.string.end.ntgml' }),
	};

	repository['string-single'] = {
		comment: 'Legal in the legacy dialect; the modern parser likely rejects it (spec 2.3).',
		name: 'string.quoted.single.ntgml',
		begin: "'",
		beginCaptures: caps({ 0: 'punctuation.definition.string.begin.ntgml' }),
		end: "'",
		endCaptures: caps({ 0: 'punctuation.definition.string.end.ntgml' }),
	};

	// --- numbers (spec 2.2; no exponent form)
	repository.numbers = {
		patterns: [
			{ name: 'constant.numeric.hex.ntgml', match: '\\$[_0-9a-fA-F]+' },
			{ name: 'constant.numeric.hex.ntgml', match: '\\b0x[_0-9a-fA-F]*' },
			{ name: 'constant.numeric.binary.ntgml', match: '\\b0b[_01]*' },
			{
				name: 'constant.numeric.decimal.ntgml',
				match: '(?<![\\w.])[0-9][0-9_]*(?:\\.[0-9_]*)?',
			},
			{ name: 'constant.numeric.decimal.ntgml', match: '(?<![\\w.])\\.[0-9][0-9_]*' },
		],
	};

	// --- modern function declarations
	if (modern) {
		repository['function-declaration'] = {
			patterns: [
				{
					comment: 'A `function` whose name is a reserved mod event (spec 8.1).',
					name: 'meta.function.ntgml',
					begin: '\\b(function)[ \\t]+(' + alternation(eventNames) + ')\\b[ \\t]*(\\()',
					beginCaptures: caps({
						1: 'storage.type.function.ntgml',
						2: 'entity.name.function.event.ntgml',
						3: 'punctuation.definition.parameters.begin.ntgml',
					}),
					end: '\\)',
					endCaptures: caps({ 0: 'punctuation.definition.parameters.end.ntgml' }),
					patterns: [include('#function-arguments')],
				},
				{
					comment: 'Named declaration, and the anonymous `function(...)` literal.',
					name: 'meta.function.ntgml',
					begin: '\\b(function)(?:[ \\t]+([A-Za-z_][A-Za-z0-9_]*))?[ \\t]*(\\()',
					beginCaptures: caps({
						1: 'storage.type.function.ntgml',
						2: 'entity.name.function.ntgml',
						3: 'punctuation.definition.parameters.begin.ntgml',
					}),
					end: '\\)',
					endCaptures: caps({ 0: 'punctuation.definition.parameters.end.ntgml' }),
					patterns: [include('#function-arguments')],
				},
				{ name: 'storage.type.function.ntgml', match: '\\bfunction\\b' },
			],
		};

		repository['function-arguments'] = {
			patterns: [
				{
					match: '(?<=[(,])[ \\t]*([A-Za-z_][A-Za-z0-9_]*)',
					captures: caps({ 1: 'variable.parameter.ntgml' }),
				},
				{
					comment:
						'The lookbehind above cannot cross a line break, so a parameter list ' +
						'split over several lines needs its own rule.',
					match: '^[ \\t]*([A-Za-z_][A-Za-z0-9_]*)[ \\t]*(?=[,=)]|$)',
					captures: caps({ 1: 'variable.parameter.ntgml' }),
				},
				{ match: ',', name: 'punctuation.separator.parameter.ntgml' },
				{ match: '=', name: 'keyword.operator.assignment.ntgml' },
				include('#nested-parens'),
				include('$self'),
			],
		};

		repository['nested-parens'] = {
			comment: 'Keeps a call inside a default argument from closing the parameter list.',
			begin: '\\(',
			beginCaptures: caps({ 0: 'punctuation.section.parens.ntgml' }),
			end: '\\)',
			endCaptures: caps({ 0: 'punctuation.section.parens.ntgml' }),
			patterns: [include('#nested-parens'), include('$self')],
		};
	}

	// --- keywords and language values
	repository.keywords = {
		patterns: ([
			{
				comment: '`"name" not in inst` (spec 2.7).',
				name: 'keyword.operator.word.ntgml',
				match: '\\bnot[ \\t]+in\\b',
			},
		] as Rule[]).concat(keywordRules, SOFT_KEYWORD_BUCKETS.map((bucket): Rule => ({
			comment: 'Parsed specially without being a lexer keyword (spec 2.5).',
			name: bucket.scope,
			match: words(bucket.names),
		})), [
			{ name: 'variable.language.ntgml', match: words(LANGUAGE_VARIABLES) },
			{ name: 'constant.language.ntgml', match: words(languageConstants) },
			{
				comment: 'Read-only argument slots (spec 2.1).',
				name: 'variable.language.argument.ntgml',
				match: words(tables.argumentVars),
			},
		]),
	};

	repository['member-access'] = {
		comment:
			'`inst.name` is a field of that instance, not the built-in of the same ' +
			'name - `global.frac` is not `frac`. The call form `inst.alarm_set(0, 30)` ' +
			'is left to the function rules, because those really are API methods. ' +
			'A call on a user-defined method (`c.bump()`, `Player.my_thing(1)`) therefore ' +
			'gets no scope at all, since only API names are in the tables, while reading ' +
			'the same field without calling it gets `variable.other.member`.',
		match: '(\\.)[ \\t]*([A-Za-z_][A-Za-z0-9_]*)\\b(?![ \\t]*\\()',
		captures: caps({
			1: 'punctuation.accessor.ntgml',
			2: 'variable.other.member.ntgml',
		}),
	};

	repository['custom-fields'] = {
		comment: 'Callback fields of the Custom* object family, only after a `.` (spec 8.2).',
		match: '(\\.)(' + alternation(customObjectFields) + ')\\b',
		captures: caps({
			1: 'punctuation.accessor.ntgml',
			2: 'variable.other.field.custom.ntgml',
		}),
	};

	repository['api-constants'] = {
		patterns: tables.constantFamilies
			.map((family): Rule => ({ name: family.scope, match: words(family.names) }))
			.concat([{ name: 'support.constant.ntgml', match: words(tables.otherConstants) }]),
	};

	repository['api-variables'] = {
		name: 'support.variable.builtin.ntgml',
		match: words(tables.builtinVars),
	};

	repository['api-functions'] = {
		patterns: [
			{
				comment: 'Functions annotated `:name(...)` in api.gml: they act on `self`.',
				name: 'support.function.self.ntgml',
				match: words(tables.selfFunctions),
			},
			{ name: 'support.function.ntgml', match: words(tables.plainFunctions) },
		],
	};

	repository.assets = {
		comment: 'Asset names from the dump (spec 6). Object names have no prefix.',
		patterns: [
			{ name: 'entity.name.object.ntgml', match: words(assets.objects) },
			{ name: 'entity.name.sprite.ntgml', match: words(assets.sprites.concat(assets.masks)) },
			{ name: 'entity.name.shader.ntgml', match: words(assets.shaders) },
			{
				name: 'entity.name.sound.ntgml',
				match: words(assets.sounds.concat(assets.music, assets.ambience)),
			},
			{ name: 'entity.name.font.ntgml', match: words(assets.fonts) },
		],
	};

	repository.operators = {
		patterns: [
			{
				comment: modern
					? 'DS and struct accessors; `[$ key` is modern only (spec 2.7).'
					: 'DS accessors; `[$ key` is disabled in the legacy dialect (100.011).',
				name: 'keyword.operator.accessor.ntgml',
				match: modern ? '\\[[|?#@$]' : '\\[[|?#@]',
			},
			{ name: 'keyword.operator.nullish.ntgml', match: '\\?\\?=|\\?\\?' },
			{ name: 'keyword.operator.assignment.ntgml', match: '<<=|>>=|[+\\-*/%&|^]=' },
			{ name: 'keyword.operator.comparison.ntgml', match: '==|!=|<>|<=|>=' },
			{ name: 'keyword.operator.logical.ntgml', match: '&&|\\|\\||\\^\\^|!' },
			{ name: 'keyword.operator.bitwise.ntgml', match: '<<|>>|[&|^~]' },
			{ name: 'keyword.operator.arithmetic.ntgml', match: '\\+\\+|--|[+\\-*/%]' },
			{ name: 'keyword.operator.comparison.ntgml', match: '[<>]' },
			{ name: 'keyword.operator.ternary.ntgml', match: '\\?' },
			{ name: 'keyword.operator.assignment.ntgml', match: '=' },
		],
	};

	repository.punctuation = {
		patterns: [
			{ name: 'punctuation.separator.ntgml', match: '[,;]' },
			{ name: 'punctuation.separator.colon.ntgml', match: ':' },
			{ name: 'punctuation.accessor.ntgml', match: '\\.' },
			{ name: 'punctuation.section.brackets.ntgml', match: '[\\[\\]]' },
			{ name: 'punctuation.section.braces.ntgml', match: '[{}]' },
			{ name: 'punctuation.section.parens.ntgml', match: '[()]' },
		],
	};

	return {
		comment:
			'GENERATED by tools/generate-grammar.ts from src/generated/*.ts (NTT /gmlapi dump, ' +
			'game_version ' + meta.gameVersion + ') and src/tables/*.ts. Do not edit; run `pnpm gen`. ' +
			'This is the ' + dialect + ' NTGML dialect (' + (modern ? '.ntgml' : '.gml') +
			'); see NTGML-SPEC.md section 1.',
		name: modern ? 'NTGML' : 'NTGML (legacy)',
		scopeName: modern ? 'source.ntgml' : 'source.ntgml.legacy',
		fileTypes: modern ? ['ntgml'] : ['gml'],
		patterns: topLevel,
		repository: repository,
	};
}

// --- validation ----------------------------------------------------------

/** Structural checks a broken grammar would otherwise only fail at runtime. */
function validate(grammar: Grammar): string[] {
	const problems: string[] = [];
	const known = new Set(Object.keys(grammar.repository));

	const walk = (rule: Rule, where: string): void => {
		if (rule.include !== undefined) {
			if (rule.include !== '$self' && rule.include !== '$base') {
				if (rule.include.charAt(0) !== '#') {
					problems.push(where + ': external include ' + rule.include);
				} else if (!known.has(rule.include.slice(1))) {
					problems.push(where + ': include of missing repository entry ' + rule.include);
				}
			}
		}
		if (rule.begin !== undefined && rule.end === undefined) {
			problems.push(where + ': begin without end');
		}
		if (rule.end !== undefined && rule.begin === undefined) {
			problems.push(where + ': end without begin');
		}
		if (rule.match !== undefined && rule.begin !== undefined) {
			problems.push(where + ': both match and begin');
		}
		if (rule.match === undefined && rule.begin === undefined &&
			rule.include === undefined && rule.patterns === undefined) {
			problems.push(where + ': rule matches nothing');
		}
		if (rule.captures !== undefined && rule.match === undefined) {
			problems.push(where + ': captures on a rule without match');
		}
		for (const key of ['captures', 'beginCaptures', 'endCaptures'] as const) {
			const group = rule[key];
			if (group === undefined) { continue; }
			for (const n of Object.keys(group)) {
				if (!/^[0-9]+$/.test(n)) { problems.push(where + ': non-numeric capture ' + n); }
				if (!group[n].name) { problems.push(where + ': empty scope on capture ' + n); }
			}
		}
		(rule.patterns || []).forEach((child, i) => walk(child, where + '[' + i + ']'));
	};

	grammar.patterns.forEach((rule, i) => walk(rule, 'patterns[' + i + ']'));
	for (const key of Object.keys(grammar.repository)) {
		walk(grammar.repository[key], 'repository.' + key);
	}

	// Every repository entry must be reachable, or it is dead weight.
	const reached = new Set<string>();
	const visit = (rule: Rule): void => {
		if (rule.include !== undefined && rule.include.charAt(0) === '#') {
			const name = rule.include.slice(1);
			if (!reached.has(name) && known.has(name)) {
				reached.add(name);
				visit(grammar.repository[name]);
			}
		}
		for (const child of rule.patterns || []) { visit(child); }
	};
	for (const rule of grammar.patterns) { visit(rule); }
	for (const key of Object.keys(grammar.repository)) {
		if (!reached.has(key)) { problems.push('repository.' + key + ' is never included'); }
	}
	return problems;
}

// --- main ----------------------------------------------------------------

function parseArgv(argv: string[]): string {
	let outDir = OUT_DIR;
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--out') {
			const dir = argv[++i];
			if (dir === undefined) { fail('--out needs a path'); }
			outDir = path.resolve(dir);
		} else if (a.indexOf('--out=') === 0) {
			outDir = path.resolve(a.slice('--out='.length));
		} else if (a === '--help' || a === '-h') {
			console.log('usage: generate-grammar [--out <dir>]');
			process.exit(0);
		} else {
			fail('unknown argument: ' + a);
		}
	}
	return outDir;
}

function main(): void {
	const outDir = parseArgv(process.argv.slice(2));
	checkKeywordCoverage();
	const tables = buildTables();

	const files: { name: string; grammar: Grammar }[] = [
		{ name: 'ntgml-legacy.tmLanguage.json', grammar: buildGrammar(false, tables) },
		{ name: 'ntgml.tmLanguage.json', grammar: buildGrammar(true, tables) },
	];

	const problems: string[] = [];
	for (const file of files) {
		for (const p of validate(file.grammar)) { problems.push(file.name + ': ' + p); }
	}

	// Bail before writing anything: a half-valid grammar on disk is worse than none.
	if (problems.length > 0) {
		console.error('');
		console.error('SELF-CHECK FAILED:');
		for (const p of problems) { console.error('  ' + p); }
		process.exit(1);
	}

	fs.mkdirSync(outDir, { recursive: true });
	for (const file of files) {
		const json = JSON.stringify(file.grammar, null, '\t').replace(/\r\n/g, '\n') + '\n';
		fs.writeFileSync(path.join(outDir, file.name), json, 'utf8');
		console.log(
			file.name.padEnd(30) + ' ' + file.grammar.scopeName.padEnd(20) + ' ' +
			Object.keys(file.grammar.repository).length + ' repository entries, ' +
			(json.length / 1024).toFixed(1) + ' KiB'
		);
	}

	console.log('');
	console.log('events:       ' + eventNames.length);
	console.log('functions:    ' + tables.plainFunctions.length + ' plain, ' +
		tables.selfFunctions.length + ' self');
	console.log('constants:    ' + tables.otherConstants.length + ' plain' +
		tables.constantFamilies.map((f) => ', ' + f.names.length + ' ' + f.scope.split('.')[2]).join(''));
	console.log('variables:    ' + tables.builtinVars.length + ' built-in, ' +
		tables.argumentVars.length + ' argument slots');
	console.log('assets:       ' + (assets.objects.length + assets.sprites.length + assets.masks.length +
		assets.shaders.length + assets.sounds.length + assets.music.length + assets.ambience.length +
		assets.fonts.length));
	console.log('custom fields:' + customObjectFields.length);
	console.log('wrote ' + files.length + ' file(s) to ' +
		path.relative(ROOT, outDir).replace(/\\/g, '/') + '/');

	console.log('self-checks:  ok');
}

if (require.main === module) { main(); }

/**
 * The completion / hover / signature-help model (scope section 5.4).
 *
 * Everything under `src/provider/` is free of `vscode` imports, so it runs
 * here on plain Node. The goldens are the assertions:
 *
 *   - `provider/items.txt` and `provider/context-items.txt` are a one-line
 *     summary of every item that can be offered, so any change in item
 *     building, sorting or `detail` shows up as a diff;
 *   - `provider/documentation.md` renders one sample per annotation form;
 *   - `provider/context.json` resolves one cursor scenario per rule;
 *   - `provider/signature.json` resolves one call per scanner case;
 *   - `provider/offered.txt` is the top of the list per context, which is
 *     where the sort tiers become visible.
 */

import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { test } from 'node:test';

import { functions } from '../src/generated/functions';
import { CursorInput, detectContext, objectArgIndices } from '../src/provider/context';
import { renderArg, requiredArgs } from '../src/provider/format';
import {
	baseItems,
	buttonItems,
	eventItems,
	fieldItems,
	functionItem,
	itemsFor,
	lookupItem,
	pragmaItems,
} from '../src/provider/items';
import { ItemData, ItemKind } from '../src/provider/model';
import { signatureAt } from '../src/provider/signature';
import { customObjects } from '../src/tables/custom-objects';
import { modTypes } from '../src/tables/events';
import {
	builtinConstants,
	keywords,
	preprocessorDirectives,
	softKeywords,
} from '../src/tables/keywords';
import { FunctionInfo, KeywordInfo } from '../src/tables/types';
import { FIXTURES, ROOT, duplicates, expectGolden, lf, read, stableJson } from './helpers';

const SRC = path.join(ROOT, 'src');
const PROVIDER_SRC = path.join(SRC, 'provider');

/** `kind<TAB>name<TAB>sortText<TAB>detail`, one line per item. */
function summarise(items: ItemData[]): string {
	return items.map((i) => [i.kind, i.name, i.sortText, i.detail].join('\t')).join('\n') + '\n';
}

/** Fixture lines, without comments and blanks. */
function cases(file: string): string[] {
	return lf(read(path.join(FIXTURES, 'provider', file)))
		.split('\n')
		.filter((line) => line.length > 0 && line.charAt(0) !== '#');
}

/** Splits a `<>`-marked line into the text before and after the cursor. */
function splitCursor(line: string): { prefix: string; suffix: string } {
	const at = line.indexOf('<>');
	assert.ok(at >= 0, 'case has no <> cursor marker: ' + line);
	return { prefix: line.slice(0, at), suffix: line.slice(at + 2) };
}

/** Parses one `context-cases.txt` line into the provider's input record. */
function parseContextCase(line: string): CursorInput {
	const fields = line.split(' | ');
	assert.ok(fields.length === 3 || fields.length === 4, 'malformed case: ' + line);
	const linePrefix = splitCursor(fields[2]).prefix;
	const before = fields.length === 4 ? fields[3].replace(/\\n/g, '\n') : '';
	return {
		languageId: fields[1],
		fileName: fields[0],
		linePrefix,
		// VS Code passes a bounded slice ending at the cursor, and the head of
		// the file for the dialect. The cases are short enough to be both.
		precedingText: before + linePrefix,
		headText: before + linePrefix,
	};
}

// --- item building -------------------------------------------------------

test('items: every base item as one line', () => {
	expectGolden('provider/items.txt', summarise(baseItems()));
});

test('items: context-only families as one line each', () => {
	const sections: string[] = [];
	for (const type of modTypes) {
		sections.push('## events .' + type + '\n' + summarise(eventItems(type)));
	}
	for (const object of customObjects) {
		sections.push('## fields ' + object.name + '\n' + summarise(fieldItems(object.name)));
	}
	// Six of the 489 generated entries, not all of them: every object would
	// be tens of thousands of golden lines that nobody reads, and these six
	// are the shapes that can break. `Player` is a deep chain (and the object
	// mods touch most), `hitme` is the base it inherits from, `UberCont`
	// carries the docs-only and hand-added fields, `GmlMod` is `{ * }` with
	// nothing but a docs page, `WepPickup` is a page whose built-in was
	// dropped, and `CustomEnemy` is a hand-written object that also has a
	// fields.gml entry, so it shows the two tables merged.
	for (const name of ['Player', 'hitme', 'UberCont', 'GmlMod', 'WepPickup', 'CustomEnemy']) {
		sections.push('## fields ' + name + '\n' + summarise(fieldItems(name)));
	}
	sections.push('## fields (unresolved receiver)\n' + summarise(fieldItems()));
	sections.push('## buttons (outside a string)\n' + summarise(buttonItems(false)));
	sections.push('## buttons (inside a string)\n' + summarise(buttonItems(true)));
	sections.push('## pragmas\n' + summarise(pragmaItems()));
	expectGolden('provider/context-items.txt', sections.join('\n'));
});

test('items: no name is offered by two base items', () => {
	assert.deepEqual(duplicates(baseItems().map((i) => i.name)), []);
});

/** The hand tables, with the kind each one is offered as. */
const HAND_TABLES: { label: string; list: KeywordInfo[]; kind: ItemKind }[] = [
	{ label: 'keywords', list: keywords, kind: 'keyword' },
	{ label: 'builtinConstants', list: builtinConstants, kind: 'builtin-constant' },
	{ label: 'softKeywords', list: softKeywords, kind: 'soft-keyword' },
	{ label: 'preprocessorDirectives', list: preprocessorDirectives, kind: 'preprocessor' },
];

/**
 * `fork`, `null` and `undefined` are in a hand table *and* in the dump. The
 * merge must keep the hand entry's kind, its tier and its documentation -
 * dropping it silently is the bug this guards.
 */
test('items: no hand-table entry loses its kind, tier or documentation', () => {
	const index: { [name: string]: ItemData } = {};
	for (const item of baseItems()) { index[item.name] = item; }
	// Offered on their own they do nothing; `#region` is what mods write.
	const notOffered = ['region', 'endregion'];
	for (const table of HAND_TABLES) {
		for (const entry of table.list) {
			const item = index[entry.name];
			const where = table.label + ' entry ' + entry.name;
			if (notOffered.indexOf(entry.name) >= 0) {
				assert.equal(item, undefined, where + ' should not be offered');
				continue;
			}
			assert.ok(item !== undefined, where + ' is not offered at all');
			assert.equal(item.kind, table.kind, where + ' is offered as ' + item.kind);
			assert.equal(item.sortText.charAt(0), '2', where + ' is in the wrong tier');
			assert.ok(item.documentation.indexOf(entry.doc ?? '') >= 0,
				where + ' lost its documentation: ' + item.documentation);
		}
	}
	// The merged entries keep what the dump knows as well.
	assert.ok(index['fork'].documentation.indexOf('fork()') >= 0);
	assert.ok(index['null'].documentation.indexOf('Built-in') >= 0);
});

test('items: a function snippet has one placeholder per required argument', () => {
	const byName: { [name: string]: FunctionInfo } = {};
	for (const fn of functions) { byName[fn.name] = fn; }
	for (const item of baseItems()) {
		if (item.kind !== 'function') { continue; }
		const placeholders = item.insertText.match(/\$\{\d+:/g);
		const count = placeholders === null ? 0 : placeholders.length;
		assert.equal(count, requiredArgs(byName[item.name]).length,
			item.name + ' inserts ' + item.insertText);
	}
});

test('items: dialect gating hides the modern keywords in legacy files', () => {
	const modernOnly = ['function', 'new', 'static', 'constructor'];
	const legacy = itemsFor(detectContext({
		languageId: 'ntgml-legacy', fileName: 'a.mod.gml', linePrefix: 'var a = ',
	})).map((i) => i.name);
	const modern = itemsFor(detectContext({
		languageId: 'ntgml', fileName: 'a.mod.ntgml', linePrefix: 'var a = ',
	})).map((i) => i.name);
	for (const name of modernOnly) {
		assert.ok(legacy.indexOf(name) < 0, name + ' should be hidden in legacy');
		assert.ok(modern.indexOf(name) >= 0, name + ' should be offered in modern');
	}
	// Nothing else is hidden.
	assert.equal(legacy.length + modernOnly.length, modern.length);
});

test('items: the NTT tier holds the NTT-only families', () => {
	const index: { [name: string]: ItemData } = {};
	for (const item of baseItems()) { index[item.name] = item; }
	const nttOnly = [
		'trace', 'trace_color', 'fork', 'mod_load', 'mod_script_call',
		'script_bind_step', 'script_ref_create', 'script_get_index',
		'chat_comp_add', 'crown_get_pick', 'game_set_seed',
		'random_nonsync', 'game_screen_get_width_nonsync', 'sprite_add_weapon',
		'native_array_concat', 'lq_get', 'draw_text_nt', 'draw_tooltip',
		'string_auto', 'surface_valid', 'sprite_duplicate_ext', 'is_builtin',
	];
	for (const name of nttOnly) {
		const item = index[name];
		assert.ok(item !== undefined, 'no item named ' + name);
		assert.equal(item.sortText.charAt(0), '2', name + ' should be in the NTT tier');
	}
	// A plain GameMaker function stays generic, including the two that read
	// like NTT additions but ship with GameMaker itself.
	assert.equal(index['abs'].sortText.charAt(0), '3');
	assert.equal(index['ds_map_create'].sortText.charAt(0), '3');
	assert.equal(index['game_restart'].sortText.charAt(0), '3');
	assert.equal(index['script_get_name'].sortText.charAt(0), '3');
});

// --- documentation -------------------------------------------------------

/**
 * One sample per annotation form of NTGML-SPEC.md section 5, plus one entry
 * per non-generated family. The dump has no deprecated (`&`) entry, so that
 * rendering path is covered by a hand-built `FunctionInfo` below.
 */
const DOC_SAMPLES: string[] = [
	'abs', 'alarm_set', 'weapon_get_name', 'instance_create', 'instance_destroy',
	'instances_matching', 'array_filter', 'string_length', 'event_perform',
	'vertex_format_add_color', 'vertex_format_add_colour',
	'wep_assault_rifle', 'maxp', 'c_orange',
	'mouse_x', 'argument_count', 'x', 'current_frame',
	'sprMutant1Idle', 'mskAlly', 'sndAllyDead', 'mus1', 'fntChat', 'shd16', 'Player',
	'wait', 'fork', 'null', 'function', '#pragma', 'sound_play',
	// A bare `...` rest argument, which must not render as `......`.
	'array_insert',
];

const DEPRECATED_SAMPLE: FunctionInfo = {
	name: 'not_a_real_function',
	args: [{ name: 'map', optional: false, rest: false }],
	returns: true,
	selfCtx: 0,
	raw: false,
	pure: false,
	deprecated: true,
	spelling: null,
	category: 'Maps',
	signature: 'not_a_real_function(map):&',
};

test('documentation: one sample per annotation form', () => {
	const index: { [name: string]: ItemData } = {};
	for (const item of baseItems()) { index[item.name] = item; }
	const parts: string[] = [];
	const render = (item: ItemData): void => {
		parts.push('=== ' + item.kind + ' ' + item.name + ' ===\n'
			+ 'detail: ' + item.detail + '\n'
			+ 'insert: ' + item.insertText + (item.snippet ? '  [snippet]' : '') + '\n\n'
			+ item.documentation);
	};
	for (const name of DOC_SAMPLES) {
		const item = index[name];
		assert.ok(item !== undefined, 'no item named ' + name);
		render(item);
	}
	const event = eventItems('mod').find((e) => e.name === 'chat_command');
	const areaEvent = eventItems('area').find((e) => e.name === 'area_name');
	const field = fieldItems('CustomHitme').find((f) => f.name === 'on_hurt');
	const pragma = pragmaItems().find((p) => p.name === 'using');
	const button = buttonItems(false).find((b) => b.name === 'nort');
	// The generated field table has four renderings: a plain fields.gml
	// name inherited from a parent, one the docs page gave a type and
	// prose, one that only the docs page knows about, and one added by
	// hand from the changelog. Each carries its own provenance line.
	const inherited = fieldItems('Player').find((f) => f.name === 'my_health');
	const typed = fieldItems('Player').find((f) => f.name === 'ammo');
	const docsOnly = fieldItems('Player').find((f) => f.name === 'stuckfor');
	const handField = fieldItems('UberCont').find((f) => f.name === 'opt');
	for (const item of [event, areaEvent, field, pragma, button,
		inherited, typed, docsOnly, handField]) {
		assert.ok(item !== undefined);
		render(item);
	}
	// The dump has no deprecated entry, so the `&` path is driven by hand
	// through the same item builder the real entries go through.
	const deprecated = functionItem(DEPRECATED_SAMPLE);
	assert.equal(deprecated.deprecated, true);
	assert.equal(deprecated.sortText.charAt(1), '2', 'deprecated entries rank last');
	parts.push('(synthetic entry: the dump has no deprecated function)');
	render(deprecated);
	expectGolden('provider/documentation.md', parts.join('\n\n') + '\n');
});

// --- context rules -------------------------------------------------------

test('context: one scenario per rule', () => {
	const results = cases('context-cases.txt').map((line) => ({
		case: line,
		context: detectContext(parseContextCase(line)),
	}));
	expectGolden('provider/context.json', stableJson(results));
});

test('context: object-argument heuristic', () => {
	assert.deepEqual(objectArgIndices('instance_create'), [2]);
	assert.deepEqual(objectArgIndices('instances_matching'), [0]);
	assert.deepEqual(objectArgIndices('collision_line'), [4]);
	// The reflection-style `object_*` family names its argument `ind`.
	assert.deepEqual(objectArgIndices('object_exists'), [0]);
	assert.deepEqual(objectArgIndices('object_get_name'), [0]);
	assert.deepEqual(objectArgIndices('object_is_ancestor'), [0, 1]);
	// `variable_struct_filter(obj, ...)` names a struct, not an object.
	assert.deepEqual(objectArgIndices('variable_struct_filter'), []);
	assert.deepEqual(objectArgIndices('sound_play'), []);
});

test('context: nothing is offered in comments, strings or unknown member access', () => {
	const empty: { linePrefix: string; precedingText?: string }[] = [
		{ linePrefix: '// a ' },
		{ linePrefix: 'trace("hello ' },
		{ linePrefix: 'inst.' },
		{ linePrefix: '/* note ' },
		// Opened on an earlier line: only the multi-line scan catches these.
		{ linePrefix: 'still a ', precedingText: '/* note\nstill a ' },
		{ linePrefix: 'b', precedingText: 'trace("start\nb' },
	];
	for (const entry of empty) {
		const items = itemsFor(detectContext({
			languageId: 'ntgml-legacy',
			fileName: 'a.mod.gml',
			linePrefix: entry.linePrefix,
			precedingText: entry.precedingText ?? entry.linePrefix,
		}));
		assert.deepEqual(items, [], 'expected no items for ' + JSON.stringify(entry));
	}
	// A file with no mod type has no reserved events to offer.
	assert.deepEqual(itemsFor(detectContext({
		languageId: 'ntgml-legacy', fileName: 'plain.gml', linePrefix: '#define ',
	})), []);
});

test('context: a preprocessor word is replaced from its #', () => {
	const ctx = detectContext({
		languageId: 'ntgml-legacy', fileName: 'a.mod.gml', linePrefix: '  #def',
	});
	assert.equal(ctx.word, '#def');
	assert.equal(ctx.wordStart, 2);
	// Inside a string a `#` starts a colour literal, not a word.
	const colour = detectContext({
		languageId: 'ntgml-legacy', fileName: 'a.mod.gml', linePrefix: 'draw_text(x, y, "#ff',
	});
	assert.equal(colour.word, 'ff');
});

// --- ranking -------------------------------------------------------------

const OFFERED: { label: string; input: CursorInput }[] = [
	{
		label: 'declaration line in a .wep file',
		input: { languageId: 'ntgml-legacy', fileName: 'gun.wep.gml', linePrefix: '#define ' },
	},
	{
		label: 'after #pragma',
		input: { languageId: 'ntgml-legacy', fileName: 'gun.wep.gml', linePrefix: '#pragma ' },
	},
	{
		label: 'button name inside a string',
		input: {
			languageId: 'ntgml-legacy', fileName: 'a.mod.gml',
			linePrefix: 'if (button_check(0, "',
		},
	},
	{
		label: 'button name outside a string',
		input: {
			languageId: 'ntgml-legacy', fileName: 'a.mod.gml',
			linePrefix: 'if (button_check(0, ',
		},
	},
	{
		label: 'object argument',
		input: {
			languageId: 'ntgml-legacy', fileName: 'a.mod.gml',
			linePrefix: 'with (instances_matching(',
		},
	},
	{
		label: 'with statement',
		input: { languageId: 'ntgml-legacy', fileName: 'a.mod.gml', linePrefix: 'with (' },
	},
	{
		label: 'exact name typed',
		input: { languageId: 'ntgml-legacy', fileName: 'a.mod.gml', linePrefix: 'x = abs' },
	},
	{
		label: 'on_ prefix with a resolved receiver',
		input: {
			languageId: 'ntgml-legacy', fileName: 'a.mod.gml',
			linePrefix: '    on_',
			precedingText: 'with (CustomEnemy) {\n    on_',
		},
	},
	{
		// The 125 fields a `Player` has, own and inherited, sort above the
		// whole built-in table. Exactly one generated field name collides
		// with a base item anywhere in the table (`Crown.new`, the modern
		// keyword), which is why `labelDescription` marks the field items.
		label: 'inside a with (Player) body',
		input: {
			languageId: 'ntgml-legacy', fileName: 'a.mod.gml',
			linePrefix: '    ',
			precedingText: 'with (Player) {\n    ',
		},
	},
	{
		// The one place in the whole table where a field name collides with a
		// base item: `Crown.new` against the modern `new` keyword. Both are
		// offered here, which is what `labelDescription` is for - without it the
		// duplicate check below would fail on this list.
		label: 'inside a with (Crown) body, modern dialect',
		input: {
			languageId: 'ntgml', fileName: 'a.mod.ntgml',
			linePrefix: '    ',
			precedingText: 'with (Crown) {\n    ',
		},
	},
	{
		// A closed `with (Player)` block between the creation and the callback
		// must not steal the receiver: `Player` has no `on_` names, so the
		// `CustomEnemy` callbacks would simply vanish from the list.
		label: 'on_ after a CustomEnemy creation, past a closed with (Player) block',
		input: {
			languageId: 'ntgml-legacy', fileName: 'a.mod.gml',
			linePrefix: 'e.on_',
			precedingText: 'var e = instance_create(x, y, CustomEnemy);\nwith (Player) { speed = 1; }\n',
		},
	},
];

test('items: the top of the list per context', () => {
	const parts = OFFERED.map((entry) => {
		const items = itemsFor(detectContext(entry.input));
		const top = items.slice().sort((a, b) => (a.sortText < b.sortText ? -1 : 1)).slice(0, 12);
		return '## ' + entry.label + ' (' + items.length + ' items)\n'
			+ top.map((i) => [i.sortText, i.kind, i.name, i.insertText].join('\t')).join('\n');
	});
	expectGolden('provider/offered.txt', parts.join('\n\n') + '\n');
});

/**
 * Merged lists put two families in one dropdown, and a few names are in both
 * (`exit` is a button and a keyword). Two entries may share a name only when
 * something tells them apart in the UI.
 */
test('items: every offered list is free of indistinguishable duplicates', () => {
	for (const entry of OFFERED) {
		const items = itemsFor(detectContext(entry.input));
		assert.deepEqual(duplicates(items.map((i) => i.kind + ' ' + i.name)), [],
			entry.label + ' offers one name twice for one kind');
		const seen: { [key: string]: true } = {};
		for (const item of items) {
			const key = item.name + '\t' + (item.labelDescription ?? '');
			assert.equal(seen[key], undefined,
				entry.label + ': ' + item.name + ' is offered twice with the same label');
			seen[key] = true;
		}
	}
});

// --- hover ---------------------------------------------------------------

test('hover: resolves the word in its context', () => {
	const hover = (fileName: string, linePrefix: string): string | undefined => {
		const item = lookupItem(detectContext({
			languageId: fileName.endsWith('.ntgml') ? 'ntgml' : 'ntgml-legacy',
			fileName,
			linePrefix,
			precedingText: linePrefix,
		}));
		return item === undefined ? undefined : item.kind + ' ' + item.name;
	};
	assert.equal(hover('a.mod.gml', 'x = abs'), 'function abs');
	assert.equal(hover('a.mod.gml', '#pragma fast'), 'pragma fast');
	assert.equal(hover('a.mod.gml', '#pragma'), 'preprocessor #pragma');
	assert.equal(hover('a.mod.gml', '#define'), 'preprocessor #define');
	assert.equal(hover('gun.wep.gml', '#define weapon_fire'), 'event weapon_fire');
	assert.equal(hover('a.mod.gml', '#define chat_command'), 'event chat_command');
	// `weapon_fire` is reserved in `.wep` files only, so a `.mod` file has no
	// declaration to document here.
	assert.equal(hover('a.mod.gml', '#define weapon_fire'), undefined);
	assert.equal(hover('a.mod.gml', 'if (button_check(0, "nort'), 'button nort');
	assert.equal(hover('a.mod.gml', 'on_step'), 'field on_step');
	assert.equal(hover('a.mod.gml', 'obj.on_step'), 'field on_step');
	assert.equal(hover('a.mod.gml', 'x = Player'), 'object Player');
	// The game's own objects resolve through the generated table, including
	// names they inherit; an object the vendored fields.gml never saw is
	// not a receiver at all, so nothing after its dot resolves.
	assert.equal(hover('a.mod.gml', 'Player.wep'), 'field wep');
	assert.equal(hover('a.mod.gml', 'Player.my_health'), 'field my_health');
	assert.equal(hover('a.mod.gml', 'Player.nonsense'), undefined);
	assert.equal(hover('a.mod.gml', 'MultiMenu.wep'), undefined);
	assert.equal(hover('a.mod.gml', 'global.frac'), undefined);
	assert.equal(hover('a.mod.gml', '// abs'), undefined);

	// A hovered field says which object in the chain declares it.
	const inherited = lookupItem(detectContext({
		languageId: 'ntgml-legacy', fileName: 'a.mod.gml',
		linePrefix: 'Player.my_health', precedingText: 'Player.my_health',
	}));
	assert.ok(inherited !== undefined);
	assert.equal(inherited.detail,
		'instance variable of Player (inherited from hitme)');
});

// --- signature help ------------------------------------------------------

test('signature help: one scenario per scanner case', () => {
	const results = cases('signature-cases.txt').map((line) => {
		const data = signatureAt(splitCursor(line.replace(/\\n/g, '\n')).prefix);
		return {
			case: line,
			signature: data === undefined
				? null
				: { label: data.label, activeParameter: data.activeParameter },
		};
	});
	expectGolden('provider/signature.json', stableJson(results));
});

test('signature help: every parameter range covers its rendered argument', () => {
	for (const fn of functions) {
		const data = signatureAt(fn.name + '(');
		assert.ok(data !== undefined, 'no signature for ' + fn.name);
		assert.equal(data.parameters.length, fn.args.length, fn.name);
		fn.args.forEach((a, i) => {
			const [start, end] = data.parameters[i].label;
			assert.equal(data.label.slice(start, end), renderArg(a),
				fn.name + ' parameter ' + i + ' in ' + data.label);
		});
	}
});

// --- layering ------------------------------------------------------------

/** Every module specifier imported (or required) by a TypeScript source. */
function importsOf(source: string): string[] {
	const out: string[] = [];
	const pattern = /(?:from\s+|require\(\s*)(['"])([^'"]+)\1/g;
	let match = pattern.exec(source);
	while (match !== null) {
		out.push(match[2]);
		match = pattern.exec(source);
	}
	return out;
}

/** The file a relative specifier points at, or `undefined` for a package. */
function resolveImport(fromFile: string, spec: string): string | undefined {
	if (spec.charAt(0) !== '.') { return undefined; }
	return path.join(path.dirname(fromFile), spec) + '.ts';
}

function sources(dir: string): string[] {
	return fs.readdirSync(dir).filter((f) => f.endsWith('.ts')).map((f) => path.join(dir, f));
}

/**
 * The architecture rule: nothing `src/provider/` reaches, however indirectly,
 * may import `vscode` - otherwise this test file could not run on plain Node.
 */
test('src/provider imports no vscode, transitively', () => {
	const queue = sources(PROVIDER_SRC);
	assert.ok(queue.length > 0);
	const seen: { [file: string]: true } = {};
	while (queue.length > 0) {
		const file = queue.pop() as string;
		if (seen[file] === true) { continue; }
		seen[file] = true;
		const source = read(file);
		for (const spec of importsOf(source)) {
			assert.notEqual(spec, 'vscode',
				path.relative(ROOT, file) + ' must not import vscode');
			const next = resolveImport(file, spec);
			if (next !== undefined) { queue.push(next); }
		}
	}
	// The walk really did leave `src/provider`.
	const visited = Object.keys(seen);
	for (const dir of ['generated', 'tables']) {
		assert.ok(visited.some((f) => f.indexOf(path.join(SRC, dir)) === 0),
			'the import walk never reached src/' + dir);
	}
});

test('src/generated and src/tables do not import src/provider', () => {
	for (const dir of ['generated', 'tables']) {
		for (const file of sources(path.join(SRC, dir))) {
			for (const spec of importsOf(read(file))) {
				const target = resolveImport(file, spec);
				assert.ok(target === undefined || target.indexOf(PROVIDER_SRC) !== 0,
					path.relative(ROOT, file) + ' must not import ' + spec);
			}
		}
	}
});

/**
 * Rendering: signature strings, snippet insert text and the Markdown shown by
 * both `CompletionItem.documentation` and the hover provider.
 *
 * Every function here is pure and free of `vscode` imports. The layout of a
 * rendered block is always the same:
 *
 *   1. a fenced `ntgml` code block with the rendered signature or declaration;
 *   2. a bullet list of notes (category, self/other context, return, flags);
 *   3. the docs prose from `api/ntt-docs` (`src/generated/docs.ts`), if any.
 */

import { docFor } from '../generated/docs';
import { constantByName } from '../generated/constants';
import { functionByName } from '../generated/functions';
import {
	ArgInfo,
	ConstantInfo,
	CustomObjectField,
	FunctionInfo,
	KeywordInfo,
	ModEventInfo,
	ModType,
	PragmaInfo,
	VariableInfo,
} from '../tables/types';

/** `${raw}` written so it cannot be read as a template placeholder. */
const RAW_MARKER = '`$' + '{raw}`';

/** Arguments a call must pass: everything that is neither optional nor rest. */
export function requiredArgs(fn: FunctionInfo): ArgInfo[] {
	return fn.args.filter((a) => !a.optional && !a.rest);
}

/**
 * One argument, close to the `api.gml` spelling but normalised: the three
 * ways of writing optional (`?arg`, `[arg]`, `arg=default`) all render with a
 * leading `?`, and a type is spaced out as `arg: type`. The unnamed `:type`
 * form (`sound_play(:sound)`) has only a type to show, so it renders as the
 * bare type name. A rest argument written as a bare `...` parses with `...`
 * for its name, so the leading `...` is not added twice.
 */
export function renderArg(a: ArgInfo): string {
	let out = a.name === '' ? (a.type ?? 'value') : a.name;
	if (a.type !== undefined && a.name !== '') { out += ': ' + a.type; }
	if (a.default !== undefined) { out += ' = ' + a.default; }
	if (a.rest) { return out === '...' ? out : '...' + out; }
	if (a.optional) { return '?' + out; }
	return out;
}

/**
 * The rendered signature together with the `[start, end)` offset of every
 * argument inside it. Signature help must highlight a parameter by offset:
 * a string label is resolved by first match, which picks the wrong argument
 * whenever two render the same (`matrix_multiply(matrix: array, matrix:
 * array)`).
 */
export function renderSignatureParts(fn: FunctionInfo): { label: string; ranges: [number, number][] } {
	const ranges: [number, number][] = [];
	let label = fn.name + '(';
	fn.args.forEach((a, i) => {
		if (i > 0) { label += ', '; }
		const text = renderArg(a);
		ranges.push([label.length, label.length + text.length]);
		label += text;
	});
	label += ')';
	if (fn.returnType !== undefined) {
		label += ' -> ' + fn.returnType;
	} else if (fn.returns) {
		label += ' -> value';
	}
	return { label, ranges };
}

/** `weapon_get_name(wep) -> value`, the cleaner twin of `fn.signature`. */
export function renderSignature(fn: FunctionInfo): string {
	return renderSignatureParts(fn).label;
}

/** Escapes the characters a TextMate snippet treats specially. */
export function escapeSnippet(text: string): string {
	return text.replace(/[\\$}]/g, (c) => '\\' + c);
}

/**
 * Snippet insert text: `${n:arg}` placeholders for the required arguments
 * only, so optional and rest arguments are never inserted. An unnamed `:type`
 * argument uses its type as the placeholder text. A function with no required
 * arguments inserts `name($0)`, leaving the cursor between the parentheses so
 * an optional argument can be typed straight away.
 */
export function renderSnippet(fn: FunctionInfo): string {
	const required = requiredArgs(fn);
	if (required.length === 0) { return fn.name + '($0)'; }
	const parts = required.map(
		(a, i) => '${' + (i + 1) + ':' + escapeSnippet(a.name === '' ? (a.type ?? 'value') : a.name) + '}');
	return fn.name + '(' + parts.join(', ') + ')$0';
}

/**
 * The other half of a US/UK spelling pair, when the dump has one. The `$`/`£`
 * flags mark that a twin exists but never name it, so it is derived from the
 * two spelling differences that occur in the API (`color`/`colour`,
 * `normalized`/`normalised`). Constants carry the flags too (`c_gray` /
 * `c_grey`), so both tables are consulted.
 */
export function spellingTwin(name: string): string | undefined {
	const swaps: [RegExp, string][] = [
		[/colour/g, 'color'],
		[/color/g, 'colour'],
		[/ised/g, 'ized'],
		[/ized/g, 'ised'],
	];
	for (const [pattern, replacement] of swaps) {
		if (!pattern.test(name)) { continue; }
		const candidate = name.replace(pattern, replacement);
		if (candidate === name) { continue; }
		if (functionByName(candidate) !== undefined) { return candidate; }
		if (constantByName(candidate) !== undefined) { return candidate; }
	}
	return undefined;
}

function spellingNote(name: string, spelling: 'us' | 'uk'): string {
	const twin = spellingTwin(name);
	const side = spelling === 'us' ? 'US' : 'UK';
	const other = spelling === 'us' ? 'UK' : 'US';
	return twin === undefined
		? side + ' spelling of a US/UK twin pair.'
		: side + ' spelling; the ' + other + '-spelled twin is `' + twin + '`.';
}

/** The `//{ group` fold marker as a note, when the entry has one. */
function categoryNote(category: string): string[] {
	return category === '' ? [] : ['Category: ' + category];
}

function selfCtxNote(fn: FunctionInfo): string[] {
	switch (fn.selfCtx) {
		case 1: return ['Uses `self`.'];
		case 2: return ['Uses `self` and `other`.'];
		case 3: return ['Uses `self`, and may use `other`.'];
		default: return [];
	}
}

/**
 * The prose from `api/ntt-docs`, if any. A `group: true` entry is the shared
 * lead-in of a signature list rather than a description of this name, so it is
 * labelled as such instead of being passed off as specific documentation.
 */
export function docsSection(name: string): string[] {
	const entry = docFor(name);
	if (entry === undefined) { return []; }
	if (entry.group === true) {
		return [
			'_Section lead-in from `' + entry.source + '`, not written for `' + name + '` specifically:_',
			entry.markdown,
		];
	}
	return [entry.markdown];
}

/** Joins non-empty blocks with a blank line between them. */
function blocks(parts: string[]): string {
	return parts.filter((p) => p.length > 0).join('\n\n');
}

function codeBlock(text: string): string {
	return '```ntgml\n' + text + '\n```';
}

function bullets(notes: string[]): string {
	return notes.length === 0 ? '' : notes.map((n) => '- ' + n).join('\n');
}

function functionNotes(fn: FunctionInfo): string[] {
	const notes: string[] = [
		...categoryNote(fn.category),
		...selfCtxNote(fn),
	];
	if (fn.raw) { notes.push('Receives the raw calling context (' + RAW_MARKER + ').'); }
	if (fn.returnType !== undefined) {
		notes.push('Returns `' + fn.returnType + '`.');
	} else if (fn.returns) {
		notes.push('Returns a value.');
	}
	if (fn.pure) { notes.push('Pure: the result depends only on the arguments.'); }
	if (fn.spelling !== null) { notes.push(spellingNote(fn.name, fn.spelling)); }
	if (fn.deprecated) { notes.push('**Deprecated.**'); }
	return notes;
}

/** Markdown for a function: rendered signature, notes, docs prose. */
export function functionDocumentation(fn: FunctionInfo): string {
	return blocks([
		codeBlock(renderSignature(fn)),
		bullets(functionNotes(fn)),
		...docsSection(fn.name),
	]);
}

/**
 * The same block for signature help, but headed by the raw `api.gml` line -
 * the rendered signature is already the signature label there.
 */
export function signatureDocumentation(fn: FunctionInfo): string {
	return blocks([
		codeBlock(fn.signature),
		bullets(functionNotes(fn)),
		...docsSection(fn.name),
	]);
}

/** One line about a single argument, for a signature-help parameter. */
export function argDocumentation(a: ArgInfo): string {
	const notes: string[] = [];
	if (a.rest) {
		notes.push('Rest argument: any number of values.');
	} else if (a.optional) {
		notes.push('Optional.');
	} else {
		notes.push('Required.');
	}
	if (a.type !== undefined) { notes.push('Type `' + a.type + '`.'); }
	if (a.default !== undefined) { notes.push('Defaults to `' + a.default + '`.'); }
	return notes.join(' ');
}

/** `name = value` when the dump gives a value, else just the name. */
export function renderConstant(c: ConstantInfo): string {
	return c.value === undefined ? c.name : c.name + ' = ' + String(c.value);
}

export function constantDocumentation(c: ConstantInfo): string {
	const notes: string[] = categoryNote(c.category);
	if (c.spelling !== null) { notes.push(spellingNote(c.name, c.spelling)); }
	if (c.deprecated) { notes.push('**Deprecated.**'); }
	return blocks([codeBlock(renderConstant(c)), bullets(notes), ...docsSection(c.name)]);
}

/** `view_xview[player]*: number`, the `api.gml` spelling of a variable. */
export function renderVariable(v: VariableInfo): string {
	let out = v.name;
	if (v.perPlayer) { out += '[player]'; }
	if (v.readOnly) { out += '*'; }
	if (v.constant) { out += '#'; }
	if (v.type !== undefined) { out += ': ' + v.type; }
	return out;
}

export function variableDocumentation(v: VariableInfo): string {
	const notes: string[] = categoryNote(v.category);
	if (v.builtin) { notes.push('Built-in instance variable.'); }
	if (v.perPlayer) { notes.push('Per-player array: index it with a player slot, `' + v.name + '[player]`.'); }
	if (v.readOnly) { notes.push('Read-only (`*`).'); }
	if (v.constant) { notes.push('Constant (`#`).'); }
	if (v.type !== undefined) { notes.push('Type `' + v.type + '`.'); }
	return blocks([codeBlock(renderVariable(v)), bullets(notes), ...docsSection(v.name)]);
}

/** Human-readable name of an asset namespace, e.g. `sprites` -> `sprite`. */
export function assetKindLabel(kind: string): string {
	switch (kind) {
		case 'sprites': return 'sprite';
		case 'masks': return 'mask';
		case 'shaders': return 'shader';
		case 'sounds': return 'sound';
		case 'music': return 'music track';
		case 'ambience': return 'ambience track';
		case 'fonts': return 'font';
		default: return 'object';
	}
}

export function assetDocumentation(name: string, kind: string): string {
	const label = assetKindLabel(kind);
	return blocks([
		codeBlock(name),
		bullets(['Built-in NTT ' + label + '.']),
		...docsSection(name),
	]);
}

/** Markdown for a keyword, built-in constant, soft keyword or directive. */
export function keywordDocumentation(k: KeywordInfo, label: string): string {
	const notes: string[] = [label];
	if (k.dialect === 'modern') {
		notes.push('Modern dialect only (`.ntgml`, or `#pragma gml 2`).');
	}
	return blocks([codeBlock(k.name), bullets(notes), k.doc ?? '']);
}

/** `#pragma using <mod.type[.ext]>` as it should be written. */
export function renderPragma(p: PragmaInfo): string {
	return '#pragma ' + p.name + (p.arg === undefined ? '' : ' <' + p.arg + '>');
}

export function pragmaDocumentation(p: PragmaInfo): string {
	const notes: string[] = [
		p.scope === 'file'
			? 'File-level directive: write it outside any function body.'
			: 'Statement directive: write it inside a function body.',
	];
	if (p.arg !== undefined) { notes.push('Takes one argument, `' + p.arg + '`.'); }
	return blocks([codeBlock(renderPragma(p)), bullets(notes), p.doc ?? '']);
}

/** `#define chat_command(command, parameter, player)`. */
export function renderEvent(e: ModEventInfo): string {
	return e.args.length === 0 ? e.name : e.name + '(' + e.args.join(', ') + ')';
}

export function eventDocumentation(e: ModEventInfo, type: ModType): string {
	const notes: string[] = ['Reserved `.' + type + '` event.'];
	notes.push(e.engine
		? 'Dispatched by the engine.'
		: 'Not dispatched by the engine: a mod-local convention, completed because real mods define it.');
	if (e.note !== undefined) { notes.push(e.note); }
	return blocks([codeBlock('#define ' + renderEvent(e)), bullets(notes), e.doc ?? '']);
}

/**
 * `owners` is every custom object the field can be set on, inherited ones
 * included, so the note says "Available on" rather than "Declared by".
 */
export function fieldDocumentation(field: CustomObjectField, owners: string[]): string {
	const notes: string[] = owners.length === 0
		? []
		: ['Available on ' + owners.map((o) => '`' + o + '`').join(', ') + '.'];
	return blocks([codeBlock(field.name), bullets(notes), field.doc ?? '']);
}

export function buttonDocumentation(name: string, doc: string): string {
	return blocks([
		codeBlock('"' + name + '"'),
		bullets(['Input button name accepted by `button_check` and friends.']),
		doc,
	]);
}

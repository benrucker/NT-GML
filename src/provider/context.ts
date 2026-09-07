/**
 * Text-based cursor context rules (scope section 5.4).
 *
 * The caller passes the strings it has - the current line up to the cursor,
 * a bounded window of the text before it, and the head of the file - and gets
 * a plain descriptor back, which `test/provider.test.ts` snapshots. No
 * `vscode` import.
 *
 * Two windows keep the per-keystroke cost independent of document size:
 * `HEAD_LIMIT` characters from the top of the file for the file-level
 * `#pragma gml 2`, and `WINDOW_LIMIT` characters before the cursor for
 * everything else. The preceding window is snapped forward to the last
 * `#define` / `function` line in it, which is both cheaper and more accurate:
 * the previous script's `with` blocks and unclosed brackets are not ours.
 */

import { functions } from '../generated/functions';
import { customObject } from '../tables/custom-objects';
import { knownFieldObject } from '../tables/object-fields';
import { modTypeFromFileName } from '../tables/events';
import { ModType } from '../tables/types';

/** Characters from the top of the file scanned for `#pragma gml 2`. */
export const HEAD_LIMIT = 2048;

/** Characters before the cursor the rules look at. */
export const WINDOW_LIMIT = 4000;

/** What the cursor position asks for. */
export type ContextKind =
	/** Inside a comment, or a place where built-in names are wrong. */
	| 'none'
	/** Anything goes: the full identifier table. */
	| 'general'
	/** On a `#define`/`function` declaration line: reserved mod events. */
	| 'event'
	/** After `#pragma `: pragma names. */
	| 'pragma'
	/** After `#pragma gml `: the dialect version. */
	| 'pragma-value'
	/** In the button-name argument of a `button_*` call. */
	| 'button'
	/** Callback fields of a custom object. */
	| 'field';

/** What the caller knows about the cursor. */
export interface CursorInput {
	/** `ntgml` (modern) or `ntgml-legacy`. */
	languageId: string;
	/** File name or path; the middle extension picks the mod type. */
	fileName: string;
	/** The current line, up to (not including) the cursor. */
	linePrefix: string;
	/**
	 * Document text before the cursor, ending with `linePrefix`. Only the last
	 * `WINDOW_LIMIT` characters are read. Optional; without it the rules see
	 * the current line alone.
	 */
	precedingText?: string;
	/** First `HEAD_LIMIT` characters of the document, for `#pragma gml 2`. */
	headText?: string;
	/** Dialect, when the caller has it cached; skips the head scan. */
	dialect?: 'legacy' | 'modern';
}

/** The innermost unclosed call before the cursor. */
export interface CallContext {
	/** Identifier before the `(`; `''` for a grouping paren. */
	name: string;
	/** Zero-based index of the argument the cursor sits in. */
	argIndex: number;
}

/** The resolved context. This object is what the tests snapshot. */
export interface CursorContext {
	dialect: 'legacy' | 'modern';
	modType: ModType | null;
	kind: ContextKind;
	/** Identifier prefix immediately before the cursor, `#` included. */
	word: string;
	/** Column in the line where `word` starts: the replacement range's start. */
	wordStart: number;
	/** The cursor sits inside a string literal. */
	inString: boolean;
	/** The cursor sits inside a comment. */
	inComment: boolean;
	/** The word follows a `.`. */
	member: boolean;
	/** The cursor sits in an argument that takes an object (rank objects up). */
	objectArg: boolean;
	/** Innermost unclosed call, when there is one. */
	call?: CallContext;
	/** Custom object whose fields to offer, when one was resolved. */
	objectName?: string;
}

// --- scanning ------------------------------------------------------------

function isIdentChar(c: string): boolean {
	return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c === '_';
}

function isDigit(c: string): boolean {
	return c >= '0' && c <= '9';
}

function isSpace(c: string): boolean {
	return c === ' ' || c === '\t' || c === '\r' || c === '\n';
}

/**
 * Start of the identifier ending at `end`, or `end` when there is none.
 *
 * Walks backwards a character at a time: a `$`-anchored regex has to retry
 * from every position on the line, which is quadratic on the long generated
 * lines real mods contain. A run that starts with a digit is a number, not an
 * identifier. With `hash`, a leading `#` is taken in so `#define` and
 * `#pragma` are one word - VS Code's own word range stops at the `#`, which
 * would make the item insert `##define`.
 */
function wordStartBefore(text: string, end: number, hash: boolean): number {
	let start = end;
	while (start > 0 && isIdentChar(text.charAt(start - 1))) { start--; }
	if (start < end && isDigit(text.charAt(start))) { return end; }
	if (hash && start > 0 && text.charAt(start - 1) === '#') { return start - 1; }
	return start;
}

/** The identifier ending just before `index`, ignoring whitespace. */
function identifierBefore(text: string, index: number): string {
	let end = index;
	while (end > 0 && isSpace(text.charAt(end - 1))) { end--; }
	const start = wordStartBefore(text, end, false);
	return start === end ? '' : text.slice(start, end);
}

interface CallFrame {
	name: string;
	argIndex: number;
	/** Depth of `[`/`{` inside the current argument; commas there do not count. */
	brackets: number;
}

interface TextScan {
	/** Open quote character at the end of the scan, or `''`. */
	quote: string;
	/** The scan ends inside a line or block comment. */
	inComment: boolean;
	calls: CallFrame[];
}

/**
 * Walks the window, tracking strings, comments and the call/bracket stack.
 * Block comments and strings carry across lines, so a cursor inside either
 * is recognised even when it opened on an earlier line.
 *
 * Backslash escapes the next character inside a string. Legacy NTGML has no
 * escape sequences (NTGML-SPEC.md section 2.3), but treating `\` that way
 * costs nothing and keeps modern `"\""` from swallowing the rest of the line.
 *
 * `mask`, when given, is filled with one entry per character: the character
 * itself where it is live code, a space where it belongs to a string or a
 * comment (newlines survive, so nothing moves between lines). Callers that
 * run a pattern over the window use it so the pattern cannot match quoted or
 * commented-out code, and offsets in the mask are offsets in the window.
 */
function scanText(text: string, mask?: string[]): TextScan {
	if (mask !== undefined) {
		for (let i = 0; i < text.length; i++) {
			mask[i] = text.charAt(i) === '\n' ? '\n' : ' ';
		}
	}
	const calls: CallFrame[] = [];
	let quote = '';
	let block = false;
	let lineComment = false;
	for (let i = 0; i < text.length; i++) {
		const c = text.charAt(i);
		const next = text.charAt(i + 1);
		if (lineComment) {
			if (c === '\n') { lineComment = false; }
			continue;
		}
		if (block) {
			if (c === '*' && next === '/') { block = false; i++; }
			continue;
		}
		if (quote !== '') {
			if (c === '\\') { i++; continue; }
			if (c === quote) { quote = ''; }
			continue;
		}
		if (c === '/' && next === '/') { lineComment = true; i++; continue; }
		if (c === '/' && next === '*') { block = true; i++; continue; }
		if (c === '"' || c === '\'' || c === '`') { quote = c; continue; }
		if (mask !== undefined) { mask[i] = c; }
		if (c === '(') {
			calls.push({ name: identifierBefore(text, i), argIndex: 0, brackets: 0 });
			continue;
		}
		if (c === ')') { calls.pop(); continue; }
		const top = calls.length === 0 ? undefined : calls[calls.length - 1];
		if (top === undefined) { continue; }
		if (c === '[' || c === '{') { top.brackets++; continue; }
		if ((c === ']' || c === '}') && top.brackets > 0) { top.brackets--; continue; }
		if (c === ',' && top.brackets === 0) { top.argIndex++; }
	}
	return { quote, inComment: lineComment || block, calls };
}

/**
 * Innermost *named* call frame. Grouping parentheses (`(a + b)`) push an
 * unnamed frame; signature help walks past those to the enclosing call.
 */
function innermostCall(scan: TextScan): CallFrame | undefined {
	for (let i = scan.calls.length - 1; i >= 0; i--) {
		if (scan.calls[i].name !== '') { return scan.calls[i]; }
	}
	return undefined;
}

const DECLARATION_START = /^[ \t]*(?:#define|function)\b/gm;

/** How many trailing declaration candidates `contextWindow` probes. */
const DECLARATION_PROBES = 8;

/** Offsets of every `#define` / `function` line in `text`, in order. */
function declarationStarts(text: string): number[] {
	DECLARATION_START.lastIndex = 0;
	const out: number[] = [];
	let match = DECLARATION_START.exec(text);
	while (match !== null) {
		if (match.index > 0) { out.push(match.index); }
		match = DECLARATION_START.exec(text);
	}
	return out;
}

/**
 * The slice of the text before the cursor that the rules scan: at most
 * `WINDOW_LIMIT` characters, and starting at the enclosing `#define` /
 * `function` line when the window contains one, since anything before that
 * belongs to another script.
 *
 * A declaration only marks a script boundary when it is live code: both words
 * also occur inside block comments and multi-line strings, and starting there
 * would drop the opening delimiter and make the rest of the comment look like
 * code. So candidates are tried from the last backwards and the first one
 * whose own prefix scans clean wins; if none does, the whole window is used.
 * Only the last `DECLARATION_PROBES` candidates are probed: each probe rescans
 * the prefix, and a real file has a live declaration within the last one or
 * two, so the bound only matters while a `/*` or `"` is still open above.
 *
 * The window starts at a line boundary except when a single line is longer
 * than `WINDOW_LIMIT`, in which case it starts mid-line and the rules see a
 * truncated line - the same caveat `src/completionProvider.ts` carries.
 */
export function contextWindow(text: string): string {
	let window = text.length > WINDOW_LIMIT ? text.slice(text.length - WINDOW_LIMIT) : text;
	if (window.length < text.length) {
		const nl = window.indexOf('\n');
		window = nl < 0 ? window : window.slice(nl + 1);
	}
	const starts = declarationStarts(window);
	for (let i = starts.length - 1; i >= Math.max(0, starts.length - DECLARATION_PROBES); i--) {
		const before = scanText(window.slice(0, starts[i]));
		if (before.quote === '' && !before.inComment) { return window.slice(starts[i]); }
	}
	return window;
}

// --- table-derived heuristics -------------------------------------------

/**
 * Functions whose Nth argument is a button name: every `button_*` entry in the
 * dump with an argument literally named `button` (`button_check`,
 * `button_pressed`, `button_released` and their `_nonsync` twins).
 */
const buttonArgs: { [name: string]: number } = (() => {
	const out: { [name: string]: number } = {};
	for (const fn of functions) {
		if (fn.name.indexOf('button_') !== 0) { continue; }
		const index = fn.args.findIndex((a) => a.name === 'button');
		if (index >= 0) { out[fn.name] = index; }
	}
	return out;
})();

/** Argument index of the button name in `name`, or `undefined`. */
export function buttonArgIndex(name: string): number | undefined {
	return Object.prototype.hasOwnProperty.call(buttonArgs, name) ? buttonArgs[name] : undefined;
}

/**
 * Functions that take an object index, so object names should rank first
 * there. Heuristic over the dump:
 *
 *   - an argument typed `object`, or named `obj`, `object`, `obj_or_array` or
 *     `object_or_array`;
 *   - the reflection-style `object_*` family, whose argument is named `ind`
 *     (`object_exists(ind)`, `object_is_ancestor(ind_child, ind_parent)`).
 *
 * The `Reflection` category is excluded because `variable_struct_filter(obj,
 * ...)`/`_map` name a *struct* `obj` and are the only false positives the
 * first rule produces.
 */
const objectArgs: { [name: string]: number[] } = (() => {
	const out: { [name: string]: number[] } = {};
	for (const fn of functions) {
		if (fn.category === 'Reflection') { continue; }
		const objectFamily = fn.name.indexOf('object_') === 0;
		const indices: number[] = [];
		fn.args.forEach((a, i) => {
			if (a.type === 'object' || /^(obj|object)(_or_array)?$/.test(a.name)) {
				indices.push(i);
			} else if (objectFamily && /^ind(_child|_parent)?$/.test(a.name)) {
				indices.push(i);
			}
		});
		if (indices.length > 0) { out[fn.name] = indices; }
	}
	return out;
})();

/** Argument indices of `name` that take an object, `[]` when it takes none. */
export function objectArgIndices(name: string): number[] {
	return Object.prototype.hasOwnProperty.call(objectArgs, name) ? objectArgs[name] : [];
}

// --- rules ---------------------------------------------------------------

const PRAGMA_LINE = /^[ \t]*#pragma\s+\w*$/;
const PRAGMA_GML_EMPTY = /^[ \t]*#pragma\s+gml\s+$/;
const PRAGMA_GML_VALUE = /^[ \t]*#pragma\s+gml\s+\S+$/;
const DECLARATION_LINE = /^[ \t]*(?:#define|function)\s+[A-Za-z0-9_]*$/;
const GML2_PRAGMA = /^[ \t]*#pragma[ \t]+gml[ \t]+2\b/m;
const WITH_RECEIVER = /(?:^|[^A-Za-z0-9_.])with\s*\(?\s*[A-Za-z0-9_]*$/;

/**
 * The nearest `Custom*` object named before the cursor, in `with (CustomX)`,
 * `with CustomX` or `instance_create*(x, y, CustomX)`.
 *
 * Deliberately narrow. `on_*` callbacks exist on the `Custom*` objects and
 * nowhere else, so widening this to all 489 objects buys nothing and costs a
 * lot: any `with (Player)` earlier in the window - even one whose body has
 * closed again - would shadow the `CustomEnemy` the callback belongs to, and
 * `Player` has no `on_` names to offer in its place.
 */
const CUSTOM_RECEIVER =
	/(?:^|[^A-Za-z0-9_.])(?:with\s*\(\s*|with\s+|instance_create\w*\s*\((?:[^()]*,)?\s*)(Custom[A-Za-z]*)/g;

/**
 * Any known object, but in a `with` head only. A `with` body really does put
 * the object's whole field set in scope; naming an object in an
 * `instance_create` argument does not, so the two receivers are not
 * interchangeable.
 */
const WITH_OBJECT_RECEIVER = /(?:^|[^A-Za-z0-9_.])(?:with\s*\(\s*|with\s+)([A-Za-z_]\w*)/g;

/**
 * An object whose instance variables we can offer: one of the 13 hand-written
 * `Custom*` entries, or one of the objects the 2025-07-16 `fields.gml` lists.
 */
export function knownObject(name: string): boolean {
	return customObject(name) !== undefined || knownFieldObject(name);
}

/** The last `Custom*` receiver in the masked window, `with` or created. */
function lastCustomReceiver(masked: string): string | undefined {
	let found: string | undefined;
	CUSTOM_RECEIVER.lastIndex = 0;
	let match = CUSTOM_RECEIVER.exec(masked);
	while (match !== null) {
		if (customObject(match[1]) !== undefined) { found = match[1]; }
		match = CUSTOM_RECEIVER.exec(masked);
	}
	return found;
}

/**
 * The window with every string and comment blanked out, so a receiver pattern
 * run over it cannot match a `with (Player)` that is only mentioned in prose
 * or quoted in a string. One extra walk of the (at most 4 KB) window.
 */
function maskWindow(window: string): string {
	const mask: string[] = new Array(window.length);
	scanText(window, mask);
	return mask.join('');
}

/**
 * Whether the `with` body whose head ends at `from` is still open at the end
 * of the masked window - that is, at the cursor.
 *
 * `from` is the offset just past the object name, so the `)` of the
 * parenthesised form is stepped over first. `with (Obj) { ... }` then runs
 * until its brace closes: count from the `{` and stop when the depth returns
 * to zero. `with (Obj) stmt;` governs a single statement, so it ends at the
 * first `;` or line break. Braces, semicolons and quotes inside strings and
 * comments are already blanked, so this needs no tokenizer of its own.
 */
function withBodyOpen(masked: string, from: number): boolean {
	let start = from;
	while (start < masked.length && isSpace(masked.charAt(start))) { start++; }
	if (masked.charAt(start) === ')') {
		start++;
		while (start < masked.length && isSpace(masked.charAt(start))) { start++; }
	}
	if (masked.charAt(start) !== '{') {
		for (let i = from; i < masked.length; i++) {
			const c = masked.charAt(i);
			if (c === ';' || c === '\n') { return false; }
		}
		return true;
	}
	let depth = 0;
	for (let i = start; i < masked.length; i++) {
		const c = masked.charAt(i);
		if (c === '{') { depth++; continue; }
		if (c === '}' && --depth === 0) { return false; }
	}
	return true;
}

/**
 * The object of the innermost `with` body the cursor is still inside, or
 * `undefined` outside every one of them. Later matches win, so a `with` nested
 * inside another reports the inner object while both are open.
 */
function openWithReceiver(masked: string): string | undefined {
	let found: string | undefined;
	WITH_OBJECT_RECEIVER.lastIndex = 0;
	let match = WITH_OBJECT_RECEIVER.exec(masked);
	while (match !== null) {
		const end = match.index + match[0].length;
		if (knownObject(match[1]) && withBodyOpen(masked, end)) { found = match[1]; }
		match = WITH_OBJECT_RECEIVER.exec(masked);
	}
	return found;
}

/**
 * Dialect for the file. `ntgml` is modern; a legacy file that opts in with a
 * file-level `#pragma gml 2` is modern too. Only the head of the file is
 * scanned - the directive is file level, so it belongs at the top.
 */
export function dialectFor(languageId: string, headText?: string): 'legacy' | 'modern' {
	if (languageId === 'ntgml') { return 'modern'; }
	if (headText !== undefined && GML2_PRAGMA.test(headText.slice(0, HEAD_LIMIT))) { return 'modern'; }
	return 'legacy';
}

/** What a rule is handed: the raw input, the context so far, and the window. */
interface RuleInput {
	input: CursorInput;
	ctx: CursorContext;
	window: string;
}

type Rule = (r: RuleInput) => CursorContext | undefined;

/** Comments take everything: no built-in name belongs in one. */
const commentRule: Rule = ({ ctx }) =>
	(ctx.inComment ? { ...ctx, kind: 'none' } : undefined);

/** Inside a string only the button-name rule fires. */
const stringRule: Rule = ({ ctx }) => {
	if (!ctx.inString) { return undefined; }
	if (ctx.call !== undefined && buttonArgIndex(ctx.call.name) === ctx.call.argIndex) {
		return { ...ctx, kind: 'button' };
	}
	return { ...ctx, kind: 'none' };
};

/**
 * `#pragma ` offers the pragma names, `#pragma gml ` the dialect version, and
 * a `#pragma gml` line whose version is already written offers nothing.
 */
const pragmaRule: Rule = ({ input, ctx }) => {
	if (PRAGMA_GML_EMPTY.test(input.linePrefix)) { return { ...ctx, kind: 'pragma-value' }; }
	if (PRAGMA_GML_VALUE.test(input.linePrefix)) { return { ...ctx, kind: 'none' }; }
	if (PRAGMA_LINE.test(input.linePrefix)) { return { ...ctx, kind: 'pragma' }; }
	return undefined;
};

/** A `#define` / `function` declaration line names a reserved mod event. */
const eventRule: Rule = ({ input, ctx }) =>
	(DECLARATION_LINE.test(input.linePrefix) ? { ...ctx, kind: 'event' } : undefined);

/** The button-name argument of a `button_*` call, outside a string. */
const buttonRule: Rule = ({ ctx }) =>
	(ctx.call !== undefined && buttonArgIndex(ctx.call.name) === ctx.call.argIndex
		? { ...ctx, kind: 'button' }
		: undefined);

/**
 * Member access. A known object receiver resolves to that object's instance
 * variables; on any other receiver an `on_` prefix is still specific enough
 * for the field list, and anything else is not ours to complete.
 */
const memberRule: Rule = ({ input, ctx }) => {
	if (!ctx.member) { return undefined; }
	const receiver = identifierBefore(input.linePrefix, ctx.wordStart - 1);
	if (knownObject(receiver)) {
		return { ...ctx, kind: 'field', objectName: receiver };
	}
	return ctx.word.indexOf('on_') === 0 ? undefined : { ...ctx, kind: 'none' };
};

/**
 * Object fields: the `Custom*` callbacks and the game's own instance variables.
 *
 * The two prefixes are bounded differently, on purpose.
 *
 * An `on_` prefix asks for the callback fields anywhere in the window, of
 * whichever `Custom*` object was last named in it - a `with` receiver or an
 * `instance_create` argument, since `inst.on_step = ...` a few lines after
 * creating `inst` is the usual way a callback gets assigned. That reach is
 * unbounded by design: the assignment is normally OUTSIDE any `with` body,
 * and there is nothing to confuse it with, because only `Custom*` objects
 * have `on_` names. With no receiver in the window the word still resolves,
 * to the union of every `Custom*` callback.
 *
 * A word with no prefix only asks for fields inside a `with (Obj)` body, where
 * the object's plain fields (`maxhealth`, `candie`, `hitid`, or `Player`'s
 * `wep` and `my_health`) really are in scope. An `instance_create` argument
 * does not put them in scope, so it does not count here, and here the body IS
 * bounded: the receiver is dropped once its `{ ... }` has closed, or - for a
 * brace-less `with (Obj) stmt` - at the first `;` or line break, so one
 * `with (Player)` near the top of the window does not tilt every completion
 * below it.
 *
 * Either way `itemsFor` merges the fields into the general list at the
 * context tier rather than replacing it.
 */
const fieldRule: Rule = ({ ctx, window }) => {
	const masked = maskWindow(window);
	if (ctx.word.indexOf('on_') === 0) {
		const objectName = lastCustomReceiver(masked);
		const out: CursorContext = { ...ctx, kind: 'field' };
		if (objectName !== undefined) { out.objectName = objectName; }
		return out;
	}
	const receiver = openWithReceiver(masked);
	if (receiver === undefined) { return undefined; }
	return { ...ctx, kind: 'field', objectName: receiver };
};

/**
 * Arguments that take an object index, and `with (...)`, which is the most
 * common place a modder types an object name. The kind stays `general`: the
 * whole table is still offered, with object names ranked to the top.
 */
const objectArgRule: Rule = ({ input, ctx }) => {
	const inCall = ctx.call !== undefined
		&& objectArgIndices(ctx.call.name).indexOf(ctx.call.argIndex) >= 0;
	if (!inCall && !WITH_RECEIVER.test(input.linePrefix)) { return undefined; }
	return { ...ctx, objectArg: true };
};

/**
 * The rules that decide the kind, first match winning. `objectArgRule` is not
 * one of them: it refines whatever kind the chain settled on, so a call that
 * takes an object index still offers that kind's items.
 */
const RULES: Rule[] = [
	commentRule,
	stringRule,
	pragmaRule,
	eventRule,
	buttonRule,
	memberRule,
	fieldRule,
];

/** Resolves what to offer at the cursor. */
export function detectContext(input: CursorInput): CursorContext {
	const window = contextWindow(input.precedingText ?? input.linePrefix);
	const scan = scanText(window);
	const call = innermostCall(scan);
	const inString = scan.quote !== '';
	// `#` is part of the word outside strings only: `"#rrggbb"` is a colour.
	const wordStart = wordStartBefore(input.linePrefix, input.linePrefix.length, !inString);
	const ctx: CursorContext = {
		dialect: input.dialect ?? dialectFor(input.languageId, input.headText),
		modType: modTypeFromFileName(input.fileName),
		kind: 'general',
		word: input.linePrefix.slice(wordStart),
		wordStart,
		inString,
		inComment: scan.inComment,
		member: !inString && wordStart > 0 && input.linePrefix.charAt(wordStart - 1) === '.',
		objectArg: false,
	};
	if (call !== undefined) { ctx.call = { name: call.name, argIndex: call.argIndex }; }

	let out = ctx;
	for (const test of RULES) {
		const matched = test({ input, ctx, window });
		if (matched !== undefined) { out = matched; break; }
	}
	// Nothing is offered in a `none` context, so there is no ranking to refine.
	if (out.kind === 'none') { return out; }
	return objectArgRule({ input, ctx: out, window }) ?? out;
}

/**
 * The call the cursor is inside, for signature help: the innermost named,
 * unclosed call in the context window, with the comma count at its own depth.
 * Commas and parentheses inside strings do not count, and a call whose
 * arguments run over several lines still reports. An unterminated string keeps
 * reporting its call, so the signature stays up while a string argument is
 * typed; a comment ends the scan.
 */
export function findCall(text: string): CallContext | undefined {
	const scan = scanText(contextWindow(text));
	if (scan.inComment) { return undefined; }
	const call = innermostCall(scan);
	return call === undefined ? undefined : { name: call.name, argIndex: call.argIndex };
}

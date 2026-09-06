/**
 * Parser for the NTT `/gmlapi` annotation format (`api.gml`, `default.gml`,
 * `raw-*.gml`), producing a plain typed model.
 *
 * The regexes are ported from GMEdit's `src/parsers/GmlParseAPI.hx` (MIT,
 * vendored at `api/reference/GmlParseAPI.hx`); each one names the source line.
 * Format reference: `NTGML-SPEC.md` §5.
 *
 * This module is intentionally pure: no fs, no process, no console. A later
 * step (the TextMate grammar emitter) reuses the same model.
 *
 * NOTE: the interfaces below mirror `src/tables/types.ts` exactly. They are
 * duplicated rather than imported because `tools/` and `src/` are separate
 * TypeScript projects with disjoint `rootDir`s.
 */

// --- model ---------------------------------------------------------------

export type SelfCtx = 0 | 1 | 2 | 3;
export type Spelling = 'us' | 'uk' | null;

export interface ArgInfo {
	name: string;
	type?: string;
	optional: boolean;
	rest: boolean;
	default?: string;
}

export interface FunctionInfo {
	name: string;
	args: ArgInfo[];
	returns: boolean;
	returnType?: string;
	selfCtx: SelfCtx;
	raw: boolean;
	pure: boolean;
	deprecated: boolean;
	spelling: Spelling;
	category: string;
	signature: string;
}

export interface ConstantInfo {
	name: string;
	value?: number | string;
	category: string;
	spelling: Spelling;
	deprecated: boolean;
}

export interface VariableInfo {
	name: string;
	readOnly: boolean;
	perPlayer: boolean;
	type?: string;
	constant: boolean;
	category: string;
	builtin: boolean;
}

export interface ApiModel {
	functions: FunctionInfo[];
	constants: ConstantInfo[];
	variables: VariableInfo[];
	/** The dump's `// Generated at ...` header line, without the `// ` prefix. */
	generatedAt: string;
	/** Value of the `game_version` constant, or 0 when absent. */
	gameVersion: number;
}

// --- regexes (ported from GmlParseAPI.hx) --------------------------------

/**
 * Flag characters that may trail a declaration.
 * GmlParseAPI.hx:149 - `([ ~\$#*@&£!:]*)` (rxFuncTail $2).
 * `:` is included there but we split it out below to recover `:type` returns.
 */
const rsFlags = '[ ~$#*@&\u00A3!]*';

/**
 * Function declaration.
 * GmlParseAPI.hx:139-145 - rxFunc is `^(:*)(\w+(?:<.*?>)?\(.+)`; GMEdit then
 * hands `$2` to `GmlFuncDoc.parse`. We inline that split and additionally
 * accept NTT's `${raw}` prefix (GMEdit's `:*` cannot match it), see
 * NTGML-SPEC.md §5.1.
 */
const rxFunc = /^(\$\{(\w+)\}|:{1,3})?(\w+(?:<.*?>)?)\((.*)\)(.*)$/;

/**
 * Tail after the closing paren: flags, optional `:type` return, optional
 * `^featureFlag`, optional `// comment`.
 * GmlParseAPI.hx:146-152 - rxFuncTail.
 */
const rxFuncTail = new RegExp(
	'^(' + rsFlags + ')' +               // $1 -> leading flags
	'(?::([A-Za-z_][\\w.]*)?)?' +        // $2 -> `:` returns, optional type name
	'([ ~$#*@&\u00A3!:]*)' +             // $3 -> trailing flags (may hold more `:`)
	'$'
);

/** GmlParseAPI.hx:151 - `\s*(?:\^(\w*))?` feature flag. */
const rxFeatureFlag = /\s*\^(\w*)\s*$/;

/** GmlParseAPI.hx:152 - `(?://.*)?$` trailing comment. */
const rxTrailingComment = /\/\/.*$/;

/**
 * Constant / variable declaration.
 * GmlParseAPI.hx:236-247 - rxVar:
 *   `^((\w+)(\[.*?\])?([~\*\$£#@&]*))(?:\^(\w*))?(?::(\S+))?[ \t]*(?://.*)?$`
 */
const rxVar = new RegExp(
	'^(' +
		'(\\w+)' +                       // $2 -> name
		'(\\[.*?\\])?' +                 // $3 -> array data
		'([~*$\u00A3#@&]*)' +            // $4 -> flags
	')' +
	'(?:\\^(\\w*))?' +                   // $5 -> feature flag
	'(?::(\\S+))?' +                     // $6 -> type annotation
	'[ \t]*' +
	'(?:\\/\\/.*)?' +
	'$'
);

/** GmlParseAPI.hx:317 - `^(\w+)[ \t]*=[ \t]*(.+)$` constants with a value. */
const rxNamedValue = /^(\w+)[ \t]*=[ \t]*(.+)$/;

/** GMEdit fold markers used as categories (NTGML-SPEC.md §5.3). */
const rxGroupOpen = /^\/\/\{[ \t]*(.*?)[ \t]*$/;
const rxGroupClose = /^\/\/\}/;

/** GmlParseAPI.hx:334 (`loadAssets`) - tokenise a name list on `\w+`. */
const rxAssetName = /\w+/g;

const rxHeader = /^\/\/\s*(Generated at .*)$/;

// --- helpers -------------------------------------------------------------

function hasFlag(flags: string, ch: string): boolean {
	return flags.indexOf(ch) >= 0;
}

function spellingOf(flags: string): Spelling {
	if (hasFlag(flags, '$')) { return 'us'; }
	if (hasFlag(flags, '\u00A3')) { return 'uk'; }
	return null;
}

/** Split an argument list on commas that are not nested in brackets. */
function splitArgs(src: string): string[] {
	const out: string[] = [];
	let depth = 0;
	let start = 0;
	for (let i = 0; i < src.length; i++) {
		const c = src[i];
		if (c === '(' || c === '[' || c === '{' || c === '<') { depth++; }
		else if (c === ')' || c === ']' || c === '}' || c === '>') { depth--; }
		else if (c === ',' && depth <= 0) {
			out.push(src.slice(start, i));
			start = i + 1;
		}
	}
	out.push(src.slice(start));
	return out.map((s) => s.trim()).filter((s) => s.length > 0);
}

/**
 * Parse one argument token.
 * Forms (NTGML-SPEC.md §5.1): `arg` · `?arg` · `[arg]` · `arg=default` ·
 * `...arg` · a bare `...` · `arg:type` · `:type` (unnamed, typed).
 */
export function parseArg(token: string): ArgInfo {
	let s = token.trim();
	let optional = false;
	let rest = false;
	let def: string | undefined;
	let type: string | undefined;

	if (s === '...') {
		return { name: '...', optional: true, rest: true };
	}
	if (s.startsWith('...')) { rest = true; s = s.slice(3).trim(); }
	if (s.startsWith('?')) { optional = true; s = s.slice(1).trim(); }
	if (s.startsWith('[') && s.endsWith(']')) {
		optional = true;
		s = s.slice(1, -1).trim();
		if (s.startsWith('...')) { rest = true; s = s.slice(3).trim(); }
	}
	const eq = s.indexOf('=');
	if (eq >= 0) {
		def = s.slice(eq + 1).trim();
		optional = true;
		s = s.slice(0, eq).trim();
	}
	const colon = s.indexOf(':');
	if (colon >= 0) {
		// `:type` writes the type with no name of its own, as in
		// `sound_play(:sound)`; `arg:type` names it.
		type = s.slice(colon + 1).trim() || undefined;
		s = s.slice(0, colon).trim();
	}
	const arg: ArgInfo = { name: s, optional, rest };
	if (type !== undefined) { arg.type = type; }
	if (def !== undefined) { arg.default = def; }
	return arg;
}

/** `pi = 3.14159...` -> number; `mod_current = "modname"` -> the raw string. */
export function parseValue(raw: string): number | string {
	const t = raw.trim();
	if (/^[-+]?(?:\d+\.?\d*|\.\d+)$/.test(t)) {
		const n = Number(t);
		if (!Number.isNaN(n)) { return n; }
	}
	return t;
}

/** Try to read one function declaration line. Returns null if it is not one. */
export function parseFunctionLine(line: string, category: string): FunctionInfo | null {
	const m = rxFunc.exec(line);
	if (!m) { return null; }
	const prefix = m[1] || '';
	const rawWord = m[2];
	const name = m[3];
	const argsSrc = m[4];
	let tail = m[5];

	// `${raw}` is the only brace prefix NTT emits; anything else is not a
	// function line we understand.
	const raw = prefix.startsWith('${');
	if (raw && rawWord !== 'raw') { return null; }

	let selfCtx: SelfCtx = 0;
	if (!raw && prefix.length > 0) { selfCtx = Math.min(prefix.length, 3) as SelfCtx; }

	tail = tail.replace(rxTrailingComment, '');
	tail = tail.replace(rxFeatureFlag, '');
	tail = tail.replace(/;+\s*$/, ''); // stray `;` (api.gml:612 instance_find)
	tail = tail.trim();

	const mt = rxFuncTail.exec(tail);
	if (!mt) { return null; }
	const flags = (mt[1] || '') + (mt[3] || '');
	const returns = mt[0].indexOf(':') >= 0;
	const returnType = mt[2] || undefined;

	const fn: FunctionInfo = {
		name,
		args: splitArgs(argsSrc).map(parseArg),
		returns,
		selfCtx,
		raw,
		pure: hasFlag(flags, '#'),
		deprecated: hasFlag(flags, '&'),
		spelling: spellingOf(flags),
		category,
		signature: line.trim(),
	};
	if (returnType) { fn.returnType = returnType; }
	return fn;
}

/** Try to read one `name[index][flags][:type]` declaration line. */
export function parseVariableLine(line: string, category: string, builtin: boolean): VariableInfo | null {
	const m = rxVar.exec(line);
	if (!m) { return null; }
	const name = m[2];
	const range = m[3];
	const flags = m[4] || '';
	const type = m[6];
	const v: VariableInfo = {
		name,
		readOnly: hasFlag(flags, '*'),
		perPlayer: range !== undefined && /^\[\s*player\s*\]$/i.test(range),
		constant: hasFlag(flags, '#'),
		category,
		builtin,
	};
	if (type) { v.type = type; }
	return v;
}

// --- entry points --------------------------------------------------------

/**
 * Parse an `api.gml` (or `api/overrides.gml`, same syntax).
 * Lines must start at column 0, as in GmlParseAPI.hx (`rsStart = "^"`), so
 * indented block-comment bodies are skipped for free.
 */
export function parseApi(src: string): ApiModel {
	const functions: FunctionInfo[] = [];
	const constants: ConstantInfo[] = [];
	const variables: VariableInfo[] = [];
	const groups: string[] = [];
	let generatedAt = '';
	let gameVersion = 0;

	const lines = src.split(/\r?\n/);
	for (const line of lines) {
		if (line.length === 0) { continue; }

		if (!generatedAt) {
			const h = rxHeader.exec(line);
			if (h) { generatedAt = h[1].trim(); continue; }
		}

		const go = rxGroupOpen.exec(line);
		if (go) { groups.push(go[1]); continue; }
		if (rxGroupClose.test(line)) { groups.pop(); continue; }

		// Comments and indented continuation lines are not declarations.
		if (line.startsWith('/') || line.startsWith('*') || /^\s/.test(line)) { continue; }

		const category = groups.length > 0 ? groups[groups.length - 1] : '';

		const fn = parseFunctionLine(line, category);
		if (fn) { functions.push(fn); continue; }

		const nv = rxNamedValue.exec(line);
		if (nv) {
			const value = parseValue(nv[2].replace(rxTrailingComment, ''));
			constants.push({
				name: nv[1],
				value,
				category,
				spelling: null,
				deprecated: false,
			});
			if (nv[1] === 'game_version' && typeof value === 'number') { gameVersion = value; }
			continue;
		}

		const v = parseVariableLine(line, category, false);
		if (v) {
			if (v.constant) {
				constants.push({
					name: v.name,
					category,
					spelling: null,
					deprecated: false,
				});
			} else {
				variables.push(v);
			}
		}
	}

	return { functions, constants, variables, generatedAt, gameVersion };
}

/**
 * Parse `default.gml` - the built-in instance variables and argument slots.
 * Same line syntax as `api.gml` variables; every entry is marked `builtin`.
 */
export function parseDefaults(src: string): VariableInfo[] {
	const out: VariableInfo[] = [];
	for (const line of src.split(/\r?\n/)) {
		if (line.length === 0 || line.startsWith('/') || /^\s/.test(line)) { continue; }
		const v = parseVariableLine(line, 'Built-in instance variables', true);
		if (v) { out.push(v); }
	}
	return out;
}

/**
 * Parse a `raw-*.gml` name list. The dump writes every name on one line
 * separated by spaces; GmlParseAPI.hx:334 tokenises the same way.
 */
export function parseRawNames(src: string): string[] {
	const out: string[] = [];
	rxAssetName.lastIndex = 0;
	let m: RegExpExecArray | null;
	while ((m = rxAssetName.exec(src)) !== null) { out.push(m[0]); }
	return out;
}

export const _internal = { rxFunc, rxVar, rxFuncTail, splitArgs };

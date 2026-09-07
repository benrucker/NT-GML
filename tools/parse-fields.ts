/**
 * Parser for the NTT `fields.gml` per-object instance-variable list.
 *
 * `fields.gml` is written by the game itself, by an old `/gmlapi` run; the
 * 100.034 build no longer regenerates it. The file names no game version, but
 * what it lists places the build that wrote it before 100.013 - before 100.007
 * if you also count an upstream docs page this repo does not vendor. The
 * vendored copy lives at `api/ntt-fields-2025-07-16/fields.gml`; that folder's
 * README works both readings out and covers the staleness that follows.
 *
 * Format (from the file's own header):
 *
 *   // Generated at 7/16/2025 10:37:04 PM
 *   // Format is `ObjectName : ParentName { ... variables }
 *   // `default` means support for built-in variables (x, y, sprite_index, etc.)
 *   // `*` means support for mod-defined variables.
 *   Player : hitme { default, footstep, ..., index, * }
 *   GammaBlast { default, creator, team, * }
 *   GmlMod { * }
 *
 * The field lists are FLATTENED: a child repeats everything its parent lists.
 * De-flattening is the generator's job, not this parser's -- `fields` here is
 * exactly what the line says, in the order it says it, with the `default` and
 * `*` markers lifted out into their own booleans.
 *
 * `api/fields-overrides.gml` uses the same syntax and is parsed by the same
 * function.
 *
 * This module is intentionally pure: no fs, no process, no console. Malformed
 * lines throw rather than being skipped, so a future refresh that changes the
 * format fails `pnpm gen` loudly.
 *
 * NOTE: the interfaces below mirror `src/tables/types.ts` exactly. They are
 * duplicated rather than imported because `tools/` and `src/` are separate
 * TypeScript projects with disjoint `rootDir`s.
 */

// --- model ---------------------------------------------------------------

export interface FieldsEntry {
	/** Object name, as written. */
	name: string;
	/** Parent name as written, even when it has no entry of its own. */
	parent?: string;
	/** The `default` marker: the object supports built-in instance variables. */
	builtin: boolean;
	/** The `*` marker: the object supports mod-defined variables. */
	modFields: boolean;
	/** Field names as listed, in order, without the `default` and `*` markers. */
	fields: string[];
}

export interface FieldsModel {
	/** The `// Generated at ...` header line, without the leading `// `. */
	generatedAt: string;
	entries: FieldsEntry[];
}

// The three below mirror `src/tables/types.ts`; see the note at the top.

export type FieldSource = 'docs' | 'hand';

export interface ObjectFieldInfo {
	name: string;
	type?: string;
	doc?: string;
	source?: FieldSource;
}

export interface ObjectFieldsInfo {
	name: string;
	parent?: string;
	builtin: boolean;
	modFields: boolean;
	fields: ObjectFieldInfo[];
}

// --- parser --------------------------------------------------------------

/** `Name` or `Name : Parent` followed by `{ ... }`, nothing else on the line. */
const rxEntry = /^([A-Za-z_]\w*)\s*(?::\s*([A-Za-z_]\w*)\s*)?\{\s*([^{}]*?)\s*\}$/;
const rxStamp = /^\/\/\s*(Generated at .*?)\s*$/;
const rxName = /^[A-Za-z_]\w*$/;

/**
 * Parse a `fields.gml`-syntax file. Comment lines (`//`) and blank lines are
 * skipped; the first `// Generated at ...` comment is kept as the stamp.
 * Anything else that is not a well-formed entry throws.
 */
export function parseFields(src: string): FieldsModel {
	let generatedAt = '';
	const entries: FieldsEntry[] = [];
	for (const raw of src.split('\n')) {
		const line = raw.replace(/\r$/, '').trim();
		if (line.length === 0) { continue; }
		if (line.startsWith('//')) {
			const stamp = rxStamp.exec(line);
			if (stamp !== null && generatedAt === '') { generatedAt = stamp[1]; }
			continue;
		}
		entries.push(parseFieldsLine(line));
	}
	return { generatedAt, entries };
}

/** Parse one `Name : Parent { a, b, * }` line. Throws on anything else. */
export function parseFieldsLine(line: string): FieldsEntry {
	const m = rxEntry.exec(line);
	if (m === null) { throw new Error('fields.gml: malformed line: ' + line); }
	const entry: FieldsEntry = { name: m[1], builtin: false, modFields: false, fields: [] };
	if (m[2] !== undefined) { entry.parent = m[2]; }
	const seen: { [name: string]: true } = {};
	const body = m[3];
	if (body.length > 0) {
		for (const part of body.split(',')) {
			const token = part.trim();
			if (token.length === 0) {
				throw new Error('fields.gml: empty field in: ' + line);
			}
			if (token === 'default') {
				if (entry.builtin) { throw new Error('fields.gml: repeated `default` in: ' + line); }
				entry.builtin = true;
				continue;
			}
			if (token === '*') {
				if (entry.modFields) { throw new Error('fields.gml: repeated `*` in: ' + line); }
				entry.modFields = true;
				continue;
			}
			if (!rxName.test(token)) {
				throw new Error('fields.gml: bad field name `' + token + '` in: ' + line);
			}
			if (seen[token] !== undefined) {
				throw new Error('fields.gml: repeated field `' + token + '` in: ' + line);
			}
			seen[token] = true;
			entry.fields.push(token);
		}
	}
	return entry;
}

export const _internal = { rxEntry, rxStamp };

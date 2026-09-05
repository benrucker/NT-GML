/**
 * Extracts per-function prose from the DocMark sources of the NTT docs
 * (`api/ntt-docs/scripting/*.dmd`) and converts it to Markdown.
 *
 * Two shapes carry documentation:
 *
 *   1. `#[name(args)]() { ...body... }` blocks - the body is that function's
 *      documentation. `#[Heading](anchor) { ... }` blocks use the same syntax
 *      for sections and are skipped (the label has no argument list).
 *      Blocks nest; the closing `}` sits at the opening line's indentation.
 *   2. ```` ```gmblanks ```` / ```` ```ntblanks ```` fences listing bare
 *      signatures. The paragraph immediately above the fence is used as a
 *      short group description for every name in the fence.
 *
 * Pure: no fs, no process, no console.
 */

export interface DocEntry {
	markdown: string;
	source: string;
	/**
	 * True when the prose is the shared lead-in of a signature list rather
	 * than documentation written for this name specifically.
	 */
	group?: boolean;
}

export type DocMap = { [name: string]: DocEntry };

export interface DocSource {
	/** File name only, e.g. `API-Strings.dmd`. */
	name: string;
	text: string;
}

/** `#[label](anchor) {` - a DocMark block opener. */
const rxBlockOpen = /^(\t*)#\[([^\]]*)\]\(([^)]*)\)\s*\{\s*$/;
/** A block label that is a function signature: `name(args)` or `name(args)->`. */
const rxFuncLabel = /^([A-Za-z_]\w*)\s*\(/;
/** ```` ```gmblanks ```` and friends. */
const rxBlanksOpen = /^(\t*)```(gmblanks|ntblanks|blanks)\s*$/;
const rxFenceClose = /^(\t*)```\s*$/;
/** A bare signature inside a blanks fence (function, variable or constant). */
const rxBlanksName = /^(?:\$\{\w+\}|:{1,3})?([A-Za-z_]\w*)/;
/** DocMark grouping markers that have no Markdown equivalent. */
const rxDocMarkGroup = /^\s*--[{}]\s*$/;
/** A bare `[name]` cross-reference (not a `[text](url)` link). */
const rxBareRef = /\[([A-Za-z_]\w*)\](?!\()/g;

function dedent(lines: string[], tabs: number): string[] {
	const prefix = '\t'.repeat(tabs);
	return lines.map((l) => (l.startsWith(prefix) ? l.slice(tabs) : l.replace(/^\t+/, '')));
}

/** Convert a DocMark body to Markdown. */
export function toMarkdown(lines: string[]): string {
	const out: string[] = [];
	for (const line of lines) {
		if (rxDocMarkGroup.test(line)) { continue; }
		let l = line.replace(/```(?:gmblanks|ntblanks|blanks)\s*$/, '```gml');
		l = l.replace(rxBareRef, '`$1`');
		out.push(l.replace(/\s+$/, ''));
	}
	// collapse leading/trailing blank lines
	while (out.length > 0 && out[0] === '') { out.shift(); }
	while (out.length > 0 && out[out.length - 1] === '') { out.pop(); }
	return out.join('\n');
}

/** Find the line index of the `}` that closes a block opened at `open`. */
function findBlockEnd(lines: string[], open: number, indent: number): number {
	const close = '\t'.repeat(indent) + '}';
	for (let i = open + 1; i < lines.length; i++) {
		if (lines[i] === close || lines[i].replace(/\s+$/, '') === close) { return i; }
	}
	return lines.length;
}

/** Paragraph directly above a fence, used as the group description. */
function precedingParagraph(lines: string[], fence: number, indent: number): string[] {
	const out: string[] = [];
	for (let i = fence - 1; i >= 0; i--) {
		const l = lines[i].replace(/\s+$/, '');
		if (l === '') { break; }
		const body = l.slice(indent);
		if (/^\s*```/.test(l) || /^\s*\}/.test(l) || /^\s*#\[/.test(l) || /^\s*---/.test(l)) { break; }
		if (l.length - l.replace(/^\t*/, '').length !== indent) { break; }
		out.unshift(body);
	}
	return out;
}

export function parseDocs(sources: DocSource[]): DocMap {
	const docs: DocMap = {};
	const files = sources.slice().sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

	// Pass 1: dedicated `#[name(args)]() { ... }` blocks win.
	for (const file of files) {
		const lines = file.text.split(/\r?\n/);
		for (let i = 0; i < lines.length; i++) {
			const m = rxBlockOpen.exec(lines[i]);
			if (!m) { continue; }
			const indent = m[1].length;
			const label = m[2];
			const fn = rxFuncLabel.exec(label);
			if (!fn) { continue; }
			const end = findBlockEnd(lines, i, indent);
			const body = toMarkdown(dedent(lines.slice(i + 1, end), indent + 1));
			if (body.length === 0) { continue; }
			const name = fn[1];
			if (docs[name] === undefined) {
				docs[name] = { markdown: body, source: file.name };
			}
		}
	}

	// Pass 2: group descriptions for names that only appear in a blanks fence.
	for (const file of files) {
		const lines = file.text.split(/\r?\n/);
		for (let i = 0; i < lines.length; i++) {
			const m = rxBlanksOpen.exec(lines[i]);
			if (!m) { continue; }
			const indent = m[1].length;
			let end = i + 1;
			while (end < lines.length) {
				const c = rxFenceClose.exec(lines[end]);
				if (c && c[1].length === indent) { break; }
				end++;
			}
			// A lead-in ends in `:` because the fence follows it; drop the
			// colon, and drop bare section labels such as `Alarms:` entirely.
			const desc = toMarkdown(precedingParagraph(lines, i, indent)).replace(/:[ \t]*$/, '');
			if (desc.length < 12) { continue; }
			for (let j = i + 1; j < end; j++) {
				const sig = lines[j].slice(indent).trim();
				if (sig.length === 0) { continue; }
				const nm = rxBlanksName.exec(sig);
				if (!nm) { continue; }
				if (docs[nm[1]] === undefined) {
					docs[nm[1]] = { markdown: desc, source: file.name, group: true };
				}
			}
		}
	}

	return docs;
}

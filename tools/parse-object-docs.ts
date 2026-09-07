/**
 * Parser for the object pages of the Nuclear Throne Together documentation
 * (`api/ntt-docs/objects/*.html`).
 *
 * The pages are machine-generated: YellowAfterlife's `object-info-gen` GMEdit
 * plugin extracts them from the private game project, and the docs repo's
 * `BuildDocs.hx` renders them to HTML. They are the only source for
 * instance-variable TYPES and PROSE, and they list variables the 2025-07-16
 * `fields.gml` does not.
 *
 * Page shape (see `api/ntt-docs/objects/WepPickup.html`, the smallest one):
 *
 *   <title>WepPickup</title> ... <h1 ...>WepPickup</h1>
 *   <!--<doc-->
 *     <p>... a breadcrumb: GameObject -> Pickup -> WepPickup ...</p>
 *     <p>Variables:</p>
 *     <section><header id="G"><a ...>from G</a></header><article>
 *       <a class="sticky-side" ...>...</a>
 *       [<p>lead-in prose</p>]
 *       <section class="empty"><header id="v"><a ...>v: type</a></header></section>
 *       <section><header id="w"><a ...>w</a></header><article><p>prose</p></article></section>
 *     </article></section>
 *     [<p>Alarms: </p><ul>...</ul>]
 *   <!--doc>-->
 *
 * So: a `<header>` whose anchor text starts with `from ` opens a GROUP, any
 * other `<header>` declares a VARIABLE in the group that is currently open.
 * The group name matters: on the `Player` page the variables `hitme` declares
 * sit in a `from hitme` group, and the generator attributes them to `hitme`.
 *
 * Every `<section>` on a page is either a group or a variable, so the section
 * count is checked against the number parsed. `notes` collects two things and
 * only those: a group's lead-in prose, and whatever trails the last
 * `</section>` (the `Alarms:` list, on the four pages that have one). The
 * generator prints the count.
 *
 * The page's intro - everything before the first `<header>` - is deliberately
 * NOT counted, even though some of it is real per-object prose: `GmlMod`
 * opens with "Objects of this kind are used as `self` instance for mods when
 * called without context", `TopCont` with "Draws darkness, HUD, and other
 * things". What is taken from the intro is the `object -> Parent -> Name`
 * breadcrumb, parsed separately into `chain`; the rest - an inline `<style>`
 * block, the boilerplate `Variables:` lead, and that per-object blurb - has no
 * variable to attach to, so nothing here carries it. A page can therefore
 * report `notes: 0` and still have prose in it, as `GmlMod` does.
 *
 * This module is intentionally pure: no fs, no process, no console.
 */

// --- model ---------------------------------------------------------------

export interface ObjectDocVariable {
	/** Variable name (the `<header>` id). */
	name: string;
	/** Id of the `from ...` group the variable sits in. */
	group: string;
	/** Declared type, the text after `: ` in the header, entities decoded. */
	type?: string;
	/** First prose paragraph, plain text, collapsed, truncated to DOC_LIMIT. */
	doc?: string;
}

export interface ObjectDocPage {
	/** Object name, from `<title>`. */
	name: string;
	/** Breadcrumb chain, base class first, ending with `name`. */
	chain: string[];
	/** Group ids in page order. */
	groups: string[];
	variables: ObjectDocVariable[];
	/** Text that is neither a group nor a variable, kept so it can be counted. */
	notes: string[];
}

/** Prose is truncated to this many characters, the ellipsis included. */
export const DOC_LIMIT = 300;

// --- parser --------------------------------------------------------------

const rxTitle = /<title>([^<]*)<\/title>/;
const rxHeader = /<header id="([^"]*)"><a [^>]*>([\s\S]*?)<\/a><\/header>/g;
const rxSectionOpen = /<section\b/g;
/**
 * A variable header reads `name`, `name: type`, or - for the five method
 * fields on the `Player` page - `name(args)` / `name(args): type`. The call
 * form is kept whole as the variable's `type`, since the signature is the only
 * type information the page gives.
 */
const rxLabel = /^(\w+)(\([^()]*\))?(?:\s*:\s*(.+))?$/;
const rxTag = /<[^>]*>/g;
const rxSticky = /<a class="sticky-side"[\s\S]*?<\/a>/;
const rxParagraph = /<p>([\s\S]*?)<\/p>/;

const ENTITIES: { [name: string]: string } = {
	lt: '<', gt: '>', amp: '&', quot: '"', apos: '\'', nbsp: ' ',
};

/** The breadcrumb separator the pages use (U+279C). */
const ARROW = '➜';

/** Decode the handful of entities the pages use, plus numeric ones. */
export function unescapeHtml(text: string): string {
	return text.replace(/&(#\d+|#x[0-9a-fA-F]+|\w+);/g, (all, body: string) => {
		if (body.charAt(0) === '#') {
			const code = body.charAt(1) === 'x'
				? parseInt(body.slice(2), 16)
				: parseInt(body.slice(1), 10);
			return isNaN(code) ? all : String.fromCharCode(code);
		}
		const named = ENTITIES[body];
		return named === undefined ? all : named;
	});
}

/** Strip tags, decode entities, collapse whitespace. */
export function plainText(html: string): string {
	return unescapeHtml(html.replace(rxTag, ' ')).replace(/\s+/g, ' ').trim();
}

function truncate(text: string): string {
	if (text.length <= DOC_LIMIT) { return text; }
	return text.slice(0, DOC_LIMIT - 1).replace(/\s+\S*$/, '') + '…';
}

/** Body between the `<!--<doc-->` markers, which is what the page generator wraps. */
function docBody(html: string): string {
	const open = '<!--<doc-->';
	const start = html.indexOf(open);
	const end = html.indexOf('<!--doc>-->');
	if (start < 0 || end < 0 || end < start) {
		throw new Error('object docs: no <!--<doc--> body');
	}
	return html.slice(start + open.length, end);
}

function breadcrumb(body: string, name: string): string[] {
	for (const chunk of body.split('</p>')) {
		if (chunk.indexOf(ARROW) < 0) { continue; }
		const parts = plainText(chunk).split(ARROW)
			.map((p) => p.trim())
			.filter((p) => p.length > 0);
		if (parts.length > 0 && parts[parts.length - 1] === name) { return parts; }
	}
	return [name];
}

/** A header's own content: up to the next nested or closing section. */
function after(body: string, from: number, limit: number): string {
	let end = limit;
	for (const marker of ['<section', '</section>']) {
		const at = body.indexOf(marker, from);
		if (at >= 0 && at < end) { end = at; }
	}
	return body.slice(from, end);
}

function firstParagraph(chunk: string): string {
	const p = rxParagraph.exec(chunk);
	return plainText(p === null ? chunk : p[1]);
}

function lastSectionEnd(body: string): number {
	const close = '</section>';
	const at = body.lastIndexOf(close);
	return at < 0 ? body.length : at + close.length;
}

/** Parse one `api/ntt-docs/objects/<Object>.html` page. */
export function parseObjectDocs(html: string): ObjectDocPage {
	const title = rxTitle.exec(html);
	if (title === null) { throw new Error('object docs: no <title>'); }
	const name = title[1].trim();
	const body = docBody(html);

	const page: ObjectDocPage = {
		name,
		chain: breadcrumb(body, name),
		groups: [],
		variables: [],
		notes: [],
	};

	const heads: { id: string; label: string; start: number; end: number }[] = [];
	rxHeader.lastIndex = 0;
	let m: RegExpExecArray | null;
	while ((m = rxHeader.exec(body)) !== null) {
		heads.push({ id: m[1], label: plainText(m[2]), start: m.index, end: m.index + m[0].length });
	}

	let group = '';
	for (let i = 0; i < heads.length; i++) {
		const head = heads[i];
		const limit = i + 1 < heads.length ? heads[i + 1].start : body.length;
		const own = after(body, head.end, limit);
		if (head.label.indexOf('from ') === 0) {
			group = head.id;
			page.groups.push(head.id);
			const lead = plainText(own.replace(rxSticky, ' '));
			if (lead.length > 0) { page.notes.push(head.id + ' lead-in: ' + truncate(lead)); }
			continue;
		}
		const label = rxLabel.exec(head.label);
		if (label === null || label[1] !== head.id) {
			throw new Error('object docs: unreadable variable header `' + head.label
				+ '` (id ' + head.id + ')');
		}
		if (group === '') {
			throw new Error('object docs: variable `' + head.id + '` before any group');
		}
		const variable: ObjectDocVariable = { name: head.id, group };
		const declared = label[3] === undefined ? '' : unescapeHtml(label[3]).trim();
		if (label[2] !== undefined) {
			variable.type = label[1] + label[2] + (declared === '' ? '' : ': ' + declared);
		} else if (declared !== '') {
			variable.type = declared;
		}
		const doc = firstParagraph(own);
		if (doc.length > 0) { variable.doc = truncate(doc); }
		page.variables.push(variable);
	}

	const tail = plainText(heads.length === 0 ? body : body.slice(lastSectionEnd(body)));
	if (tail.length > 0) { page.notes.push('tail: ' + truncate(tail)); }

	rxSectionOpen.lastIndex = 0;
	let sections = 0;
	while (rxSectionOpen.exec(body) !== null) { sections++; }
	if (sections !== page.groups.length + page.variables.length) {
		throw new Error('object docs: ' + name + ' has ' + sections + ' sections but '
			+ (page.groups.length + page.variables.length) + ' were classified');
	}
	return page;
}

export const _internal = { rxHeader, rxLabel, truncate, docBody, breadcrumb, after };

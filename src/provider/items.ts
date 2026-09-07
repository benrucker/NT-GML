/**
 * Builds the completion / hover model from `src/generated/*` and
 * `src/tables/*`, and picks what to offer for a cursor context.
 *
 * The item list is built once, lazily, and cached; context-only families
 * (mod events, custom-object fields, pragmas, button names) are built on
 * demand and cached per key. No `vscode` import.
 *
 * ### Sort order
 *
 * `sortText` is `<tier><rank><name>`:
 *
 * | tier | contents |
 * |---|---|
 * | `0` | the item whose name is exactly what has been typed |
 * | `1` | context-only items: mod events, custom-object fields, pragmas, button names, and object names inside an object-taking argument |
 * | `2` | NTT-specific identifiers and the language keywords |
 * | `3` | GM-generic identifiers |
 * | `4` | asset names |
 *
 * `rank` is `0` normally, `1` for a mod event the engine does not dispatch,
 * and `2` for a deprecated entry, so those sort last inside their tier.
 *
 * "NTT-specific" comes from the tables wherever the tables can express it: a
 * function annotated with a self/other prefix or `${raw}`, or in a `... API`
 * fold group, or documented in an `NTT-*.dmd` page; a constant with no fold
 * group (the dump groups the GM-derived families and leaves `wep_*`, `mut_*`,
 * `char_*`, `area_*`, `crwn_*` ungrouped) or one in a `... API` group; a
 * variable that did not come from `default.gml`. About fifty NTT-only
 * functions carry none of those marks - `trace`, the mod loader, script
 * binding, the non-sync family - so `src/tables/ntt-names.ts` lists those
 * families by hand.
 */

import { assetKinds, assets } from '../generated/assets';
import { constants } from '../generated/constants';
import { docFor } from '../generated/docs';
import { functions } from '../generated/functions';
import { variables } from '../generated/variables';
import { buttons } from '../tables/buttons';
import { customObject, customObjects, fieldsFor } from '../tables/custom-objects';
import { declaringObject, fieldsFor as objectFieldsFor } from '../tables/object-fields';
import { eventsFor } from '../tables/events';
import {
	builtinConstants,
	keywords,
	pragmas,
	preprocessorDirectives,
	softKeywords,
} from '../tables/keywords';
import { isNTTName } from '../tables/ntt-names';
import {
	AssetTables,
	CustomObjectField,
	FunctionInfo,
	KeywordInfo,
	ModType,
	ObjectFieldInfo,
} from '../tables/types';
import { CursorContext } from './context';
import {
	assetDocumentation,
	assetKindLabel,
	buttonDocumentation,
	constantDocumentation,
	escapeSnippet,
	eventDocumentation,
	fieldDocumentation,
	functionDocumentation,
	keywordDocumentation,
	objectFieldDocumentation,
	pragmaDocumentation,
	renderConstant,
	renderEvent,
	renderPragma,
	renderSnippet,
	renderVariable,
	variableDocumentation,
} from './format';
import { ItemData, ItemKind } from './model';

const TIER_EXACT = '0';
const TIER_CONTEXT = '1';
const TIER_NTT = '2';
const TIER_GM = '3';
const TIER_ASSET = '4';

const RANK_NORMAL = '0';
const RANK_DEMOTED = '1';
const RANK_DEPRECATED = '2';

function sortText(tier: string, rank: string, name: string): string {
	return tier + rank + name;
}

/** Moves an item into another tier, sharing the object when nothing changes. */
function retier(item: ItemData, tier: string): ItemData {
	if (item.sortText.charAt(0) === tier) { return item; }
	return { ...item, sortText: tier + item.sortText.slice(1) };
}

// --- base items ----------------------------------------------------------

/**
 * One function's item. Exported so the tests can drive it with a hand-built
 * `FunctionInfo`: the dump contains no deprecated (`&`) entry, so nothing else
 * exercises the deprecated rank or flag.
 */
export function functionItem(fn: FunctionInfo): ItemData {
	const doc = docFor(fn.name);
	const ntt = fn.selfCtx > 0 || fn.raw
		|| / API$/.test(fn.category)
		|| (doc !== undefined && doc.source.indexOf('NTT-') === 0)
		|| isNTTName(fn.name);
	return {
		name: fn.name,
		kind: 'function',
		detail: fn.signature,
		insertText: renderSnippet(fn),
		snippet: true,
		documentation: functionDocumentation(fn),
		sortText: sortText(
			ntt ? TIER_NTT : TIER_GM,
			fn.deprecated ? RANK_DEPRECATED : RANK_NORMAL,
			fn.name),
		deprecated: fn.deprecated,
	};
}

function functionItems(): ItemData[] {
	return functions.map(functionItem);
}

function constantItems(): ItemData[] {
	return constants.map((c) => {
		const ntt = c.category === '' || / API$/.test(c.category);
		const detail = c.category === ''
			? renderConstant(c)
			: renderConstant(c) + ' (' + c.category + ')';
		return {
			name: c.name,
			kind: 'constant' as ItemKind,
			detail,
			insertText: c.name,
			snippet: false,
			documentation: constantDocumentation(c),
			sortText: sortText(
				ntt ? TIER_NTT : TIER_GM,
				c.deprecated ? RANK_DEPRECATED : RANK_NORMAL,
				c.name),
			deprecated: c.deprecated,
		};
	});
}

function variableItems(): ItemData[] {
	return variables.map((v) => {
		const detail = v.category === ''
			? renderVariable(v)
			: renderVariable(v) + ' (' + v.category + ')';
		// A per-player variable is always indexed, so insert the index too.
		const insertText = v.perPlayer ? v.name + '[${1:player}]$0' : v.name;
		return {
			name: v.name,
			kind: 'variable' as ItemKind,
			detail,
			insertText,
			snippet: v.perPlayer,
			documentation: variableDocumentation(v),
			sortText: sortText(v.builtin ? TIER_GM : TIER_NTT, RANK_NORMAL, v.name),
			deprecated: false,
		};
	});
}

/** Asset namespace -> item kind; objects are the only non-`Value` kind. */
const ASSET_KINDS: { [K in keyof AssetTables]: ItemKind } = {
	sprites: 'sprite',
	masks: 'mask',
	shaders: 'shader',
	sounds: 'sound',
	music: 'music',
	ambience: 'ambience',
	fonts: 'font',
	objects: 'object',
};

function assetItems(): ItemData[] {
	const out: ItemData[] = [];
	for (const kind of assetKinds) {
		for (const name of assets[kind]) {
			out.push({
				name,
				kind: ASSET_KINDS[kind],
				detail: assetKindLabel(kind),
				insertText: name,
				snippet: false,
				documentation: assetDocumentation(name, kind),
				sortText: sortText(TIER_ASSET, RANK_NORMAL, name),
				deprecated: false,
			});
		}
	}
	return out;
}

/**
 * Soft keywords worth completing. `region` and `endregion` are parsed and
 * ignored on their own; what mods actually write is the `#region` /
 * `#endregion` fold marker, which the preprocessor table already offers. They
 * stay in the table (the grammar highlights them) but are not offered.
 */
function offeredSoftKeywords(): KeywordInfo[] {
	return softKeywords.filter((k) => k.name !== 'region' && k.name !== 'endregion');
}

function keywordItems(list: KeywordInfo[], kind: ItemKind, label: string): ItemData[] {
	return list.map((k) => {
		const item: ItemData = {
			name: k.name,
			kind,
			detail: k.dialect === 'modern' ? label + ' (modern dialect)' : label,
			insertText: k.name,
			snippet: false,
			documentation: keywordDocumentation(k, label),
			sortText: sortText(TIER_NTT, RANK_NORMAL, k.name),
			deprecated: false,
		};
		if (k.dialect === 'modern') { item.dialect = 'modern'; }
		return item;
	});
}

/**
 * A hand-table name that the dump also defines: `fork` is a soft keyword and a
 * dump function, `null` and `undefined` are built-in constants and
 * `default.gml` instance variables. The hand entry is the more specific of the
 * two, so it decides the kind, the `detail` label and the sort tier, and its
 * documentation goes first; the dump entry keeps the parts only it has (the
 * `fork()` snippet, the deprecation flag) and its documentation is appended so
 * nothing either table knows is lost.
 */
function mergeHand(generated: ItemData, hand: ItemData): ItemData {
	const merged: ItemData = {
		...generated,
		kind: hand.kind,
		detail: hand.detail,
		documentation: hand.documentation + '\n\n---\n\n' + generated.documentation,
		sortText: hand.sortText.charAt(0) + generated.sortText.slice(1),
	};
	if (hand.dialect !== undefined) { merged.dialect = hand.dialect; }
	return merged;
}

interface BaseTable {
	items: ItemData[];
	index: { [name: string]: ItemData };
}

let baseCache: BaseTable | undefined;

/**
 * Every item that is offered without a special context, built once. Names that
 * appear in both a generated table and a hand table are merged (see
 * `mergeHand`); an asset that shares a name with an identifier is dropped, so
 * no name is offered twice.
 */
function baseTable(): BaseTable {
	if (baseCache !== undefined) { return baseCache; }
	const index: { [name: string]: ItemData } = {};
	const order: string[] = [];
	const add = (item: ItemData, merge: boolean): void => {
		if (Object.prototype.hasOwnProperty.call(index, item.name)) {
			if (merge) { index[item.name] = mergeHand(index[item.name], item); }
			return;
		}
		index[item.name] = item;
		order.push(item.name);
	};
	const generated = functionItems().concat(constantItems()).concat(variableItems());
	for (const item of generated) { add(item, false); }
	const hand = keywordItems(keywords, 'keyword', 'keyword')
		.concat(keywordItems(builtinConstants, 'builtin-constant', 'built-in constant'))
		.concat(keywordItems(offeredSoftKeywords(), 'soft-keyword', 'soft keyword'))
		.concat(keywordItems(preprocessorDirectives, 'preprocessor', 'preprocessor directive'));
	for (const item of hand) { add(item, true); }
	for (const item of assetItems()) { add(item, false); }
	baseCache = { items: order.map((name) => index[name]), index };
	return baseCache;
}

/** Every item offered without a special context. */
export function baseItems(): ItemData[] {
	return baseTable().items;
}

function baseByName(name: string): ItemData | undefined {
	const { index } = baseTable();
	return Object.prototype.hasOwnProperty.call(index, name) ? index[name] : undefined;
}

// --- context-only items --------------------------------------------------

const eventCache: { [type: string]: ItemData[] } = {};

/** Reserved events of one mod type, engine events ranked above the rest. */
export function eventItems(type: ModType): ItemData[] {
	if (Object.prototype.hasOwnProperty.call(eventCache, type)) { return eventCache[type]; }
	const items = eventsFor(type).map((e): ItemData => ({
		name: e.name,
		kind: 'event',
		detail: renderEvent(e) + (e.engine ? ' (.' + type + ' event)' : ' (.' + type + ', mod-local)'),
		insertText: renderEvent(e),
		snippet: false,
		documentation: eventDocumentation(e, type),
		sortText: sortText(TIER_CONTEXT, e.engine ? RANK_NORMAL : RANK_DEMOTED, e.name),
		deprecated: false,
	}));
	eventCache[type] = items;
	return items;
}

let pragmaCache: ItemData[] | undefined;

/** The complete pragma set (NTGML-SPEC.md section 2.8). */
export function pragmaItems(): ItemData[] {
	if (pragmaCache !== undefined) { return pragmaCache; }
	pragmaCache = pragmas.map((p): ItemData => ({
		name: p.name,
		kind: 'pragma',
		detail: renderPragma(p) + (p.scope === 'file' ? ' (file level)' : ' (statement)'),
		insertText: p.arg === undefined ? p.name : p.name + ' ${1:' + escapeSnippet(p.arg) + '}',
		snippet: p.arg !== undefined,
		documentation: pragmaDocumentation(p),
		sortText: sortText(TIER_CONTEXT, RANK_NORMAL, p.name),
		deprecated: false,
	}));
	return pragmaCache;
}

let pragmaValueCache: ItemData[] | undefined;

/** The one useful `#pragma gml` argument. */
export function pragmaValueItems(): ItemData[] {
	if (pragmaValueCache !== undefined) { return pragmaValueCache; }
	pragmaValueCache = [{
		name: '2',
		kind: 'pragma',
		detail: '#pragma gml 2 (file level)',
		insertText: '2',
		snippet: false,
		documentation: '```ntgml\n#pragma gml 2\n```\n\n'
			+ '- Switches a `.gml` file to the modern dialect (100.000).\n'
			+ '- The binary also accepts `14`, `20` and `23`.',
		sortText: sortText(TIER_CONTEXT, RANK_NORMAL, '2'),
		deprecated: false,
	}];
	return pragmaValueCache;
}

const buttonCache: { [key: string]: ItemData[] } = {};

/**
 * Button-name completions. Outside a string they insert `"name"`; inside one
 * the quotes are already there, so they insert the bare name.
 *
 * A few button names are also language keywords (`exit`), so the items carry a
 * label description to tell the two apart in the merged list.
 */
export function buttonItems(inString: boolean): ItemData[] {
	const key = inString ? 'in-string' : 'outside-string';
	if (Object.prototype.hasOwnProperty.call(buttonCache, key)) { return buttonCache[key]; }
	buttonCache[key] = buttons.map((b): ItemData => ({
		name: b.name,
		kind: 'button',
		detail: b.doc,
		insertText: inString ? b.name : '"' + b.name + '"',
		snippet: false,
		documentation: buttonDocumentation(b.name, b.doc),
		sortText: sortText(TIER_CONTEXT, RANK_NORMAL, b.name),
		deprecated: false,
		labelDescription: 'button',
	}));
	return buttonCache[key];
}

/** Custom objects the field can be set on, inherited fields included. */
function ownersOf(field: string): string[] {
	return customObjects
		.filter((o) => fieldsFor(o.name).some((f) => f.name === field))
		.map((o) => o.name);
}

function fieldItem(field: CustomObjectField): ItemData {
	const owners = ownersOf(field.name);
	return {
		name: field.name,
		kind: 'field',
		detail: 'available on ' + owners.join(', '),
		insertText: field.name,
		snippet: false,
		documentation: fieldDocumentation(field, owners),
		sortText: sortText(TIER_CONTEXT, RANK_NORMAL, field.name),
		deprecated: false,
	};
}

/**
 * One instance variable from the generated per-object table.
 *
 * Unlike `fieldItem` this does not look for other objects that have the same
 * name: with 489 objects in the table that scan would be quadratic, and the
 * answer ("271 of the 489 objects have `team`, 35 of them declaring it") would
 * not help anyone. The detail line names the receiver and, when the name is
 * inherited, the object that actually declares it.
 *
 * `labelDescription` is set so the item stays distinguishable from a function
 * or constant of the same name when both are offered in a `with (Obj)` body.
 * That is rarer than it sounds: no field name in the table collides with a
 * function, and exactly one collides with anything at all - `Crown.new`, which
 * is also the modern-dialect keyword.
 */
function objectFieldItem(field: ObjectFieldInfo, objectName: string, declaredBy: string): ItemData {
	const detail = 'instance variable of ' + objectName
		+ (declaredBy === objectName ? '' : ' (inherited from ' + declaredBy + ')')
		+ (field.type === undefined ? '' : ' : ' + field.type);
	return {
		name: field.name,
		kind: 'field',
		detail: detail,
		labelDescription: 'field',
		insertText: field.name,
		snippet: false,
		documentation: objectFieldDocumentation(field, objectName, declaredBy),
		sortText: sortText(TIER_CONTEXT, RANK_NORMAL, field.name),
		deprecated: false,
	};
}

/**
 * Cache key. A real object name can never be `*`, but spell the two cases out
 * so the unresolved-receiver union cannot collide with an object.
 */
function fieldCacheKey(objectName?: string): string {
	return objectName === undefined ? '*' : 'o:' + objectName;
}

const fieldCache: { [key: string]: ItemData[] } = {};

/**
 * Fields of one object, or - when the receiver could not be resolved - the
 * union of the hand-written `Custom*` table only. The union stays hand-only on
 * purpose: it is what an `on_` prefix with no receiver in sight asks for, and
 * merging 489 objects' instance variables into it would bury the callbacks.
 *
 * For a named object the two tables are unioned: the `Custom*` entry's
 * callback fields (which carry their own prose) win over a same-named entry in
 * the generated table. A name neither table knows has no fields.
 */
export function fieldItems(objectName?: string): ItemData[] {
	const key = fieldCacheKey(objectName);
	if (Object.prototype.hasOwnProperty.call(fieldCache, key)) { return fieldCache[key]; }
	const items: ItemData[] = [];
	const seen: { [n: string]: true } = {};
	const sources = objectName === undefined ? customObjects.map((o) => o.name) : [objectName];
	for (const source of sources) {
		if (customObject(source) === undefined) { continue; }
		for (const field of fieldsFor(source)) {
			if (seen[field.name] === true) { continue; }
			seen[field.name] = true;
			items.push(fieldItem(field));
		}
	}
	if (objectName !== undefined) {
		for (const field of objectFieldsFor(objectName)) {
			if (seen[field.name] === true) { continue; }
			seen[field.name] = true;
			items.push(objectFieldItem(
				field, objectName, declaringObject(objectName, field.name) ?? objectName));
		}
	}
	items.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
	fieldCache[key] = items;
	return fieldCache[key];
}

// --- selection -----------------------------------------------------------

function applyExact(items: ItemData[], word: string): ItemData[] {
	if (word === '') { return items; }
	return items.map((item) => (item.name === word ? retier(item, TIER_EXACT) : item));
}

const generalCache: { [key: string]: ItemData[] } = {};

/**
 * The base list for one dialect, with object names lifted into the context
 * tier inside an object-taking argument. Both variants are memoised: the
 * object-argument one rebuilds 500-odd records, which would otherwise happen
 * on every keystroke inside a `with (...)` and defeat the VS Code layer's
 * per-record conversion cache.
 */
function generalItems(ctx: CursorContext): ItemData[] {
	const key = ctx.dialect + (ctx.objectArg ? '/object' : '');
	if (Object.prototype.hasOwnProperty.call(generalCache, key)) { return generalCache[key]; }
	let items = baseItems().filter((item) => item.dialect !== 'modern' || ctx.dialect === 'modern');
	if (ctx.objectArg) {
		items = items.map((item) => (item.kind === 'object' ? retier(item, TIER_CONTEXT) : item));
	}
	generalCache[key] = items;
	return items;
}

/**
 * The items to offer at a cursor. Returns an empty list where completions
 * would be wrong (comments, strings, member access on an unknown receiver) so
 * VS Code falls back to its own word-based suggestions instead of showing a
 * list of built-ins.
 */
export function itemsFor(ctx: CursorContext): ItemData[] {
	switch (ctx.kind) {
		case 'none':
			return [];
		case 'pragma':
			return applyExact(pragmaItems(), ctx.word);
		case 'pragma-value':
			return pragmaValueItems();
		case 'event':
			// An unknown mod type means the file is not a mod file; offering
			// one type's events there would be a guess, so offer none.
			return ctx.modType === null ? [] : applyExact(eventItems(ctx.modType), ctx.word);
		case 'button':
			return ctx.inString
				? applyExact(buttonItems(true), ctx.word)
				: applyExact(buttonItems(false).concat(generalItems(ctx)), ctx.word);
		case 'field':
			return ctx.member
				? applyExact(fieldItems(ctx.objectName), ctx.word)
				: applyExact(fieldItems(ctx.objectName).concat(generalItems(ctx)), ctx.word);
		default:
			return applyExact(generalItems(ctx), ctx.word);
	}
}

/**
 * The item a hover should describe, given a context built from the line up to
 * the end of the hovered word.
 */
export function lookupItem(ctx: CursorContext): ItemData | undefined {
	const word = ctx.word;
	if (word === '') { return undefined; }
	switch (ctx.kind) {
		case 'none':
			return undefined;
		case 'pragma':
			return pragmaItems().find((p) => p.name === word);
		case 'pragma-value':
			return undefined;
		case 'event': {
			const event = ctx.modType === null
				? undefined
				: eventItems(ctx.modType).find((e) => e.name === word);
			return event ?? baseByName(word);
		}
		case 'button':
			return buttonItems(ctx.inString).find((b) => b.name === word);
		case 'field':
			return fieldItems(ctx.objectName).find((f) => f.name === word) ?? baseByName(word);
		default:
			return baseByName(word);
	}
}

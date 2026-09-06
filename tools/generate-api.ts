/**
 * Generates `src/generated/*.ts` from an NTT `/gmlapi` dump.
 *
 *   pnpm gen                 # local dump if it is new enough, else vendored
 *   pnpm gen --vendored      # force api/ntt-100.034
 *   pnpm gen --api-dir <dir> # any other dump directory
 *   pnpm gen --out <dir>     # write somewhere other than src/generated
 *                            # (the test suite uses this to diff)
 *
 * Inputs (a dump directory):
 *   api.gml           annotated declarations (NTGML-SPEC.md section 5)
 *   raw-functions.gml raw-constants.gml raw-variables.gml   name lists, used
 *                     only to verify the parse is complete
 *   raw-sprites.gml raw-sounds.gml raw-objects.gml raw-fonts.gml  asset names
 *
 * `raw-assets.gml` is NEVER read: the dump joins its entries without a
 * separator, so names run together (NTGML-PORT-SCOPE.md section 6).
 *
 * Extra inputs, always taken from the repo:
 *   api/ntt-100.022-reference/api.gml      argument type hints, merged by
 *                                          position (the live dump dropped them)
 *   api/ntt-100.022-reference/default.gml  built-in instance variables
 *   api/overrides.gml                      hand-written fixes, merged last
 *   api/ntt-docs/scripting/*.dmd           prose documentation
 *
 * Output is deterministic: everything is sorted by name and the header records
 * the dump's own `Generated at` stamp rather than the time this ran, so
 * regenerating from an identical dump produces an identical file.
 */

import * as fs from 'fs';
import * as path from 'path';

import {
	ApiModel,
	ArgInfo,
	ConstantInfo,
	FunctionInfo,
	VariableInfo,
	parseApi,
	parseDefaults,
	parseRawNames,
} from './parse-api';
import { DocMap, DocSource, parseDocs } from './parse-docs';

// --- paths ---------------------------------------------------------------

const ROOT = path.resolve(__dirname, '..', '..');
const VENDORED_DIR = path.join(ROOT, 'api', 'ntt-100.034');
const REFERENCE_DIR = path.join(ROOT, 'api', 'ntt-100.022-reference');
const OVERRIDES_FILE = path.join(ROOT, 'api', 'overrides.gml');
const DOCS_DIR = path.join(ROOT, 'api', 'ntt-docs', 'scripting');
const OUT_DIR = path.join(ROOT, 'src', 'generated');

/** Minimum `game_version` for a local dump to be preferred over the vendored one. */
const MIN_LOCAL_VERSION = 100000;

/**
 * Asset names the dump emits for deleted / never-used slots. They are not
 * usable identifiers, so they are dropped (NTGML-PORT-SCOPE.md section 6).
 */
const PLACEHOLDER_ASSETS = ['background7', '__newsprite2113', '__newfont6', '__newfont7'];

// --- tiny helpers --------------------------------------------------------

function read(file: string): string {
	return fs.readFileSync(file, 'utf8');
}

function exists(file: string): boolean {
	try {
		fs.accessSync(file);
		return true;
	} catch {
		return false;
	}
}

function byName(a: { name: string }, b: { name: string }): number {
	return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
}

function fail(message: string): never {
	console.error('generate-api: ' + message);
	process.exit(1);
	throw new Error(message); // unreachable; keeps the return type honest
}

// --- CLI -----------------------------------------------------------------

interface Options {
	vendored: boolean;
	apiDir?: string;
	/** Output directory; defaults to `src/generated`. */
	outDir?: string;
}

function parseArgv(argv: string[]): Options {
	const opts: Options = { vendored: false };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--vendored') {
			opts.vendored = true;
		} else if (a === '--api-dir') {
			const dir = argv[++i];
			if (dir === undefined) { fail('--api-dir needs a path'); }
			opts.apiDir = path.resolve(dir);
		} else if (a.indexOf('--api-dir=') === 0) {
			opts.apiDir = path.resolve(a.slice('--api-dir='.length));
		} else if (a === '--out') {
			const dir = argv[++i];
			if (dir === undefined) { fail('--out needs a path'); }
			opts.outDir = path.resolve(dir);
		} else if (a.indexOf('--out=') === 0) {
			opts.outDir = path.resolve(a.slice('--out='.length));
		} else if (a === '--help' || a === '-h') {
			console.log('usage: generate-api [--vendored] [--api-dir <dir>] [--out <dir>]');
			process.exit(0);
		} else {
			fail('unknown argument: ' + a);
		}
	}
	return opts;
}

interface Source {
	dir: string;
	/** How the directory was chosen, for the console summary. */
	kind: string;
	model: ApiModel;
}

/** Read a candidate dump directory, or null when it is missing / too old. */
function tryDump(dir: string, minVersion: number): ApiModel | null {
	const file = path.join(dir, 'api.gml');
	if (!exists(file)) { return null; }
	const model = parseApi(read(file));
	if (model.gameVersion < minVersion) { return null; }
	return model;
}

function chooseSource(opts: Options): Source {
	if (opts.apiDir !== undefined) {
		const model = tryDump(opts.apiDir, 0);
		if (model === null) { fail('no api.gml in ' + opts.apiDir); }
		return { dir: opts.apiDir, kind: '--api-dir', model };
	}
	if (!opts.vendored) {
		const localAppData = process.env.LOCALAPPDATA;
		if (localAppData) {
			const dir = path.join(localAppData, 'nuclearthrone', 'api');
			const model = tryDump(dir, MIN_LOCAL_VERSION);
			if (model !== null) {
				return { dir: dir, kind: 'local dump (LOCALAPPDATA/nuclearthrone/api)', model };
			}
		}
	}
	const model = tryDump(VENDORED_DIR, 0);
	if (model === null) { fail('no api.gml in ' + VENDORED_DIR); }
	return { dir: VENDORED_DIR, kind: 'vendored api/ntt-100.034', model };
}

// --- type-hint merge -----------------------------------------------------

function typedness(fn: FunctionInfo): number {
	let n = fn.returnType ? 1 : 0;
	for (const a of fn.args) { if (a.type) { n++; } }
	return n;
}

interface HintReport {
	argHints: number;
	returnHints: number;
	functionsTouched: number;
	/** Reference functions the current dump no longer has. */
	removed: string[];
	/** Functions the reference did not have. */
	added: number;
	/** Duplicate reference lines collapsed. */
	refDuplicates: number;
}

/**
 * Merge argument / return type hints from the 100.022 reference dump by
 * ARGUMENT POSITION: the two dumps disagree on argument names (the current
 * `instance_exists(object)` vs the reference `instance_exists(obj:index)`),
 * so position is the only usable key. Gaps are filled; an existing type is
 * never overwritten.
 */
function mergeHints(current: FunctionInfo[], reference: FunctionInfo[]): HintReport {
	const best: { [name: string]: FunctionInfo } = {};
	let refDuplicates = 0;
	for (const fn of reference) {
		const prev = best[fn.name];
		if (prev === undefined) {
			best[fn.name] = fn;
		} else {
			refDuplicates++;
			// The reference lists some functions twice, once untyped and once
			// typed (e.g. `string_split`). Prefer the richer signature.
			if (typedness(fn) > typedness(prev)) { best[fn.name] = fn; }
		}
	}

	const report: HintReport = {
		argHints: 0,
		returnHints: 0,
		functionsTouched: 0,
		removed: [],
		added: 0,
		refDuplicates: refDuplicates,
	};

	const currentNames: { [name: string]: true } = {};
	for (const fn of current) { currentNames[fn.name] = true; }
	for (const name of Object.keys(best)) {
		if (!currentNames[name]) { report.removed.push(name); }
	}
	report.removed.sort();

	for (const fn of current) {
		const ref = best[fn.name];
		if (ref === undefined) { report.added++; continue; }
		let touched = false;
		const n = Math.min(fn.args.length, ref.args.length);
		for (let i = 0; i < n; i++) {
			const to = fn.args[i];
			const from = ref.args[i];
			if (to.type === undefined && from.type !== undefined && !to.rest && !from.rest) {
				to.type = from.type;
				report.argHints++;
				touched = true;
			}
		}
		if (fn.returns && fn.returnType === undefined && ref.returnType !== undefined) {
			fn.returnType = ref.returnType;
			report.returnHints++;
			touched = true;
		}
		if (touched) { report.functionsTouched++; }
	}

	return report;
}

// --- overrides -----------------------------------------------------------

interface OverrideReport {
	replaced: number;
	added: number;
}

/** Merge `api/overrides.gml` entries over the parsed dump, by name. */
function applyOverrides<T extends { name: string; category: string }>(
	base: T[],
	overrides: T[]
): OverrideReport {
	const report: OverrideReport = { replaced: 0, added: 0 };
	for (const ov of overrides) {
		let found = false;
		for (let i = 0; i < base.length; i++) {
			if (base[i].name !== ov.name) { continue; }
			if (!ov.category) { ov.category = base[i].category; }
			base[i] = ov;
			found = true;
			report.replaced++;
			break;
		}
		if (!found) {
			base.push(ov);
			report.added++;
		}
	}
	return report;
}

/** Collapse duplicate declarations, keeping the most informative one. */
function dedupeFunctions(functions: FunctionInfo[]): { list: FunctionInfo[]; collapsed: number } {
	const seen: { [name: string]: FunctionInfo } = {};
	const order: string[] = [];
	let collapsed = 0;
	for (const fn of functions) {
		const prev = seen[fn.name];
		if (prev === undefined) {
			seen[fn.name] = fn;
			order.push(fn.name);
		} else {
			collapsed++;
			if (typedness(fn) > typedness(prev)) { seen[fn.name] = fn; }
		}
	}
	return { list: order.map((n) => seen[n]), collapsed: collapsed };
}

function dedupeByName<T extends { name: string }>(items: T[]): { list: T[]; collapsed: number } {
	const seen: { [name: string]: true } = {};
	const list: T[] = [];
	let collapsed = 0;
	for (const item of items) {
		if (seen[item.name]) { collapsed++; continue; }
		seen[item.name] = true;
		list.push(item);
	}
	return { list: list, collapsed: collapsed };
}

// --- assets --------------------------------------------------------------

interface AssetTables {
	sprites: string[];
	masks: string[];
	shaders: string[];
	sounds: string[];
	music: string[];
	ambience: string[];
	fonts: string[];
	objects: string[];
}

const ASSET_KINDS: (keyof AssetTables)[] = [
	'sprites', 'masks', 'shaders', 'sounds', 'music', 'ambience', 'fonts', 'objects',
];

interface AssetReport {
	tables: AssetTables;
	dropped: string[];
	total: number;
}

/**
 * Classify asset names by prefix (NTGML-SPEC.md section 6). The dump already
 * splits them into files, so the prefix only has to separate the namespaces
 * that share a file: `msk`/`shd` inside sprites, `mus`/`amb` inside sounds.
 * Sprite names without a known prefix (`bak0`, `OLDoutWall`) are sprites.
 */
function classifyAssets(dir: string): AssetReport {
	const names = (file: string): string[] => parseRawNames(read(path.join(dir, file)));
	const tables: AssetTables = {
		sprites: [],
		masks: [],
		shaders: [],
		sounds: [],
		music: [],
		ambience: [],
		fonts: [],
		objects: [],
	};
	const dropped: string[] = [];
	const keep = (name: string): boolean => {
		if (PLACEHOLDER_ASSETS.indexOf(name) >= 0) {
			dropped.push(name);
			return false;
		}
		return true;
	};

	for (const name of names('raw-sprites.gml')) {
		if (!keep(name)) { continue; }
		if (name.indexOf('msk') === 0) { tables.masks.push(name); }
		else if (name.indexOf('shd') === 0) { tables.shaders.push(name); }
		else { tables.sprites.push(name); }
	}
	for (const name of names('raw-sounds.gml')) {
		if (!keep(name)) { continue; }
		if (name.indexOf('mus') === 0) { tables.music.push(name); }
		else if (name.indexOf('amb') === 0) { tables.ambience.push(name); }
		else { tables.sounds.push(name); }
	}
	for (const name of names('raw-fonts.gml')) {
		if (keep(name)) { tables.fonts.push(name); }
	}
	for (const name of names('raw-objects.gml')) {
		if (keep(name)) { tables.objects.push(name); }
	}

	let total = 0;
	for (const key of ASSET_KINDS) {
		tables[key] = tables[key].slice().sort();
		total += tables[key].length;
	}
	dropped.sort();
	return { tables: tables, dropped: dropped, total: total };
}

// --- emit ----------------------------------------------------------------

function header(gameVersion: number, generatedAt: string): string[] {
	return [
		'// GENERATED by tools/generate-api.ts from the NTT /gmlapi dump' +
			' (game_version ' + gameVersion + '). Do not edit.',
		'// Dump stamp: ' + (generatedAt || 'unstamped') + '.',
		'// Regenerate with `pnpm gen`.',
		'',
	];
}

/** Deterministic one-line JSON; key order follows the object literal. */
function line(value: unknown): string {
	return JSON.stringify(value);
}

interface Bag { [key: string]: unknown; }

function emitArg(a: ArgInfo): Bag {
	const o: Bag = { name: a.name };
	if (a.type !== undefined) { o.type = a.type; }
	if (a.optional) { o.optional = true; }
	if (a.rest) { o.rest = true; }
	if (a.default !== undefined) { o.default = a.default; }
	return o;
}

function emitFunction(fn: FunctionInfo): Bag {
	const o: Bag = {
		name: fn.name,
		args: fn.args.map(emitArg),
	};
	if (fn.returns) { o.returns = true; }
	if (fn.returnType !== undefined) { o.returnType = fn.returnType; }
	if (fn.selfCtx !== 0) { o.selfCtx = fn.selfCtx; }
	if (fn.raw) { o.raw = true; }
	if (fn.pure) { o.pure = true; }
	if (fn.deprecated) { o.deprecated = true; }
	if (fn.spelling !== null) { o.spelling = fn.spelling; }
	o.category = fn.category;
	o.signature = fn.signature;
	return o;
}

/**
 * The emitted object literals omit `false`/default fields to keep the file
 * readable, so they are typed as `Raw*` and normalised on load. The
 * normaliser lives in the generated module so nothing outside it has to know
 * about the compact form.
 */
const FUNCTIONS_PROLOGUE = [
	"import { ArgInfo, FunctionInfo } from '../tables/types';",
	'',
	'type RawArg = Partial<ArgInfo> & { name: string };',
	"type RawFunction = Omit<Partial<FunctionInfo>, 'args'> & { name: string; args: RawArg[] };",
	'',
	'function arg(a: RawArg): ArgInfo {',
	'\tconst out: ArgInfo = {',
	'\t\tname: a.name,',
	'\t\toptional: a.optional === true,',
	'\t\trest: a.rest === true,',
	'\t};',
	'\tif (a.type !== undefined) { out.type = a.type; }',
	'\tif (a.default !== undefined) { out.default = a.default; }',
	'\treturn out;',
	'}',
	'',
	'function fn(f: RawFunction): FunctionInfo {',
	'\tconst out: FunctionInfo = {',
	'\t\tname: f.name,',
	'\t\targs: f.args.map(arg),',
	'\t\treturns: f.returns === true,',
	'\t\tselfCtx: f.selfCtx === undefined ? 0 : f.selfCtx,',
	'\t\traw: f.raw === true,',
	'\t\tpure: f.pure === true,',
	'\t\tdeprecated: f.deprecated === true,',
	'\t\tspelling: f.spelling === undefined ? null : f.spelling,',
	"\t\tcategory: f.category === undefined ? '' : f.category,",
	"\t\tsignature: f.signature === undefined ? '' : f.signature,",
	'\t};',
	'\tif (f.returnType !== undefined) { out.returnType = f.returnType; }',
	'\treturn out;',
	'}',
	'',
	'const raw: RawFunction[] = [',
];

const FUNCTIONS_EPILOGUE = [
	'];',
	'',
	'/** Every NTT script, sorted by name. */',
	'export const functions: FunctionInfo[] = raw.map(fn);',
	'',
	'export const functionNames: string[] = functions.map((f) => f.name);',
	'',
	'const index: { [name: string]: FunctionInfo } = {};',
	'for (const f of functions) { index[f.name] = f; }',
	'',
	'export function functionByName(name: string): FunctionInfo | undefined {',
	'\treturn index[name];',
	'}',
	'',
];

function emitFunctions(fns: FunctionInfo[], head: string[]): string {
	const body = fns.map((f) => '\t' + line(emitFunction(f)) + ',');
	return head.concat(FUNCTIONS_PROLOGUE, body, FUNCTIONS_EPILOGUE).join('\n');
}

const CONSTANTS_PROLOGUE = [
	"import { ConstantInfo } from '../tables/types';",
	'',
	'type RawConstant = Partial<ConstantInfo> & { name: string };',
	'',
	'const raw: RawConstant[] = [',
];

const CONSTANTS_EPILOGUE = [
	'];',
	'',
	'/** Every NTT constant, sorted by name. */',
	'export const constants: ConstantInfo[] = raw.map((c) => {',
	'\tconst out: ConstantInfo = {',
	'\t\tname: c.name,',
	"\t\tcategory: c.category === undefined ? '' : c.category,",
	'\t\tspelling: c.spelling === undefined ? null : c.spelling,',
	'\t\tdeprecated: c.deprecated === true,',
	'\t};',
	'\tif (c.value !== undefined) { out.value = c.value; }',
	'\treturn out;',
	'});',
	'',
	'export const constantNames: string[] = constants.map((c) => c.name);',
	'',
	'const index: { [name: string]: ConstantInfo } = {};',
	'for (const c of constants) { index[c.name] = c; }',
	'',
	'export function constantByName(name: string): ConstantInfo | undefined {',
	'\treturn index[name];',
	'}',
	'',
];

function emitConstants(constants: ConstantInfo[], head: string[]): string {
	const body = constants.map((c) => {
		const o: Bag = { name: c.name };
		if (c.value !== undefined) { o.value = c.value; }
		o.category = c.category;
		if (c.spelling !== null) { o.spelling = c.spelling; }
		if (c.deprecated) { o.deprecated = true; }
		return '\t' + line(o) + ',';
	});
	return head.concat(CONSTANTS_PROLOGUE, body, CONSTANTS_EPILOGUE).join('\n');
}

const VARIABLES_PROLOGUE = [
	"import { VariableInfo } from '../tables/types';",
	'',
	'type RawVariable = Partial<VariableInfo> & { name: string };',
	'',
	'const raw: RawVariable[] = [',
];

const VARIABLES_EPILOGUE = [
	'];',
	'',
	'/**',
	' * Every NTT global / instance variable, sorted by name. Entries with',
	' * `builtin: true` come from `default.gml` (the GameMaker instance variables',
	' * and the `argument*` slots).',
	' */',
	'export const variables: VariableInfo[] = raw.map((v) => {',
	'\tconst out: VariableInfo = {',
	'\t\tname: v.name,',
	'\t\treadOnly: v.readOnly === true,',
	'\t\tperPlayer: v.perPlayer === true,',
	'\t\tconstant: v.constant === true,',
	"\t\tcategory: v.category === undefined ? '' : v.category,",
	'\t\tbuiltin: v.builtin === true,',
	'\t};',
	'\tif (v.type !== undefined) { out.type = v.type; }',
	'\treturn out;',
	'});',
	'',
	'export const variableNames: string[] = variables.map((v) => v.name);',
	'',
	'const index: { [name: string]: VariableInfo } = {};',
	'for (const v of variables) { index[v.name] = v; }',
	'',
	'export function variableByName(name: string): VariableInfo | undefined {',
	'\treturn index[name];',
	'}',
	'',
];

function emitVariables(variables: VariableInfo[], head: string[]): string {
	const body = variables.map((v) => {
		const o: Bag = { name: v.name };
		if (v.readOnly) { o.readOnly = true; }
		if (v.perPlayer) { o.perPlayer = true; }
		if (v.type !== undefined) { o.type = v.type; }
		if (v.constant) { o.constant = true; }
		o.category = v.category;
		if (v.builtin) { o.builtin = true; }
		return '\t' + line(o) + ',';
	});
	return head.concat(VARIABLES_PROLOGUE, body, VARIABLES_EPILOGUE).join('\n');
}

function emitAssets(tables: AssetTables, head: string[]): string {
	const out: string[] = head.concat([
		"import { AssetTables } from '../tables/types';",
		'',
		'/** Asset names by namespace (NTGML-SPEC.md section 6), each sorted. */',
		'export const assets: AssetTables = {',
	]);
	for (const key of ASSET_KINDS) {
		out.push('\t' + key + ': [');
		for (const name of tables[key]) { out.push('\t\t' + JSON.stringify(name) + ','); }
		out.push('\t],');
	}
	out.push(
		'};',
		'',
		'export const assetKinds: (keyof AssetTables)[] = [',
		"\t'sprites', 'masks', 'shaders', 'sounds', 'music', 'ambience', 'fonts', 'objects',",
		'];',
		'',
		'const index: { [name: string]: keyof AssetTables } = {};',
		'for (const kind of assetKinds) {',
		'\tfor (const name of assets[kind]) { index[name] = kind; }',
		'}',
		'',
		'/** Every asset name, sorted, across all namespaces. */',
		'export const assetNames: string[] = Object.keys(index).sort();',
		'',
		'export function assetKindOf(name: string): keyof AssetTables | undefined {',
		'\treturn index[name];',
		'}',
		''
	);
	return out.join('\n');
}

const DOCS_PROLOGUE = [
	"import { DocEntry, DocMap } from '../tables/types';",
	'',
	'/**',
	' * Markdown prose per identifier, extracted from the NTT docs',
	' * (`api/ntt-docs/scripting/*.dmd`). The same data is written to',
	' * `docs.json` for tools that cannot import TypeScript.',
	' */',
	'export const docs: DocMap = {',
];

const DOCS_EPILOGUE = [
	'};',
	'',
	'export const documentedNames: string[] = Object.keys(docs);',
	'',
	'export function docFor(name: string): DocEntry | undefined {',
	'\treturn docs[name];',
	'}',
	'',
];

function emitDocs(docs: DocMap, head: string[]): string {
	const names = Object.keys(docs).sort();
	const body = names.map((n) => '\t' + JSON.stringify(n) + ': ' + line(docs[n]) + ',');
	return head.concat(DOCS_PROLOGUE, body, DOCS_EPILOGUE).join('\n');
}

function emitMeta(gameVersion: number, generatedAt: string, source: string, head: string[]): string {
	const meta = { gameVersion: gameVersion, generatedAt: generatedAt, source: source };
	return head
		.concat([
			"import { ApiMeta } from '../tables/types';",
			'',
			'export const meta: ApiMeta = ' + JSON.stringify(meta, null, '\t') + ';',
			'',
		])
		.join('\n');
}

// --- self-checks ---------------------------------------------------------

function checkRawList(
	label: string,
	rawNames: string[],
	present: { [name: string]: true },
	problems: string[]
): void {
	const missing: string[] = [];
	const seen: { [name: string]: true } = {};
	for (const name of rawNames) {
		if (seen[name]) { continue; }
		seen[name] = true;
		if (!present[name]) { missing.push(name); }
	}
	if (missing.length > 0) {
		problems.push(
			label + ': ' + missing.length + ' name(s) from the raw list are missing from the parsed table: ' +
			missing.slice(0, 12).join(', ') + (missing.length > 12 ? ', ...' : '')
		);
	}
}

// --- main ----------------------------------------------------------------

function main(): void {
	const opts = parseArgv(process.argv.slice(2));
	const source = chooseSource(opts);
	const model = source.model;
	const outDir = opts.outDir === undefined ? OUT_DIR : opts.outDir;

	console.log('source:       ' + source.dir);
	console.log('  chosen as:  ' + source.kind);
	console.log('  version:    ' + model.gameVersion);
	console.log('  dump stamp: ' + (model.generatedAt || '(none)'));

	// --- type hints from the 100.022 reference
	const reference = parseApi(read(path.join(REFERENCE_DIR, 'api.gml')));
	const deduped = dedupeFunctions(model.functions);
	const functions = deduped.list;
	const hints = mergeHints(functions, reference.functions);

	// --- built-in instance variables (only the reference dump ships default.gml)
	const defaults = parseDefaults(read(path.join(REFERENCE_DIR, 'default.gml')));

	const constantsAll = dedupeByName(model.constants);
	const variablesAll = dedupeByName(model.variables.concat(defaults));
	const constants = constantsAll.list;
	const variables = variablesAll.list;

	// --- overrides, merged last so they win
	let overrides: ApiModel = {
		functions: [],
		constants: [],
		variables: [],
		generatedAt: '',
		gameVersion: 0,
	};
	if (exists(OVERRIDES_FILE)) { overrides = parseApi(read(OVERRIDES_FILE)); }
	const ovFunctions = applyOverrides(functions, overrides.functions);
	const ovConstants = applyOverrides(constants, overrides.constants);
	const ovVariables = applyOverrides(variables, overrides.variables);

	functions.sort(byName);
	constants.sort(byName);
	variables.sort(byName);

	// --- assets
	const assets = classifyAssets(source.dir);

	// --- docs
	let docs: DocMap = {};
	if (exists(DOCS_DIR)) {
		const sources: DocSource[] = fs
			.readdirSync(DOCS_DIR)
			.filter((f) => f.toLowerCase().indexOf('.dmd') === f.length - 4)
			.sort()
			.map((f) => ({ name: f, text: read(path.join(DOCS_DIR, f)) }));
		docs = parseDocs(sources);
	}

	// --- self-checks
	const problems: string[] = [];
	const fnNames: { [n: string]: true } = {};
	for (const f of functions) { fnNames[f.name] = true; }
	const constNames: { [n: string]: true } = {};
	for (const c of constants) { constNames[c.name] = true; }
	const varNames: { [n: string]: true } = {};
	for (const v of variables) { varNames[v.name] = true; }

	checkRawList('functions', parseRawNames(read(path.join(source.dir, 'raw-functions.gml'))), fnNames, problems);
	checkRawList('constants', parseRawNames(read(path.join(source.dir, 'raw-constants.gml'))), constNames, problems);
	checkRawList('variables', parseRawNames(read(path.join(source.dir, 'raw-variables.gml'))), varNames, problems);

	for (const name of Object.keys(fnNames)) {
		if (constNames[name]) { problems.push('name is both a function and a constant: ' + name); }
		if (varNames[name]) { problems.push('name is both a function and a variable: ' + name); }
	}
	for (const name of Object.keys(constNames)) {
		if (varNames[name]) { problems.push('name is both a constant and a variable: ' + name); }
	}

	const assetSeen: { [n: string]: string } = {};
	for (const key of ASSET_KINDS) {
		if (assets.tables[key].length === 0) { problems.push('asset namespace is empty: ' + key); }
		for (const name of assets.tables[key]) {
			if (assetSeen[name] !== undefined) {
				problems.push('asset name in two namespaces: ' + name +
					' (' + assetSeen[name] + ', ' + key + ')');
			}
			assetSeen[name] = key;
		}
	}
	if (model.gameVersion < MIN_LOCAL_VERSION) {
		problems.push('game_version looks wrong: ' + model.gameVersion);
	}
	if (functions.length === 0 || constants.length === 0 || variables.length === 0) {
		problems.push('a generated table came out empty');
	}

	// --- write
	const head = header(model.gameVersion, model.generatedAt);
	const dumpSource = 'NTT /gmlapi dump, ' + (model.generatedAt || 'unstamped');
	const docNames = Object.keys(docs).sort();
	// Rebuild in sorted key order: the replacer-array form of
	// `JSON.stringify` would also strip the nested `markdown`/`source` keys.
	const sortedDocs: DocMap = {};
	for (const name of docNames) { sortedDocs[name] = docs[name]; }
	// Bail before writing anything: half-generated tables are worse than none.
	if (problems.length > 0) {
		console.error('');
		console.error('SELF-CHECK FAILED:');
		for (const p of problems) { console.error('  ' + p); }
		process.exit(1);
	}

	fs.mkdirSync(outDir, { recursive: true });
	const written: string[][] = [
		['functions.ts', emitFunctions(functions, head)],
		['constants.ts', emitConstants(constants, head)],
		['variables.ts', emitVariables(variables, head)],
		['assets.ts', emitAssets(assets.tables, head)],
		['docs.ts', emitDocs(docs, head)],
		['meta.ts', emitMeta(model.gameVersion, model.generatedAt, dumpSource, head)],
		['docs.json', JSON.stringify(sortedDocs, null, '\t') + '\n'],
	];
	for (const entry of written) {
		fs.writeFileSync(path.join(outDir, entry[0]), entry[1].replace(/\r\n/g, '\n'), 'utf8');
	}

	// --- summary
	const apiVars = variables.length - defaults.length;
	console.log('');
	console.log('functions:    ' + functions.length +
		' (collapsed ' + deduped.collapsed + ' duplicate line(s))');
	console.log('constants:    ' + constants.length +
		' (collapsed ' + constantsAll.collapsed + ' duplicate line(s))');
	console.log('variables:    ' + variables.length +
		' (' + apiVars + ' from api.gml + ' + defaults.length + ' from default.gml' +
		(variablesAll.collapsed > 0 ? ', collapsed ' + variablesAll.collapsed : '') + ')');
	console.log('assets:       ' + assets.total +
		' (sprites ' + assets.tables.sprites.length +
		', masks ' + assets.tables.masks.length +
		', shaders ' + assets.tables.shaders.length +
		', sounds ' + assets.tables.sounds.length +
		', music ' + assets.tables.music.length +
		', ambience ' + assets.tables.ambience.length +
		', fonts ' + assets.tables.fonts.length +
		', objects ' + assets.tables.objects.length + ')');
	console.log('  dropped:    ' + assets.dropped.length + ' placeholder(s)' +
		(assets.dropped.length > 0 ? ': ' + assets.dropped.join(', ') : ''));
	console.log('docs:         ' + docNames.length + ' entries from ' +
		path.relative(ROOT, DOCS_DIR).replace(/\\/g, '/'));
	console.log('');
	console.log('hints merged from api/ntt-100.022-reference/api.gml:');
	console.log('  arg types:    ' + hints.argHints + ' on ' + hints.functionsTouched + ' function(s)');
	console.log('  return types: ' + hints.returnHints);
	console.log('  duplicate reference lines collapsed: ' + hints.refDuplicates);
	console.log('  new since 100.022: ' + hints.added);
	console.log('  reference-only (removed since 100.022): ' + hints.removed.length +
		(hints.removed.length > 0 ? ' -> ' + hints.removed.join(', ') : ''));
	console.log('overrides:    ' +
		(ovFunctions.replaced + ovConstants.replaced + ovVariables.replaced) + ' replaced, ' +
		(ovFunctions.added + ovConstants.added + ovVariables.added) + ' added');
	console.log('');
	console.log('wrote ' + written.length + ' file(s) to ' +
		path.relative(ROOT, outDir).replace(/\\/g, '/') + '/');

	console.log('self-checks:  ok');
}

if (require.main === module) { main(); }

/**
 * Shared interfaces for the NTGML identifier tables.
 *
 * Hand-written. `src/generated/*.ts` is produced by `tools/generate-api.ts`
 * and imports its types from here; `tools/parse-api.ts` keeps a structurally
 * identical copy of the model (it cannot import across `rootDir` boundaries).
 */

/**
 * Self/other context a function is annotated with in `api.gml`:
 * `0` no prefix, `1` `:name(...)` uses `self`, `2` `::name(...)` uses `self`
 * and `other`, `3` `:::name(...)` uses `self` and may use `other`.
 */
export type SelfCtx = 0 | 1 | 2 | 3;

/** US/UK spelling twin marker (`$` / `£` flag). */
export type Spelling = 'us' | 'uk' | null;

export interface ArgInfo {
	/** Argument name as written in `api.gml`; `""` for the unnamed `:type` form. */
	name: string;
	/**
	 * Type hint from `arg:type`, or from `:type`, which gives a type and no
	 * name (`name` is then `""`). Also filled in from the 100.022 reference.
	 */
	type?: string;
	/** `?arg` or `[arg]` or `arg=default`. */
	optional: boolean;
	/** `...arg` (or a bare trailing `...`). */
	rest: boolean;
	/** Text after `=` for `arg=default`. */
	default?: string;
}

export interface FunctionInfo {
	name: string;
	args: ArgInfo[];
	/** Trailing `:` or `:type` - the function returns a value. */
	returns: boolean;
	/** Trailing `:type`. */
	returnType?: string;
	selfCtx: SelfCtx;
	/** `${raw}` prefix - the call receives the raw calling context. */
	raw: boolean;
	/** `#` flag - pure / constant-foldable. */
	pure: boolean;
	/** `&` flag. */
	deprecated: boolean;
	/** `$` = US spelling twin, `£` = UK spelling twin. */
	spelling: Spelling;
	/** `//{ group` fold marker this entry sits under; `""` for unnamed groups. */
	category: string;
	/** The original `api.gml` line, verbatim. */
	signature: string;
}

export interface ConstantInfo {
	name: string;
	/** Right-hand side of `name = value`; a number when the value parses as one. */
	value?: number | string;
	/** `:type` annotation on a `name#:type` declaration. */
	type?: string;
	category: string;
	/** `$` = US spelling twin, `£` = UK spelling twin. */
	spelling: Spelling;
	/** `&` flag. */
	deprecated: boolean;
}

export interface VariableInfo {
	name: string;
	/** `*` flag. */
	readOnly: boolean;
	/** `name[player]` - indexed by player slot (0..maxp-1). */
	perPlayer: boolean;
	type?: string;
	/** `#` flag. */
	constant: boolean;
	category: string;
	/** Came from `default.gml` (built-in instance variable / argument slot). */
	builtin: boolean;
}

export interface AssetTables {
	sprites: string[];
	masks: string[];
	shaders: string[];
	sounds: string[];
	music: string[];
	ambience: string[];
	fonts: string[];
	objects: string[];
}

export interface DocEntry {
	/** Markdown prose extracted from the DocMark sources. */
	markdown: string;
	/** File the prose came from, e.g. `API-Strings.dmd`. */
	source: string;
	/**
	 * True when the prose is the shared lead-in of a signature list rather
	 * than documentation written for this name specifically.
	 */
	group?: boolean;
}

export type DocMap = { [name: string]: DocEntry };

export interface ApiMeta {
	/** `game_version` constant from the dump, e.g. `100034`. */
	gameVersion: number;
	/** The dump's own `// Generated at ...` header (not the time this ran). */
	generatedAt: string;
	/** Which input the tables were generated from. */
	source: string;
}

// --- hand-maintained tables (src/tables/*.ts) ---

/** A mod file's middle extension. */
export type ModType = 'mod' | 'wep' | 'race' | 'skin' | 'skill' | 'crown' | 'area';

export interface ModEventInfo {
	name: string;
	/** Argument names the spec gives for this event, in order. */
	args: string[];
	/**
	 * `true` when the name is documented and/or confirmed in the game binary's
	 * string tables; `false` for mod-local conventions that no engine dispatch
	 * uses (rank these lower).
	 */
	engine: boolean;
	/** One-line description, where NTGML-SPEC.md gives one. */
	doc?: string;
	/** Why a non-engine name is listed anyway. */
	note?: string;
}

export interface CustomObjectInfo {
	name: string;
	/** Another entry in this table whose callback fields this one inherits. */
	extends?: string;
	/**
	 * `parent_index` when the parent is an engine object rather than another
	 * custom object (`hitme`, `enemy`, `projectile`, ...). Recorded for
	 * documentation only - it contributes no fields. The docs ship no list of
	 * engine instance variables, so any that a mod is expected to use are
	 * listed explicitly in the entry's own `fields`.
	 */
	engineParent?: string;
	/** Fields declared by this object itself (not inherited). */
	fields: CustomObjectField[];
	doc?: string;
}

export interface CustomObjectField {
	name: string;
	doc?: string;
}

/**
 * Where a generated object field came from, when it is not the `fields.gml`
 * dump. `docs` = only the `api/ntt-docs/objects/*.html` pages list it;
 * `hand` = only `api/fields-overrides.gml` does. Omitted for dump fields,
 * which are the overwhelming majority.
 */
export type FieldSource = 'docs' | 'hand';

/** One instance variable of a game object. */
export interface ObjectFieldInfo {
	name: string;
	/** Declared type, where a docs page gives one. */
	type?: string;
	/** Prose, where a docs page gives some. */
	doc?: string;
	source?: FieldSource;
}

/**
 * The instance variables one game object DECLARES. Inherited ones are reached
 * by walking `parent`; see `fieldsFor` in `src/tables/object-fields.ts`.
 */
export interface ObjectFieldsInfo {
	name: string;
	/**
	 * Parent object, as `fields.gml` writes it. Five entries name a parent
	 * that has no entry of its own; those are treated as chain roots.
	 */
	parent?: string;
	/** The `default` marker: the object supports built-in instance variables. */
	builtin: boolean;
	/** The `*` marker: the object supports mod-defined variables. */
	modFields: boolean;
	/** Fields this object declares itself, not counting inherited ones. */
	fields: ObjectFieldInfo[];
}

export interface KeywordInfo {
	name: string;
	/** Which dialect accepts the keyword (NTGML-SPEC.md §2.5). */
	dialect: 'both' | 'modern';
	doc?: string;
}

export interface PragmaInfo {
	name: string;
	/** `file` = only valid at file level; `statement` = inside a function body. */
	scope: 'file' | 'statement';
	/** Argument the pragma takes, if any. */
	arg?: string;
	doc?: string;
}

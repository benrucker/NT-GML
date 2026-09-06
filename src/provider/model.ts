/**
 * Plain data model shared by the completion, hover and signature-help
 * providers.
 *
 * Nothing under `src/provider/` imports `vscode`: this layer builds plain
 * records from `src/generated/*` and `src/tables/*`, the thin VS Code layer in
 * `src/completionProvider.ts` maps them onto `vscode.CompletionItem`,
 * `vscode.Hover` and `vscode.SignatureHelp`, and `test/provider.test.ts`
 * exercises everything here on plain Node.
 */

/**
 * Item kind, mapped to a `vscode.CompletionItemKind` by the VS Code layer.
 * Asset kinds are kept apart so the mapping and the `detail` text can differ
 * per namespace (NTGML-SPEC.md section 6).
 */
export type ItemKind =
	| 'function'
	| 'constant'
	| 'variable'
	| 'keyword'
	| 'builtin-constant'
	| 'soft-keyword'
	| 'preprocessor'
	| 'pragma'
	| 'event'
	| 'field'
	| 'button'
	| 'sprite'
	| 'mask'
	| 'shader'
	| 'sound'
	| 'music'
	| 'ambience'
	| 'font'
	| 'object';

/** One completion / hover entry. */
export interface ItemData {
	/** Label, and the word a hover looks up. */
	name: string;
	kind: ItemKind;
	/** One-line `detail` text (the raw `api.gml` line for functions). */
	detail: string;
	/** Text to insert; a TextMate snippet when `snippet` is true. */
	insertText: string;
	/** Whether `insertText` is a snippet (`${1:arg}` placeholders). */
	snippet: boolean;
	/** Markdown documentation, also used verbatim by the hover provider. */
	documentation: string;
	/** `<tier><rank><name>`; see `sortTextFor` in `items.ts`. */
	sortText: string;
	/** `&` flag - render struck through and sort last within the tier. */
	deprecated: boolean;
	/** Set to `'modern'` for words only the `.ntgml` dialect accepts. */
	dialect?: 'modern';
	/**
	 * Right-hand side of the label, for the few names that also exist as
	 * something else in the same list (`exit` is a button and a keyword).
	 */
	labelDescription?: string;
}

/** One parameter of a signature-help signature. */
export interface ParameterData {
	/**
	 * `[start, end)` offsets of the parameter inside `SignatureData.label`.
	 * Offsets, not a string: VS Code resolves a string label by its first
	 * occurrence, which highlights the wrong argument whenever two render the
	 * same, as in `matrix_multiply(matrix: array, matrix: array)`.
	 */
	label: [number, number];
	/** Markdown documentation for the parameter. */
	documentation: string;
}

/** A signature-help payload for one call. */
export interface SignatureData {
	/** Rendered signature, e.g. `weapon_get_name(wep) -> string`. */
	label: string;
	/** Markdown: the raw `api.gml` line plus the function's documentation. */
	documentation: string;
	parameters: ParameterData[];
	/**
	 * Index into `parameters`, clamped to the last one so an extra comma keeps
	 * the signature up instead of clearing the highlight; on a trailing rest
	 * argument that is `...values` itself, however many values are passed.
	 */
	activeParameter: number;
}

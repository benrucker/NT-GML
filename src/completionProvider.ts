/**
 * The VS Code layer: maps the plain records built in `src/provider/` onto
 * `vscode.CompletionItem`, `vscode.Hover` and `vscode.SignatureHelp`.
 *
 * Everything with logic in it - item building, context rules, documentation,
 * signatures, sorting - lives under `src/provider/`, which imports no
 * `vscode` and is covered by `test/provider.test.ts` on plain Node. Keep this
 * file a translation layer.
 *
 * The one thing it does think about is cost. Every keystroke calls in here, so
 * nothing may read the whole document: the dialect comes from a bounded head
 * slice cached per document version, and the context rules get a bounded slice
 * before the cursor.
 */

import * as vscode from 'vscode';

import { CursorInput, HEAD_LIMIT, WINDOW_LIMIT, detectContext, dialectFor } from './provider/context';
import { itemsFor, lookupItem } from './provider/items';
import { ItemData, ItemKind } from './provider/model';
import { signatureAt } from './provider/signature';

/**
 * Identifiers, for the word under a hover. The leading `#` is part of the word
 * so `#define` and `#pragma` are hovered whole.
 */
const WORD = /#?[A-Za-z_][A-Za-z0-9_]*/;

/**
 * Trigger characters. Each one lands in a context rule: `#` starts a
 * preprocessor line, `.` is member access, `"` opens a button-name string and
 * `(` enters an argument list. Where the rules have nothing to offer they
 * return an empty list rather than the whole table.
 */
export const COMPLETION_TRIGGERS = ['#', '.', '"', '('];

/** `(` and `,` open signature help; `)` closes the call it belongs to. */
export const SIGNATURE_TRIGGERS = ['(', ','];
export const SIGNATURE_RETRIGGERS = [')'];

/** Lines of the file scanned for the file-level `#pragma gml 2`. */
const HEAD_LINES = 40;

function completionKind(kind: ItemKind): vscode.CompletionItemKind {
	switch (kind) {
		case 'function': return vscode.CompletionItemKind.Function;
		case 'constant':
		case 'builtin-constant': return vscode.CompletionItemKind.Constant;
		case 'variable': return vscode.CompletionItemKind.Variable;
		case 'keyword':
		case 'soft-keyword':
		case 'preprocessor':
		case 'pragma': return vscode.CompletionItemKind.Keyword;
		case 'event': return vscode.CompletionItemKind.Event;
		case 'field': return vscode.CompletionItemKind.Field;
		case 'button': return vscode.CompletionItemKind.EnumMember;
		case 'object': return vscode.CompletionItemKind.Class;
		default: return vscode.CompletionItemKind.Value;
	}
}

/** Converted items, keyed by the record they came from. */
const converted = new WeakMap<ItemData, vscode.CompletionItem>();

/**
 * The `vscode.CompletionItem` for a record. Items are cached and reused, so
 * `range` - the only part that changes between requests - is written on every
 * call rather than baked in. Overwriting it on a shared item is safe because
 * the host serialises the returned list before control comes back here: no
 * two requests hold the same item at once.
 */
function toCompletionItem(item: ItemData, range: vscode.Range | undefined): vscode.CompletionItem {
	const cached = converted.get(item);
	if (cached !== undefined) {
		cached.range = range;
		return cached;
	}
	const label: vscode.CompletionItemLabel | string = item.labelDescription === undefined
		? item.name
		: { label: item.name, description: item.labelDescription };
	const entry = new vscode.CompletionItem(label, completionKind(item.kind));
	entry.detail = item.detail;
	entry.documentation = new vscode.MarkdownString(item.documentation);
	entry.insertText = item.snippet
		? new vscode.SnippetString(item.insertText)
		: item.insertText;
	entry.sortText = item.sortText;
	entry.range = range;
	if (item.deprecated) { entry.tags = [vscode.CompletionItemTag.Deprecated]; }
	converted.set(item, entry);
	return entry;
}

/** Dialect of the last document asked about, invalidated by an edit. */
let dialectCache: { key: string; version: number; dialect: 'legacy' | 'modern' } | undefined;

/**
 * The document's dialect. `#pragma gml 2` is a file-level directive, so only
 * the head of the file is scanned for it, and the answer is cached until the
 * document changes.
 */
function dialectOf(document: vscode.TextDocument): 'legacy' | 'modern' {
	const key = document.uri.toString();
	if (dialectCache !== undefined
		&& dialectCache.key === key
		&& dialectCache.version === document.version) {
		return dialectCache.dialect;
	}
	const lastLine = Math.min(document.lineCount, HEAD_LINES) - 1;
	const head = document.getText(new vscode.Range(
		new vscode.Position(0, 0), document.lineAt(lastLine).range.end));
	const dialect = dialectFor(document.languageId, head.slice(0, HEAD_LIMIT));
	dialectCache = { key, version: document.version, dialect };
	return dialect;
}

/**
 * The text the scanners run over: at most `WINDOW_LIMIT` characters before the
 * position, snapped forward to a line start so a window never opens in the
 * middle of a string - unless the cursor's own line is longer than the window,
 * where there is no earlier line to snap to.
 */
function precedingText(document: vscode.TextDocument, position: vscode.Position): string {
	const offset = document.offsetAt(position);
	let start = document.positionAt(Math.max(0, offset - WINDOW_LIMIT));
	if (start.character > 0 && start.line < position.line) {
		start = new vscode.Position(start.line + 1, 0);
	}
	return document.getText(new vscode.Range(start, position));
}

/** Builds the input the context rules need from a document position. */
function cursorInput(document: vscode.TextDocument, position: vscode.Position, end?: number): CursorInput {
	const line = document.lineAt(position.line).text;
	return {
		languageId: document.languageId,
		fileName: document.fileName,
		linePrefix: line.slice(0, end ?? position.character),
		precedingText: precedingText(document, position),
		dialect: dialectOf(document),
	};
}

/** Completions for both NTGML dialects. */
export const NTGMLCompletionProvider: vscode.CompletionItemProvider = {
	provideCompletionItems(document, position) {
		const ctx = detectContext(cursorInput(document, position));
		// VS Code's own word range stops at a `#`, so a `#define` item would
		// insert `##define`. Replacing from the start of our word fixes that,
		// and is what every item in the list wants anyway.
		const range = new vscode.Range(
			new vscode.Position(position.line, ctx.wordStart), position);
		return itemsFor(ctx).map((item) => toCompletionItem(item, range));
	},
};

/** Hover documentation for the word under the cursor. */
export const NTGMLHoverProvider: vscode.HoverProvider = {
	provideHover(document, position) {
		const range = document.getWordRangeAtPosition(position, WORD);
		if (range === undefined) { return undefined; }
		// The context is resolved as if the cursor sat just after the word, so
		// the `#pragma`, `#define` and `on_` rules see the same text they do
		// while it is being typed.
		const ctx = detectContext(cursorInput(document, range.end, range.end.character));
		const item = lookupItem(ctx);
		if (item === undefined) { return undefined; }
		return new vscode.Hover(new vscode.MarkdownString(item.documentation), range);
	},
};

/** Signature help for the innermost unclosed call before the cursor. */
export const NTGMLSignatureHelpProvider: vscode.SignatureHelpProvider = {
	provideSignatureHelp(document, position) {
		const data = signatureAt(precedingText(document, position));
		if (data === undefined) { return undefined; }
		const signature = new vscode.SignatureInformation(
			data.label, new vscode.MarkdownString(data.documentation));
		signature.parameters = data.parameters.map(
			(p) => new vscode.ParameterInformation(p.label, new vscode.MarkdownString(p.documentation)));
		const help = new vscode.SignatureHelp();
		help.signatures = [signature];
		help.activeSignature = 0;
		help.activeParameter = data.activeParameter;
		return help;
	},
};

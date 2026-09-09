/**
 * The wiring, through the real editor: activation, the three language ids the
 * manifest contributes, and that VS Code hands our completion, hover and
 * signature-help providers back what `test/provider.test.ts` says they build.
 *
 * This is deliberately NOT a second copy of the provider goldens. Every
 * expectation below is one line of one golden under `test/fixtures/provider/`,
 * cited next to the assertion; the point being tested is that the registration
 * in `src/extension.ts` and the conversion in `src/completionProvider.ts` carry
 * that line out to the host at all.
 *
 * Everything lives in one file because activation is one-way: the first NTGML
 * document opened in the run activates the extension, so the "not active yet"
 * assertions have to come first and stay first.
 */

import * as assert from 'node:assert/strict';
import * as path from 'node:path';

import * as vscode from 'vscode';

const EXTENSION_ID = 'benrucker.ntgml';

/** The throwaway workspace `runTests.ts` filled with `test-integration/fixtures/`. */
function fixture(name: string): vscode.Uri {
	const folder = vscode.workspace.workspaceFolders?.[0];
	assert.ok(folder !== undefined, 'the host was launched without a workspace folder');
	return vscode.Uri.file(path.join(folder.uri.fsPath, name));
}

function extension(): vscode.Extension<unknown> {
	const ext = vscode.extensions.getExtension(EXTENSION_ID);
	assert.ok(ext !== undefined, EXTENSION_ID + ' is not loaded in the host');
	return ext;
}

const open = (name: string): Thenable<vscode.TextDocument> =>
	vscode.workspace.openTextDocument(fixture(name));

async function waitFor(ok: () => boolean, what: string, ms = 5000): Promise<void> {
	const deadline = Date.now() + ms;
	while (!ok()) {
		assert.ok(Date.now() < deadline, 'timed out after ' + ms + ' ms waiting for ' + what);
		await new Promise((resolve) => setTimeout(resolve, 50));
	}
}

/**
 * A cursor at the end of the line whose text is `text` (plus `tail`, inserted
 * here rather than committed to the fixture, because `.editorconfig` trims
 * trailing whitespace and two of the golden cases below end in a space).
 * Idempotent, so a later test may ask for the same position again.
 */
async function cursorAfter(
	doc: vscode.TextDocument, text: string, tail = '',
): Promise<vscode.Position> {
	for (let i = 0; i < doc.lineCount; i++) {
		const line = doc.lineAt(i).text;
		if (line === text + tail) { return new vscode.Position(i, line.length); }
		if (line !== text) { continue; }
		const edit = new vscode.WorkspaceEdit();
		edit.insert(doc.uri, new vscode.Position(i, line.length), tail);
		assert.ok(await vscode.workspace.applyEdit(edit), 'could not append to line ' + i);
		return new vscode.Position(i, line.length + tail.length);
	}
	throw new Error('no line reading ' + JSON.stringify(text + tail) + ' in ' + doc.uri.fsPath);
}

/**
 * The completion items *this extension* contributed at `position`.
 *
 * Items of kind `Text` are dropped, and that filter is what makes every
 * completion test below sensitive to the registration at all. VS Code's own
 * word-based suggestions harvest every word out of the open documents and come
 * back through this command as `Text` items, so `instance_create` is offered -
 * by the editor, off the fixture's own text - even with `activate()` gutted.
 * (`editor.wordBasedSuggestions` defaults to `offWithInlineSuggestions` on
 * 1.136.2; they show up here because `--disable-extensions` leaves no
 * inline-completion provider registered.) `completionKind` in
 * src/completionProvider.ts never returns `Text`, so nothing of ours is lost.
 */
async function completionsAt(
	uri: vscode.Uri, position: vscode.Position,
): Promise<vscode.CompletionItem[]> {
	const list = await vscode.commands.executeCommand<vscode.CompletionList>(
		'vscode.executeCompletionItemProvider', uri, position);
	return list.items.filter((item) => item.kind !== vscode.CompletionItemKind.Text);
}

/** A label; the provider uses both the string and the object form. */
const labelOf = (item: vscode.CompletionItem): string =>
	typeof item.label === 'string' ? item.label : item.label.label;

const labelsAt = async (uri: vscode.Uri, position: vscode.Position): Promise<string[]> =>
	(await completionsAt(uri, position)).map(labelOf);

describe('activation and language ids', () => {
	// Ordered on purpose: each test opens one more document, and the NTGML
	// documents have to come before the ntt-main ones. Since VS Code 1.74 a
	// contributed language that also declares a `configuration` (all three of
	// ours do) is an *implicit* activation event, so opening main.txt wakes the
	// extension up too even though `activationEvents` does not say so -
	// measured on 1.136.2, whose exthost.log says "_doActivateExtension
	// benrucker.ntgml, startup: false, activationEvent: 'onLanguage:ntt-main'".
	// Opening one of those first would make the assertion below vacuous.

	it('the extension is loaded but not yet active', () => {
		assert.equal(extension().isActive, false,
			'something activated the extension before an NTGML document was opened');
	});

	it('maintenance.txt stays plaintext: the pattern is main[0-9]*.txt', async () => {
		const doc = await open('maintenance.txt');
		assert.equal(doc.languageId, 'plaintext');
		// A language this extension does not contribute: nothing to activate on.
		assert.equal(extension().isActive, false);
	});

	it('.ntgml and .gml get the two dialects, and opening one activates', async () => {
		assert.equal((await open('thing.mod.ntgml')).languageId, 'ntgml');
		assert.equal((await open('thing.mod.gml')).languageId, 'ntgml-legacy');
		await waitFor(() => extension().isActive, 'onLanguage activation');
	});

	it('main.txt, main.cfg and main2.txt are ntt-main, and get nothing', async () => {
		// Two filenames and one filenamePattern.
		for (const name of ['main.txt', 'main.cfg', 'main2.txt']) {
			const doc = await open(name);
			assert.equal(doc.languageId, 'ntt-main', name);
		}
		// README.md line 44: "It is highlighting only: no completions and no
		// hovers." The extension is active by now - the test above opened an
		// NTGML document - so what this asserts is the selector in
		// src/extension.ts, which names only the two NTGML ids, and not mere
		// inactivity. `completionsAt` drops the editor's own word-based `Text`
		// items, which an ntt-main document does get.
		const main = await open('main.txt');
		const inside = new vscode.Position(0, '/loadm'.length); // inside /loadmod
		// On `.length`, not `deepEqual([])`: if the selector ever grew an
		// ntt-main entry the actual value would be the whole 5,000-odd item
		// table, and formatting that diff runs Node out of memory.
		const items = await completionsAt(main.uri, inside);
		assert.equal(items.length, 0, 'ntt-main got ' + items.length + ' completions: '
			+ items.slice(0, 5).map(labelOf).join(', ') + ' ...');
		// The hover needs a word the provider would actually resolve, or the
		// empty result proves nothing: `/gml` takes a line of GML, so the
		// fixture's second line holds a real function name. With `ntt-main` in
		// NTGML_SELECTOR this comes back non-empty (measured by adding it).
		const gmlLine = main.getText().indexOf('instance_create');
		assert.ok(gmlLine >= 0, 'main.txt lost its /gml line');
		assert.deepEqual(await vscode.commands.executeCommand<vscode.Hover[]>(
			'vscode.executeHoverProvider', main.uri, main.positionAt(gmlLine + 3)), []);
	});

	it('the manifest contributes three languages and three grammars that exist', async () => {
		const ext = extension();
		const contributes = ext.packageJSON.contributes as {
			languages: { id: string }[];
			grammars: { scopeName: string; path: string }[];
		};
		// What `activationEvents` declares is asserted against package.json on
		// disk, in test/packaging.test.ts. The host's copy of the manifest is
		// not the place for it: whether VS Code materialises the implicit
		// events into it is a VS Code internal.
		assert.deepEqual(contributes.languages.map((l) => l.id).sort(),
			['ntgml', 'ntgml-legacy', 'ntt-main']);
		assert.deepEqual(contributes.grammars.map((g) => g.scopeName).sort(),
			['source.ntgml', 'source.ntgml.legacy', 'source.ntt-main']);
		for (const grammar of contributes.grammars) {
			const uri = vscode.Uri.joinPath(ext.extensionUri, grammar.path);
			await vscode.workspace.fs.stat(uri); // throws if the file is not there
		}
	});
});

describe('completions through vscode.executeCompletionItemProvider', () => {
	let gml: vscode.TextDocument;
	let ntgml: vscode.TextDocument;

	before(async () => {
		await extension().activate();
		gml = await open('thing.mod.gml');
		ntgml = await open('thing.mod.ntgml');
	});

	it('a partial function name offers the function', async () => {
		const at = await cursorAfter(gml, 'instance_cre');
		// golden: test/fixtures/provider/items.txt line 472,
		// "function<TAB>instance_create<TAB>30instance_create<TAB>..."
		assert.ok((await labelsAt(gml.uri, at)).includes('instance_create'));
	});

	it('a #define line offers the .mod events', async () => {
		const at = await cursorAfter(gml, '#define', ' ');
		// golden: test/fixtures/provider/context-cases.txt line 11 is the
		// "#define <>" rule (there for a .wep file); the mod type comes from
		// the file name, and the .mod event set is context-items.txt
		// "## events .mod" lines 2 (init) and 8 (step).
		const labels = await labelsAt(gml.uri, at);
		assert.ok(labels.includes('init'), 'no init');
		assert.ok(labels.includes('step'), 'no step');
	});

	it('a member access on one of the game objects offers its fields', async () => {
		const at = await cursorAfter(gml, 'Player.we');
		// golden: context-cases.txt line 102 ("Player.we<>") and
		// context-items.txt line 500, "field<TAB>wep<TAB>10wep<TAB>instance
		// variable of Player".
		assert.ok((await labelsAt(gml.uri, at)).includes('wep'));
	});

	it('a with (CustomEnemy) body offers that object callbacks', async () => {
		const at = await cursorAfter(gml, '    on_ste');
		// golden: context-cases.txt line 43
		// ("    on_ste<> | with (CustomEnemy) {\n") and context-items.txt line
		// 258 under "## fields CustomEnemy", "field<TAB>on_step<TAB>...".
		assert.ok((await labelsAt(gml.uri, at)).includes('on_step'));
	});

	it('a preprocessor item replaces from its own #, not from the editor word', async () => {
		const at = await cursorAfter(gml, '#def');
		// golden: context-cases.txt line 75, "thing.mod.gml | ntgml-legacy |
		// #def<>". The point here is the conversion, not the item: VS Code's
		// own word range stops at the `#`, so an item with no explicit range
		// would insert `##define`. src/completionProvider.ts builds the range
		// from `ctx.wordStart` instead, and that is only observable in a host.
		const item = (await completionsAt(gml.uri, at)).find((i) => labelOf(i) === '#define');
		assert.ok(item !== undefined, 'no #define item offered on a #def line');
		const range = item.range;
		assert.ok(range !== undefined, 'no explicit range, so VS Code would use its own word');
		const start = 'start' in range ? range.start : range.replacing.start;
		assert.equal(start.character, 0, 'the range does not start at the #');
	});

	it('the modern keywords are offered in .ntgml and hidden in .gml', async () => {
		// golden: test/provider.test.ts line 173, "items: dialect gating hides
		// the modern keywords in legacy files" (function, new, static,
		// constructor), over the context-cases.txt "var a = <>" pair, lines
		// 60 and 61.
		const modernOnly = ['function', 'new', 'static', 'constructor'];
		const inModern = await labelsAt(ntgml.uri, await cursorAfter(ntgml, 'var a =', ' '));
		const inLegacy = await labelsAt(gml.uri, await cursorAfter(gml, 'var a =', ' '));
		for (const name of modernOnly) {
			assert.ok(inModern.includes(name), name + ' should be offered in .ntgml');
			assert.ok(!inLegacy.includes(name), name + ' should be hidden in .gml');
		}
	});
});

describe('hover and signature help', () => {
	let gml: vscode.TextDocument;

	before(async () => {
		await extension().activate();
		gml = await open('thing.mod.gml');
	});

	it('hovering a function shows its rendered signature', async () => {
		const at = await cursorAfter(gml, 'instance_create(x, y, obj);');
		const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
			'vscode.executeHoverProvider', gml.uri,
			at.with({ character: 'instance_cre'.length }));
		const text = hovers
			.flatMap((hover) => hover.contents)
			.map((content) => (typeof content === 'string' ? content : content.value))
			.join('\n');
		// golden: test/fixtures/provider/documentation.md line 50.
		assert.ok(text.includes('instance_create(x, y, obj, ?var_struct) -> value'), text);
	});

	it('signature help highlights the argument the cursor is in', async () => {
		const at = await cursorAfter(gml, 'instance_create(x, y,', ' ');
		const help = await vscode.commands.executeCommand<vscode.SignatureHelp>(
			'vscode.executeSignatureHelpProvider', gml.uri, at);
		// golden: test/fixtures/provider/signature.json lines 17-20, case
		// "instance_create(x, y, <>".
		assert.equal(help.activeParameter, 2);
		assert.equal(help.signatures[0].label,
			'instance_create(x, y, obj, ?var_struct) -> value');
	});
});

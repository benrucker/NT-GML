import * as vscode from 'vscode';
import {
	COMPLETION_TRIGGERS,
	NTGMLCompletionProvider,
	NTGMLHoverProvider,
	NTGMLSignatureHelpProvider,
	SIGNATURE_RETRIGGERS,
	SIGNATURE_TRIGGERS,
} from './completionProvider';

/** Language ids contributed by this extension (legacy `.gml` and modern `.ntgml`). */
const NTGML_SELECTOR: vscode.DocumentSelector = ['ntgml', 'ntgml-legacy'];

// Called the first time a document in one of the contributed languages is
// opened - ntt-main included, which registers nothing here: since VS Code 1.74
// a contributed language that also declares a `configuration` is an implicit
// activation event, and all three of ours do.
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.languages.registerCompletionItemProvider(
			NTGML_SELECTOR, NTGMLCompletionProvider, ...COMPLETION_TRIGGERS),
		vscode.languages.registerHoverProvider(NTGML_SELECTOR, NTGMLHoverProvider),
		vscode.languages.registerSignatureHelpProvider(NTGML_SELECTOR, NTGMLSignatureHelpProvider, {
			triggerCharacters: SIGNATURE_TRIGGERS,
			retriggerCharacters: SIGNATURE_RETRIGGERS,
		}),
	);
}

// Called when the extension is deactivated.
export function deactivate() {}

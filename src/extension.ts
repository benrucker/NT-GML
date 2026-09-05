import * as vscode from 'vscode';
import { NTGMLProvider } from './completionProvider';

/** Language ids contributed by this extension (legacy `.gml` and modern `.ntgml`). */
const NTGML_SELECTOR: vscode.DocumentSelector = ['ntgml', 'ntgml-legacy'];

// Called the first time an NTGML document is opened.
export function activate(context: vscode.ExtensionContext) {
	const provider = vscode.languages.registerCompletionItemProvider(NTGML_SELECTOR, NTGMLProvider);

	context.subscriptions.push(provider);
}

// Called when the extension is deactivated.
export function deactivate() {}

import * as vscode from 'vscode';

/**
 * Placeholder completion provider for both NTGML dialects.
 *
 * TODO(§5.4): build items from src/generated tables
 */
export const NTGMLProvider: vscode.CompletionItemProvider = {

	provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken,
		context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList>
	{
		return [];
	}
};

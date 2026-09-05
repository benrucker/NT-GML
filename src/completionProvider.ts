import * as vscode from 'vscode';

/**
 * Placeholder completion provider for both NTGML dialects.
 *
 * TODO(§5.4): build items from src/generated tables
 */
export const NTGMLProvider: vscode.CompletionItemProvider = {

	provideCompletionItems(
		_document: vscode.TextDocument,
		_position: vscode.Position,
		_token: vscode.CancellationToken,
		_context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList>
	{
		return [];
	}
};


import * as vscode from 'vscode';
import * as path from 'path';
import { g4macrocommands } from './g4macrocommands';

export function activate(context: vscode.ExtensionContext) {

	// Import the completions JSON
	const completionsPath = path.join(context.extensionPath, 'completions.json');

	const commands = new g4macrocommands(completionsPath);

	// Create a diagnostic collection for the type errors
	const typeDiagnostics = vscode.languages.createDiagnosticCollection("types");
	context.subscriptions.push(typeDiagnostics);

	commands.maintainDiagnostics(context, typeDiagnostics);

	// Provide completions for the UI commands
	const completionsProvider = vscode.languages.registerCompletionItemProvider(
		'g4macro',
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {

				// Get the line up to the current cursor
				const linePrefix = document.lineAt(position).text.slice(0, position.character);

				return commands.getCompletionItems(linePrefix);

			}
		},
		'/'
	);

	// Provide the function signatures for the UI calls
	const signatureInfoProvider = vscode.languages.registerSignatureHelpProvider(
		'g4macro',
		{
			provideSignatureHelp(document: vscode.TextDocument, position: vscode.Position) {

				// Get the line up to the current cursor
				const linePrefix = document.lineAt(position).text.slice(0, position.character);

				return commands.getCurrentSignature(linePrefix);
			},
		},
		' '
	);

	context.subscriptions.push(completionsProvider, signatureInfoProvider);
}
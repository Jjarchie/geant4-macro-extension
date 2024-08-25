
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import {g4macrocommands} from './g4macrocommands';

export function activate(context: vscode.ExtensionContext) {
	
	// Import the completions JSON
	const completionsPath = path.join(context.extensionPath, 'completions.json');

	const commands = new g4macrocommands(completionsPath);

	const completionsProvider = vscode.languages.registerCompletionItemProvider(
		'*',
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {

				// Get the line up to the current cursor
				const linePrefix = document.lineAt(position).text.slice(0, position.character);

				return commands.getCompletionItems(linePrefix);
				
			}
		},
		'/'
	);

	const signatureInfoProvider = vscode.languages.registerSignatureHelpProvider(
		'*',
		{
			provideSignatureHelp(document: vscode.TextDocument, position: vscode.Position) {
				console.log("finding signature help...");
				
				// Get the line up to the current cursor
				const linePrefix = document.lineAt(position).text.slice(0, position.character);

				return commands.getCurrentSignature(linePrefix);
			},
		},
		' '
	);

	context.subscriptions.push(completionsProvider, signatureInfoProvider);
}
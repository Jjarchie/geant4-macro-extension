
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import {g4macrocommands} from './g4macrocommands';

export function activate(context: vscode.ExtensionContext) {
	
	console.log('Activating Geant4 Macro Extension...');

	// A placeholder for regenerating the UI command cache
	const regenerateCacheCmd = vscode.commands.registerCommand('extension.regenerateCache', () => {
		vscode.window.showInformationMessage('TODO: Implement regenerateCache command.');
	});

	context.subscriptions.push(regenerateCacheCmd);

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

	context.subscriptions.push(completionsProvider);
}
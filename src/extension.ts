
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
	
	console.log('Activating Geant4 Macro Extension...');

	// A placeholder for regenerating the UI command cache
	const regenerateCacheCmd = vscode.commands.registerCommand('extension.regenerateCache', () => {
		vscode.window.showInformationMessage('TODO: Implement regenerateCache command.');
	});

	context.subscriptions.push(regenerateCacheCmd);

	// Import the completions JSON
	const completionsPath = path.join(context.extensionPath, 'completions.json');
	const completions = JSON.parse(fs.readFileSync(completionsPath, 'utf-8'));

	const completionsProvider = vscode.languages.registerCompletionItemProvider(
		'*',
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {

				// Get the line up to the current cursor
				const linePrefix = document.lineAt(position).text.slice(0, position.character);

				// Skip if the first character is not a slash
				if (linePrefix[0] != '/')
					return [];

				// Split into the different directories
				const splitString = linePrefix.slice(1, linePrefix.length).split('/');

				// Access the correct branch of the dictionary
				let currentCompletions = completions;
				
				for (const entry of splitString.slice(0, -1))
				{

					if (!(entry in currentCompletions))
					{	
						console.log(entry + ' not in ' + currentCompletions);
						
						return [];}

					currentCompletions = currentCompletions[entry];
				}
				
				// Register the completion items
				const completionItems = [];

				for (const val in currentCompletions)
				{
					const completionKind = ("guidance" in currentCompletions[val]) 
						? vscode.CompletionItemKind.Function
						: vscode.CompletionItemKind.Class;

					completionItems.push(new vscode.CompletionItem(val, completionKind));
				}

				return completionItems;
			}
		},
		'/'
	);

	context.subscriptions.push(completionsProvider);
}
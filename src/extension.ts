
import * as vscode from 'vscode';
import * as path from 'path';
import { g4macrocommands } from './g4macrocommands';

export function activate(context: vscode.ExtensionContext) {

	// Import the completions JSON
	const completionsPath = path.join(context.extensionPath, 'command_output.txt');

	const commands = new g4macrocommands(completionsPath);

	// Create a diagnostic collection for the type errors
	const typeDiagnostics = vscode.languages.createDiagnosticCollection("types");
	context.subscriptions.push(typeDiagnostics);

	commands.maintainDiagnostics(context, typeDiagnostics);

	// Provide code actions, currently for actioning unknown commands
	const codeActionProvider = vscode.languages.registerCodeActionsProvider(
		'g4macro',
		{
			provideCodeActions(document: vscode.TextDocument, range: vscode.Range, context: vscode.CodeActionContext) {

				const actions: vscode.CodeAction[] = [];

				context.diagnostics.forEach((diagnostic) => {
					if (diagnostic.code != "unknown_command")
						return;

					const action = new vscode.CodeAction("Add command to registry", vscode.CodeActionKind.QuickFix);

					let command: string = document.getText(diagnostic.range);
					command = command.slice(0, command.indexOf(' '));

					action.command = {
						command: 'geant4-macro-extension.addCommand',
						title: "Add command to registry",
						arguments: [command]
					};

					actions.push(action);
				});

				return actions;

			}
		}
	);

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

	context.subscriptions.push(completionsProvider, signatureInfoProvider, codeActionProvider);

	// Register the command to add addtional UI commands to the registry
	context.subscriptions.push(vscode.commands.registerCommand('geant4-macro-extension.addCommandFile', () => {

		// Open the file picker
		const files = vscode.window.showOpenDialog({
			canSelectFiles: true,
			canSelectFolders: false,
			canSelectMany: true,
			title: "Select command file(s) to add."
		});

		// Skip if no files are selected
		if (files == undefined)
			return;

		// Add the files to the extension configuration
		files.then((uris) => {
			if (uris == undefined)
				return;

			commands.addCommands(uris);
		});

	}));

	// Register command to remove a command file from the registry
	context.subscriptions.push(vscode.commands.registerCommand('geant4-macro-extension.removeCommandFile', () => {

		// Get the list of command files
		const commandFiles = commands.getCommandFiles();

		// Skip if no files are available
		if (commandFiles.length == 0) {
			vscode.window.showInformationMessage("No command files are currently loaded.");
			return;
		}

		// Open the quick pick to select the file to remove
		vscode.window.showQuickPick(commandFiles).then((value) => {
			if (value == undefined)
				return;

			commands.removeCommands(value);
		});

	}));

	// Register the command to refresh the UI command registry
	context.subscriptions.push(vscode.commands.registerCommand('geant4-macro-extension.refreshCommands', () => {
		commands.refreshCommands();
	}));

	// Register a command to add an additional command to the registry
	context.subscriptions.push(vscode.commands.registerCommand('geant4-macro-extension.addCommand', (command: string) => {

		// Add the command if it is supplied as an argument
		if (command != undefined) {
			commands.addCommand(command);
			return;
		}

		// Prompt the user for the command name if it is not supplied as an argument
		vscode.window.showInputBox({
			prompt: "Enter the command to add."
		}).then((value) => {
			if (value == undefined)
				return;

			commands.addCommand(value);
		});


	}));
}
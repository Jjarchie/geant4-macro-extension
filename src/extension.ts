
import * as vscode from 'vscode';
import * as path from 'path';
import { g4macrocommands } from './g4macrocommands';
import { G4MacroDefinitionProvider } from './G4MacroDefinitionProvider';
import { G4MacroRenameProvider } from './G4MacroRenameProvider';
import { G4MacroCommandTreeDataProvider, G4MacroCommandTreeItem } from './G4MacroCommandTreeView';
import { G4MacroCommandInfoViewProvider } from './G4MacroCommandInfoView';
import { rename } from 'fs';
import { Command } from './command_reader';

export function activate(context: vscode.ExtensionContext) {

	// Import the completions JSON
	const completionsPath = path.join(context.extensionPath, 'command_output.txt');

	const commands = new g4macrocommands(completionsPath);

	// Create a diagnostic collection for the type errors
	const typeDiagnostics = vscode.languages.createDiagnosticCollection("types");
	context.subscriptions.push(typeDiagnostics);

	commands.maintainDiagnostics(context, typeDiagnostics);

	const definitionProvider = vscode.languages.registerDefinitionProvider(
		'g4macro',
		new G4MacroDefinitionProvider(commands)
	);

	const renameProvider = vscode.languages.registerRenameProvider(
		'g4macro',
		new G4MacroRenameProvider(commands)
	);

	const hoverProvider = vscode.languages.registerHoverProvider(
		'g4macro',
		{
			provideHover(document: vscode.TextDocument, position: vscode.Position) {

				// Get the which is being hovered over
				const wordRange = document.getWordRangeAtPosition(position);

				if (wordRange == undefined)
					return undefined;

				const commandRange = new vscode.Range(
					new vscode.Position(wordRange.start.line, 0),
					new vscode.Position(wordRange.end.line, wordRange.end.character + 1)
				);

				const hoverPrefix = document.getText(commandRange);

				console.log(hoverPrefix);

				// Get the command being hovered
				const command = commands.getCurrentCommand(hoverPrefix);

				if (command == undefined)
					return undefined;

				// Add the markdown hover information
				const hoverInfo = new vscode.MarkdownString();

				hoverInfo.appendCodeblock(hoverPrefix);

				if (command.guidance != "")
					hoverInfo.appendMarkdown(command.guidance);

				if (command.parameters.length > 0) {

					hoverInfo.appendMarkdown("### Parameters\n");

					command.parameters.forEach((parameter) => {
						hoverInfo.appendMarkdown(`- *${parameter.name}*`);
						if (parameter.type != "")
							hoverInfo.appendMarkdown(` (${parameter.type})`);
						if (parameter.omittable)
							hoverInfo.appendMarkdown(" (Optional)");

						if (parameter.default != "")
							hoverInfo.appendMarkdown(` (Default: ${parameter.default})`);
						hoverInfo.appendMarkdown("\n");
					});
				}

				return new vscode.Hover(hoverInfo);
			}
		}
	);

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
					const spaceIdx = command.indexOf(' ');

					if (spaceIdx != -1)
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

	// Provide completions for the registers alias'
	const aliasProvider = vscode.languages.registerCompletionItemProvider(
		'g4macro',
		{
			provideCompletionItems() {

				return commands.getVariableCompletions();

			}
		},
		'{'
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

	context.subscriptions.push(
		definitionProvider,
		renameProvider,
		completionsProvider,
		aliasProvider,
		signatureInfoProvider,
		codeActionProvider,
		hoverProvider);

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

	// Maintain the views
	const commandTreeViewProvider = new G4MacroCommandTreeDataProvider(commands);
	const tree = vscode.window.createTreeView('geant4-macro-explorer', {treeDataProvider: commandTreeViewProvider, showCollapseAll: true });
	// vscode.window.registerTreeDataProvider('geant4-macro-explorer', commandTreeViewProvider);

	const commandTreeViewInfoProvider = new G4MacroCommandInfoViewProvider();

	context.subscriptions.push(
	vscode.window.registerWebviewViewProvider(G4MacroCommandInfoViewProvider.viewType, commandTreeViewInfoProvider));

	// Listen for selection changes
	tree.onDidChangeSelection( e => {

		if (e == undefined)
			return;

		const command = e.selection[0].g4command;

		if (command == undefined)
			return;

		commandTreeViewInfoProvider.setCommand(command);
	});

	// Register insertion commands from the tree
	const insertCommand = vscode.commands.registerCommand(
		'geant4-macro-extension.insertCommand', (treeItem: G4MacroCommandTreeItem) => {

			// Get the current document
			const editor = vscode.window.activeTextEditor;
			
			if (!editor) {
				vscode.window.showErrorMessage("No active editor found!");
				return;
			}

			const document = editor.document;

			// Check if the document is of the correct type
			if (document.languageId !== "g4macro") {  // Change to your desired language
				vscode.window.showErrorMessage("Currently active file is not a Geant4 Macro file!");
				return;
			}

			// Get the last cursor position
			const lastCursorPos = editor.selection.active;
			const command = treeItem.g4command;

			if (command == undefined) {
				vscode.window.showErrorMessage("Tree item does not have associated command!");
				return;
			}

			// Add the snippet and get hints
			const snippet = command.getSnippetString(false);

			if (snippet == undefined)
				return;

			snippet.value = command.path + snippet.value;
			editor.insertSnippet(snippet, lastCursorPos);
			vscode.commands.executeCommand('editor.action.triggerParameterHints');

		}
			
	);

	context.subscriptions.push(insertCommand);

	// Create the search command which modifies the command tree UI
	const searchCommand = vscode.commands.registerCommand("geant4-macro-extension.searchTree", async () => {

		// Create a QuickPick
		const quickPick = vscode.window.createQuickPick();
		quickPick.placeholder = "Type to search tree items...";

		// Update search values dynamically
		quickPick.onDidChangeValue((value) => {
			if (!value) {
				commandTreeViewProvider.clearSearchCommands();
			} else {
				const searchResults = commands.commands.search(value);

				commandTreeViewProvider.setSearchCommands(searchResults);
				commandTreeViewProvider.refresh();
			}
		});

		// Clear values when done
		quickPick.onDidHide(() => {
			quickPick.dispose();
			
			commandTreeViewProvider.clearSearchCommands();
			commandTreeViewProvider.refresh();
		});

		quickPick.show();
	});

	context.subscriptions.push(searchCommand);

	
}
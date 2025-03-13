
import * as vscode from 'vscode';
import { g4macrocommands } from './g4macrocommands';
import { Command } from './command_reader';




export class G4MacroCommandTreeItem extends vscode.TreeItem {

    g4command: Command | undefined = undefined;
    
    constructor(
		command: Command
	) {
        const label = command.command;
        const collapsibleState = (command.children.size == 0) ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed; 
		super(label, collapsibleState);
        
        this.g4command = command;
	}

}

export class G4MacroCommandTreeDataProvider implements vscode.TreeDataProvider<G4MacroCommandTreeItem> {

    private macroCommands: g4macrocommands | undefined = undefined;
    private _onDidChangeTreeData = new vscode.EventEmitter<void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(theMacroCommands: g4macrocommands) {
        this.macroCommands = theMacroCommands;

        this.macroCommands.commands.onDidFinishReading(() => {
            this.refresh();
        });
    }
    
    getTreeItem(element: G4MacroCommandTreeItem): vscode.TreeItem {
		return element;
	}

    getChildren(element?: G4MacroCommandTreeItem): Thenable<G4MacroCommandTreeItem[]> {

        if (this.macroCommands == undefined)
            return Promise.resolve([]);

        const currentCommand: Command | undefined = (element == undefined) ? this.macroCommands.commands : element.g4command;
        const childItems: G4MacroCommandTreeItem[] = [];

        if (currentCommand == undefined)
            return Promise.resolve([]);

        console.log(currentCommand.children.size + ' children');

        for (const [, childCommand] of currentCommand.children) {

            childItems.push(
                new G4MacroCommandTreeItem(childCommand)
            );

        }

        return Promise.resolve(childItems);

	}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

}
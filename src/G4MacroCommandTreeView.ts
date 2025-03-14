
import * as vscode from 'vscode';
import { g4macrocommands } from './g4macrocommands';
import { Command } from './command_reader';




export class G4MacroCommandTreeItem extends vscode.TreeItem {

    g4command: Command | undefined = undefined;
    
    constructor(
		command: Command,
        label: string | undefined = undefined
	) {
        if (label === undefined)
            label = command.command;

        const collapsibleState = (command.children.size == 0) ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed; 
		super(label, collapsibleState);
        
        this.g4command = command;

        if (command.children.size == 0) {
            this.contextValue = 'commandTreeItemNotDir';
            this.iconPath = new vscode.ThemeIcon('symbol-method');
        }
        else {
            this.iconPath = new vscode.ThemeIcon('symbol-class');
        }
	}

    contextValue = 'commandTreeItem';

}

export class G4MacroCommandTreeDataProvider implements vscode.TreeDataProvider<G4MacroCommandTreeItem> {

    private macroCommands: g4macrocommands | undefined = undefined;
    private _onDidChangeTreeData = new vscode.EventEmitter<void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
    private searchCommands: Command[] = [];

    constructor(theMacroCommands: g4macrocommands) {
        this.macroCommands = theMacroCommands;

        this.macroCommands.commands.onDidFinishReading(() => {
            this.refresh();
        });
    }

    setSearchCommands(cmds: Command[]) {
        this.searchCommands = cmds;
    }

    clearSearchCommands() {
        this.searchCommands = [];
    }
    
    getTreeItem(element: G4MacroCommandTreeItem): vscode.TreeItem {
		return element;
	}

    getChildren(element?: G4MacroCommandTreeItem): Thenable<G4MacroCommandTreeItem[]> {

        const childItems: G4MacroCommandTreeItem[] = [];

        if (this.searchCommands.length != 0) {
            for (const childCommand of this.searchCommands) {

                childItems.push(
                    new G4MacroCommandTreeItem(childCommand, childCommand.path)
                );
            
            }

            return Promise.resolve(childItems);
        }

        if (this.macroCommands == undefined)
            return Promise.resolve([]);

        const currentCommand: Command | undefined = (element == undefined) ? this.macroCommands.commands : element.g4command;
        

        if (currentCommand == undefined)
            return Promise.resolve([]);

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
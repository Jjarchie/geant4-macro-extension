
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { CompletionItem } from 'vscode';

export class g4macrocommands {
    path: string="";
    commands: any={};

    constructor(path: string) {
        this.path = path;

        this.commands = JSON.parse(fs.readFileSync(this.path, 'utf-8'));
    }

    public getCompletionItems(line: string): Array<vscode.CompletionItem> {
        
        // Check it is a UI command line
        if (line[0] != '/')
            return [];

        // Split into the different directories
        const splitString = line.slice(1, line.length).split('/');

        // Access the correct branch of the dictionary
        let currentCompletions = this.commands;
        
        for (const entry of splitString.slice(0, -1))
        {

            if (!(entry in currentCompletions))
                return [];

            currentCompletions = currentCompletions[entry];
        }
        
        // Get list of the commands
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
}
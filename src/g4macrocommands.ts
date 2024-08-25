
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

    public getCurrentCommand(line : string): any {
        
        // Check it is a UI command line
        if (line[0] != '/')
            return [];

        // Get line up to whitespace
        line = line.slice(0, line.indexOf(' '));

        // Split into the different directories
        const splitString = line.slice(1, line.length).split('/');

        // Access the correct branch of the dictionary
        let currentCommand = this.commands;
        const currentCommandName = splitString[splitString.length - 1].replace(/\s/g, "");
        
        for (const entry of splitString.slice(0, -1))
        {

            if (!(entry in currentCommand))
                return [];

            currentCommand = currentCommand[entry];
        }

        return [currentCommandName, currentCommand];
    }

    public getCompletionItems(line: string): Array<vscode.CompletionItem> {
        
        // Get the current command
        const currentCommandInfo = this.getCurrentCommand(line);
        const currentCompletions = currentCommandInfo[1];

        // Get list of the commands available
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

    public getCurrentSignature(line: string): vscode.SignatureHelp | any | null {

        // Get the info about the command
        const currentCommandInfo = this.getCurrentCommand(line);
        const currentCommandName = currentCommandInfo[0];
        const currentCommandMeta = currentCommandInfo[1][currentCommandName];

        // Skip if there is not guidance
        if (!("guidance" in currentCommandMeta))
            return null;

        // Create a signature information object
        const signatureInfo = new vscode.SignatureInformation(
            currentCommandName,
            currentCommandMeta["guidance"]
        );

        // Initialise the parameters and the signature label
        const allParameters = line.split(/\s/g);
        const currentParameters = allParameters.slice(1);

        signatureInfo.label = allParameters[0] + " ";

        // Add the parameters to the signature info and to the label
        for (let i = 0; i < currentCommandMeta["params"].length; i++)
        {
            const param = currentCommandMeta["params"][i];

            signatureInfo.parameters.push(
                new vscode.ParameterInformation(
                    param["name"],
                    param["name"] + " (" + param["type"] + ")"
                )
            );

            signatureInfo.label += param["name"] + " ";
        }

        // Return the signature help
        const sigHelp = new vscode.SignatureHelp();
        sigHelp.signatures.push(signatureInfo);
        sigHelp.activeParameter = currentParameters.length - 1;

        return sigHelp;
    }
    
}
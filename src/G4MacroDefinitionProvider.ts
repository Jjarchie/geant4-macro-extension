
import * as vscode from 'vscode';
import { Variable, g4macrocommands } from './g4macrocommands';

export class G4MacroDefinitionProvider implements vscode.DefinitionProvider {

    commands: g4macrocommands | undefined = undefined;

    constructor(commands: g4macrocommands) {
        this.commands = commands;
    }

    provideDefinition(
        document: vscode.TextDocument, 
        position: vscode.Position, 
        token: vscode.CancellationToken)
        : vscode.ProviderResult<vscode.Definition | vscode.DefinitionLink[]> {
        const wordRange = document.getWordRangeAtPosition(position);
        const word = document.getText(wordRange);

        if (this.commands === undefined)
            return undefined;

        const variable = this.commands.getVariable(word);

        if (variable === undefined)
            return undefined;

        return variable.location;
    }

}
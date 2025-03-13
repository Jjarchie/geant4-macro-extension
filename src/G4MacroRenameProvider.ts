
import * as vscode from 'vscode';
import { Variable, g4macrocommands } from './g4macrocommands';
import { start } from 'repl';

function getVariableRange(document: vscode.TextDocument, lineText: string, position: vscode.Position) : undefined | vscode.Range {
    
    // Get the word range
    let wordRange = document.getWordRangeAtPosition(position);
    const baseRange = wordRange;

    if (wordRange == undefined)
        return undefined;

    // Get the range including the braces if they exist
    let startPos = wordRange.start;
    let endPos = wordRange.end;

    if (wordRange.start.character != 0 && lineText.at(wordRange.start.character - 1)  == '{') 
        startPos = startPos.translate(0, -1);

    if (wordRange.start.character != lineText.length && lineText.at(wordRange.end.character)  == '}') 
        endPos = endPos.translate(0, 1);

    wordRange = new vscode.Range(startPos, endPos);
        
    // Get the word
    const word = document.getText(wordRange);

    // Return the found range if it is a variable
    if (word.startsWith('{') && word.endsWith('}'))
        return baseRange;
    
    // Otherwise, check we are at the correct command
    if (!lineText.startsWith('/control/alias'))
        return undefined;
    
    // And check that we are the the correct parameter
    const numberSpaces = lineText.substring(0, wordRange.start.character).split(/\s+/).length;

    if (numberSpaces == 1)
        return baseRange;

    return undefined;
}

export class G4MacroRenameProvider implements vscode.RenameProvider {

    commands: g4macrocommands | undefined = undefined;
    
    constructor(commands: g4macrocommands) {
        this.commands = commands;
    }

    provideRenameEdits(
        document: vscode.TextDocument, 
        position: vscode.Position,
         newName: string, token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.WorkspaceEdit> {
        
        const wordRange = document.getWordRangeAtPosition(position);
        
        if (!wordRange) {
            return null;
        }
        
        let word = document.getText(wordRange);

        // Add braces to the start and end to replace
        if (word.at(0) != '{')
            word = "{" + word;

        if (word.at(-1) != '}')
            word = word + '}';

        // Get the base word also
        const baseWord = word.substring(1, word.length - 1);

        const baseNewName = newName;
        newName = "{" + baseNewName + "}";

        // Define the regex for the variable substitutions
        const bracedRegex = new RegExp(`${word}`, 'g');
        const aliasRegex = new RegExp(`^/control/alias\\s+${baseWord}`, 'g');

        // The proposed edit
        const edit = new vscode.WorkspaceEdit();

        for (let i = 0; i < document.lineCount; i++) {
            
            const line = document.lineAt(i);

            // Replace the variable using regex
            const newText = line.text.replace(bracedRegex, newName);
            
            if (newText !== line.text) {
                edit.replace(document.uri, line.range, newText);
            }

            // Replace the definition if defined here
            if (!line.text.startsWith('/control/alias'))
                continue;

            // Skip if not the correct parameter definition
            const parameters = this.commands?.getInputParameters(line.text);

            if (parameters == undefined || parameters[0].parameter != baseWord)
                continue;

            // Replace the variable with the new one
            const aliasNewText = line.text.replace(aliasRegex, `/control/alias ${baseNewName}`);
            
            if (aliasNewText !== line.text) {
                edit.replace(document.uri, line.range, aliasNewText);
            }

        }

        // Force the update of diagnostics after the rename if available
        if (this.commands?.diagnosticCollection != undefined)
        this.commands?.refreshDiagnostics(
            document,
            this.commands.diagnosticCollection
        );

        return edit;
        
    }


    prepareRename?(
        document: vscode.TextDocument, 
        position: vscode.Position, 
        token: vscode.CancellationToken) : vscode.ProviderResult<vscode.Range | {
        /**
         * The range of the identifier that can be renamed.
         */
        range: vscode.Range;
        /**
         * The placeholder of the editors rename input box.
         */
        placeholder: string;
    }> {

        const lineText = document.lineAt(position.line).text;

        const variableRange = getVariableRange(document, lineText, position);
        
        // If a valid range, return it
        if (variableRange != undefined)
            return variableRange;
        
        // Otherwise reject the proposed rename
        return Promise.reject(new Error("Cannot rename this element!"));
    }
}
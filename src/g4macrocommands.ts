
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { CompletionItem } from 'vscode';
import { start } from 'repl';

const units = [
	"millimeter", "millimeter2", "millimeter3", "centimeter", "centimeter2", "centimeter3", "meter", "meter2", "meter3", "kilometer", "kilometer2", "kilometer3", "parsec", "micrometer", "nanometer", "angstrom", "fermi", "barn", "millibarn", "microbarn", "nanobarn", "picobarn", "mm", "um", "nm", "mm2", "mm3", "cm", "cm2", "cm3", "liter", "L", "dL", "cL", "mL", "m", "m2", "m3", "km", "km2", "km3", "pc", "radian", "milliradian", "degree", "steradian", "rad", "mrad", "sr", "deg", "nanosecond", "second", "millisecond", "microsecond", "picosecond", "hertz", "kilohertz", "megahertz", "ns", "s", "ms", "eplus", "e_SI", "coulomb", "megaelectronvolt", "electronvolt", "kiloelectronvolt", "gigaelectronvolt", "teraelectronvolt", "petaelectronvolt", "joule", "MeV", "eV", "keV", "GeV", "TeV", "PeV", "kilogram", "gram", "milligram", "kg", "g", "mg", "watt", "newton", "hep_pascal", "bar", "atmosphere", "ampere", "milliampere", "microampere", "nanoampere", "megavolt", "kilovolt", "volt", "ohm", "farad", "millifarad", "microfarad", "nanofarad", "picofarad", "weber", "tesla", "gauss", "kilogauss", "henry", "kelvin", "mole", "becquerel", "curie", "gray", "candela", "lumen", "lux", "perCent", "perThousand", "perMillion"
];

function isWhitespace(test_char: string) : boolean {
    return (/\s/.test(test_char));
}

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

    public refreshDiagnostics(doc: vscode.TextDocument, diagnosticCollection: vscode.DiagnosticCollection){
        console.log('refreshing diagnostics');
        const diagnostics: vscode.Diagnostic[] = [];

        for (let lineIndex = 0; lineIndex < doc.lineCount; lineIndex++) {
            
                const lineOfText = doc.lineAt(lineIndex);
                
                if (lineOfText.text[0] != "/")
                    continue;

                if (lineOfText.text.length <= 1)
                    continue;
                
                const lineCommand = this.getCurrentCommand(lineOfText.text);
                
                if (lineCommand[0] == undefined || lineCommand[1] == undefined)
                {
                    diagnostics.push(
                        new vscode.Diagnostic(
                                lineOfText.range, "Command not found in registry!", vscode.DiagnosticSeverity.Warning
                            )
                    );
                    continue;
                }

                interface ParameterInfo {
                    parameter : string;
                    start_idx : number;
                    end_idx : number;
                }
                
                const currentParameters: ParameterInfo[] = [];
                let startIdx = -1;
                let endIdx = -1;

                for (let charNum = 0; charNum < lineOfText.text.length - 1; charNum++)
                {
                    // If this is whitespace and the next is not then it is the start of a character
                    if (isWhitespace(lineOfText.text[charNum]) && !isWhitespace(lineOfText.text[charNum + 1])) {
                        startIdx = charNum + 1;
                    }

                    // If this is not whitespace and the next is then it is the end
                    if (!isWhitespace(lineOfText.text[charNum]) && isWhitespace(lineOfText.text[charNum + 1])) {
                        endIdx = charNum;

                        if (startIdx < 0)
                            continue;

                        currentParameters.push({
                            parameter: lineOfText.text.slice(startIdx, endIdx + 1),
                            start_idx: startIdx,
                            end_idx: endIdx
                        });
                    }
                }
                
                if (endIdx < startIdx)
                {
                    endIdx = lineOfText.text.length - 1;

                    currentParameters.push({
                        parameter: lineOfText.text.slice(startIdx, endIdx + 1),
                        start_idx: startIdx,
                        end_idx: endIdx
                    });
                }

                if (currentParameters.length == 0)
                    continue;
                
                const currentCommandMeta = lineCommand[1][lineCommand[0]];

                if (!("params" in currentCommandMeta))
                    continue;

                const params = currentCommandMeta["params"];

                if (currentParameters.length > params.length)
                {
                    diagnostics.push(
                        new vscode.Diagnostic(
                                lineOfText.range, "Too many arguments!", vscode.DiagnosticSeverity.Error
                            )
                    );
                    continue;
                }

                for (let i = 0; i < currentParameters.length; i++)
                {
                    const currentParameter = currentParameters[i];
                    const guidanceParam = params[i];

                    if (guidanceParam["name"] == "Unit")
                    {
                        console.log("'" + currentParameter + "'");
                        if (!units.includes(currentParameter.parameter))
                        {
                            diagnostics.push(
                                new vscode.Diagnostic(
                                        new vscode.Range(
                                            lineOfText.lineNumber, startIdx, lineOfText.lineNumber, endIdx + 1
                                        ), "Invalid unit!", vscode.DiagnosticSeverity.Error
                                    )
                            );
                            continue;
                        }
                    }

                }

        }

        diagnosticCollection.set(doc.uri, diagnostics);

    }

    public maintainDiagnostics(context: vscode.ExtensionContext, diagnosticCollection: vscode.DiagnosticCollection){
        if (vscode.window.activeTextEditor) {
            this.refreshDiagnostics(vscode.window.activeTextEditor.document, diagnosticCollection);
        }

        context.subscriptions.push(
            vscode.window.onDidChangeActiveTextEditor(editor => {
                if (editor) {
                    this.refreshDiagnostics(editor.document, diagnosticCollection);
                }
            })
        );

        context.subscriptions.push(
            vscode.workspace.onDidChangeTextDocument(e => this.refreshDiagnostics(e.document, diagnosticCollection))
        );
    
    }
    
}
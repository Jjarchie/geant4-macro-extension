
import * as vscode from 'vscode';
import { Command } from './command_reader';

// Possible units that can be used
const units = [
    "millimeter", "millimeter2", "millimeter3", "centimeter", "centimeter2", "centimeter3", "meter", "meter2", "meter3", "kilometer", "kilometer2", "kilometer3", "parsec", "micrometer", "nanometer", "angstrom", "fermi", "barn", "millibarn", "microbarn", "nanobarn", "picobarn", "mm", "um", "nm", "mm2", "mm3", "cm", "cm2", "cm3", "liter", "L", "dL", "cL", "mL", "m", "m2", "m3", "km", "km2", "km3", "pc", "radian", "milliradian", "degree", "steradian", "rad", "mrad", "sr", "deg", "nanosecond", "second", "millisecond", "microsecond", "picosecond", "hertz", "kilohertz", "megahertz", "ns", "s", "ms", "eplus", "e_SI", "coulomb", "megaelectronvolt", "electronvolt", "kiloelectronvolt", "gigaelectronvolt", "teraelectronvolt", "petaelectronvolt", "joule", "MeV", "eV", "keV", "GeV", "TeV", "PeV", "kilogram", "gram", "milligram", "kg", "g", "mg", "watt", "newton", "hep_pascal", "bar", "atmosphere", "ampere", "milliampere", "microampere", "nanoampere", "megavolt", "kilovolt", "volt", "ohm", "farad", "millifarad", "microfarad", "nanofarad", "picofarad", "weber", "tesla", "gauss", "kilogauss", "henry", "kelvin", "mole", "becquerel", "curie", "gray", "candela", "lumen", "lux", "perCent", "perThousand", "perMillion"
];

function isWhitespace(test_char: string): boolean {
    return (/\s/.test(test_char));
}

function isDouble(test_string: string): boolean {
    return /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(test_string);
}

function isBoolean(test_string: string): boolean {
    return /^(true|false|TRUE|FALSE|1|0)$/.test(test_string);
}

function isInteger(test_string: string): boolean {
    return /^[+-]?\d+$/.test(test_string);
}

/**
 * Creates a diagnostic object for the given line, input parameter, and error information.
 *
 * @param line - The text line where the error occurred.
 * @param parameter - The input parameter information.
 * @param error_info - The error information.
 * @returns A diagnostic object representing the error.
 */
function getDiagnostic(line: vscode.TextLine, parameter: InputParameterInfo, error_info: string): vscode.Diagnostic {
    return new vscode.Diagnostic(
        new vscode.Range(
            line.lineNumber, parameter.start_idx, line.lineNumber, parameter.end_idx + 1
        ), error_info, vscode.DiagnosticSeverity.Error
    );
}


interface InputParameterInfo {
    parameter: string;
    start_idx: number;
    end_idx: number;
}

interface Variable {
    name: string;
    value: any;
}

export class g4macrocommands {
    path: string = "";
    commands: Command = new Command();
    variables: Array<Variable> = [];

    constructor(path: string) {
        this.path = path;

        this.refreshCommands();
    }

    /**
     * Retrieves the input parameters from a given line.
     *
     * @param line - The line of text to extract the parameters from.
     * @returns An array of InputParameterInfo objects for each input parameter.
     */
    public getInputParameters(line: string): Array<InputParameterInfo> {

        // Initialise the array
        const parameters: InputParameterInfo[] = [];

        // Initialise the running variables
        let startIdx = -1;
        let endIdx = -1;

        // Check for start and end of parameters
        for (let charNum = 0; charNum < line.length - 1; charNum++) {
            // If this is whitespace and the next is not then it is the start of a character
            if (isWhitespace(line[charNum]) && !isWhitespace(line[charNum + 1])) {
                startIdx = charNum + 1;
            }

            // If this is not whitespace and the next is then it is the end
            if (!isWhitespace(line[charNum]) && isWhitespace(line[charNum + 1])) {
                endIdx = charNum;

                if (startIdx < 0)
                    continue;

                parameters.push({
                    parameter: line.slice(startIdx, endIdx + 1),
                    start_idx: startIdx,
                    end_idx: endIdx
                });
            }
        }

        // Add the last parameter if it was not detected
        if (endIdx < startIdx) {
            endIdx = line.length - 1;

            parameters.push({
                parameter: line.slice(startIdx, endIdx + 1),
                start_idx: startIdx,
                end_idx: endIdx
            });
        }

        return parameters;
    }

    /**
     * Retrieves the Geant4 UI command from the line in the document.
     *
     * @param line - The input line to extract the command from.
     * @returns An array containing the current command name and the corresponding command object.
     */
    public getCurrentCommand(line: string): Command {

        // Check it is a UI command line
        if (line[0] != '/')
            return new Command();

        if (line.length == 1)
            return this.commands;

        // Get line up to whitespace (if it exists)
        const functionSeparator = line.indexOf(' ');

        if (functionSeparator > 0)
            line = line.slice(0, functionSeparator);

        // Split into the different directories
        const splitString = line.slice(1, line.length + 1).split('/');

        // Return if there are no directories
        if (splitString.length == 0)
            return new Command();

        // Remove the last element if it is empty
        if (splitString[splitString.length - 1] == "")
            splitString.pop();

        // Access the correct branch of the dictionary
        let currentCommand = this.commands;

        // Get the last full command
        const currentCommandName = splitString[splitString.length - 1].replace(/\s/g, "");

        for (const entry of splitString) {

            const nextCommand = currentCommand.children.get(entry);

            if (!nextCommand)
                return new Command();

            currentCommand = nextCommand;
        }

        return currentCommand;
    }

    /**
     * Retrieves the completion items for a given UI directory.
     *
     * @param line The current line of code containing the UI directory.
     * @returns An array of vscode.CompletionItem objects for each possible completion.
     */
    public getCompletionItems(line: string): Array<vscode.CompletionItem> {

        // Get the current command
        const currentCompletions = this.getCurrentCommand(line);

        // Get list of the commands available
        const completionItems = [];

        for (const completion of currentCompletions.children.values()) {

            const completionKind = (completion.isDirectory())
                ? vscode.CompletionItemKind.Class
                : vscode.CompletionItemKind.Function;

            if (completion.command == undefined)
                continue;

            const thisItem: vscode.CompletionItem = {
                label: completion.command,
                kind: completionKind,
                commitCharacters: (completion.isDirectory()) ? ["/"] : undefined,
                documentation: completion.guidance,
                detail: completion.command,
                insertText: completion.getSnippetString(),
                command: {
                    command: "editor.action.triggerParameterHints",
                    title: "triggerParameterHints"
                }
            };

            completionItems.push(thisItem);

        }

        return completionItems;
    }

    public getVariableCompletions(): Array<vscode.CompletionItem> {

        // Get list of the commands available
        const completionItems = [];

        for (const variable of this.variables) {
            const thisItem: vscode.CompletionItem = {
                label: variable.name,
                kind: vscode.CompletionItemKind.Variable,
                commitCharacters: ["}"]
            };

            completionItems.push(thisItem);

        }

        return completionItems;

    }

    /**
     * Retrieves the signature help for the current command based on the provided macro line.
     *
     * @param line The line of code containing the command.
     * @returns The signature help for the current command, or null if there is no guidance available.
     */
    public getCurrentSignature(line: string): vscode.SignatureHelp | any | null {

        // Get the info about the command
        const currentCommand = this.getCurrentCommand(line);

        // Skip if there is not guidance
        if (currentCommand.command == "")
            return null;

        // Create a signature information object
        const signatureInfo = new vscode.SignatureInformation(
            currentCommand.command,
            currentCommand.guidance
        );

        // Initialise the parameters and the signature label
        const allParameters = line.split(/\s/g);
        const currentParameters = allParameters.slice(1);

        signatureInfo.label = allParameters[0] + " ";

        // Add the parameters to the signature info and to the label
        for (const param of currentCommand.parameters) {

            signatureInfo.parameters.push(
                new vscode.ParameterInformation(
                    param.name,
                    param.name + " (" + param.type + ")"
                )
            );

            signatureInfo.label += param.name + " ";
        }

        // Return the signature help
        const sigHelp = new vscode.SignatureHelp();
        sigHelp.signatures.push(signatureInfo);
        sigHelp.activeParameter = currentParameters.length - 1;

        return sigHelp;
    }

    /**
     * Refreshes the diagnostics for the parameters provided in the macro document.
     *
     * @param doc - The TextDocument to refresh diagnostics for.
     * @param diagnosticCollection - The DiagnosticCollection to update with the refreshed diagnostics.
     */
    public refreshDiagnostics(doc: vscode.TextDocument, diagnosticCollection: vscode.DiagnosticCollection) {

        const newVariables: Array<Variable> = [];

        if (doc.languageId != "g4macro")
            return;

        // Skip if the commands have not been imported
        if (this.commands.children.size == 0)
            return;

        const diagnostics: vscode.Diagnostic[] = [];

        for (let lineIndex = 0; lineIndex < doc.lineCount; lineIndex++) {

            const lineOfText = doc.lineAt(lineIndex);

            // Skip if this line does not contain commands
            if (lineOfText.text[0] != "/")
                continue;

            if (lineOfText.text.length <= 1)
                continue;

            // Get the command
            const lineCommand = this.getCurrentCommand(lineOfText.text);

            // Skip if there is not information about this command
            if (lineCommand == undefined || lineCommand.command == "") {
                diagnostics.push({
                    range: lineOfText.range,
                    message: "Command not found in registry!",
                    severity: vscode.DiagnosticSeverity.Warning,
                    code: "unknown_command"
                }
                );

                continue;
            }

            // Get the current parameters
            const currentParameters = this.getInputParameters(lineOfText.text);

            if (currentParameters.length == 0)
                continue;

            const currentCommandParameters = lineCommand.parameters;

            if (currentCommandParameters.length == 0)
                continue;

            if (lineCommand.path == "/control/alias") {
                const thisVariable: Variable = {
                    name: currentParameters[0].parameter,
                    value: (currentParameters.length > 1) ? currentParameters[1].parameter : null
                };

                newVariables.push(thisVariable);
            }

            // Check there are not too many arguments provided
            if (currentParameters.length > currentCommandParameters.length) {
                diagnostics.push(
                    new vscode.Diagnostic(
                        lineOfText.range, "Too many arguments!", vscode.DiagnosticSeverity.Error
                    )
                );

                continue;
            }

            // Check the types of the values provided
            for (let i = 0; i < currentParameters.length; i++) {
                const currentParameter = currentParameters[i];
                const guidanceParam = currentCommandParameters[i];

                if (guidanceParam.name.toLowerCase() == "unit") {
                    if (!units.includes(currentParameter.parameter)) {
                        diagnostics.push(getDiagnostic(lineOfText, currentParameter, "Invalid unit!"));

                        continue;
                    }
                }

                const paramType = guidanceParam.type;

                if (paramType == "d" && !isDouble(currentParameter.parameter))
                    diagnostics.push(getDiagnostic(lineOfText, currentParameter, "Parameter is not of type double!"));

                else if (paramType == "b" && !isBoolean(currentParameter.parameter))
                    diagnostics.push(getDiagnostic(lineOfText, currentParameter, "Parameter is not of type boolean!"));

                else if (paramType == "i" && !isInteger(currentParameter.parameter))
                    diagnostics.push(getDiagnostic(lineOfText, currentParameter, "Parameter is not of type integer!"));

            }

        }

        diagnosticCollection.set(doc.uri, diagnostics);

        this.variables = newVariables;
    }


    /**
     * Maintains the diagnostics for the active text editor and updates them when necessary.
     *
     * @param context - The extension context.
     * @param diagnosticCollection - The diagnostic collection to maintain.
     */
    public maintainDiagnostics(context: vscode.ExtensionContext, diagnosticCollection: vscode.DiagnosticCollection) {

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

    public getAdditionalCommands(): Array<string> {

        const configuration: Array<string> | undefined = vscode.workspace.getConfiguration("geant4-macro-extension").get("additionalCommands");

        if (configuration == undefined)
            return [];

        return configuration;

    }

    public getCommandFiles(): Array<string> {

        const configuration: Array<string> | undefined = vscode.workspace.getConfiguration("geant4-macro-extension").get("commandFiles");

        if (configuration == undefined)
            return [];

        return configuration;

    }

    public removeCommands(commandFile: string) {

        // Remove the path from the current configuration
        const configuration: Array<string> = this.getCommandFiles();

        const index = configuration.indexOf(commandFile);

        if (index == -1)
            return;

        configuration.splice(index, 1);

        vscode.workspace.getConfiguration("geant4-macro-extension").update("commandFiles", configuration, vscode.ConfigurationTarget.Workspace);

        // Reload the commands
        this.refreshCommands();
    }

    public addCommands(uris: vscode.Uri[]) {

        const configuration: Array<string> = this.getCommandFiles();

        for (const uri of uris) {

            // Add to configuration if it does not exists
            if (configuration.includes(uri.fsPath))
                continue;

            configuration.push(uri.fsPath);
        }

        vscode.workspace.getConfiguration("geant4-macro-extension").update("commandFiles", configuration, vscode.ConfigurationTarget.Workspace);

        // Reload the commands
        this.refreshCommands();
    }

    public refreshCommands() {

        // Clear the current commands
        this.commands = new Command();

        // Get the command files (including the default)
        const configuration: Array<string> = this.getCommandFiles();
        configuration.unshift(this.path);

        for (const path of configuration)
            this.commands.processCommands(path);

        // Get the additional commands
        const additionalCommands = this.getAdditionalCommands();

        for (const additionalCommand of additionalCommands)
            this.commands.addCommand(additionalCommand);

    }

    public addCommand(command: string) {

        // Add the command to the registry
        this.commands.addCommand(command);

        // Add it to the vscode configuration
        const configuration: Array<string> = this.getAdditionalCommands();

        if (!configuration.includes(command))
            configuration.push(command);

        vscode.workspace.getConfiguration("geant4-macro-extension").update("additionalCommands", configuration, vscode.ConfigurationTarget.Workspace);
    }

}
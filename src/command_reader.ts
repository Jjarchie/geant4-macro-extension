
import * as fs from 'fs';
import * as rd from 'readline';
import * as vscode from 'vscode';

interface Parameter {
    name: string;
    type: string;
    omittable: boolean;
    default: string;
}

interface ICommand {
    command: string;
    guidance: string;
    parameters: Parameter[];
    children: Map<string, Command>;

    isDirectory(): boolean;

    getSnippetString(): vscode.SnippetString | undefined;
}

export class Command implements ICommand {
    command: string = "";
    guidance: string = "";
    parameters: Parameter[] = [];
    children: Map<string, Command> = new Map<string, Command>();

    constructor() {
        Object.defineProperties(this, {
            command: { enumerable: true },
            guidance: { enumerable: true },
            parameters: { enumerable: true },
            children: { enumerable: true }
        });
    }

    getSnippetString(): vscode.SnippetString | undefined {

        if (this.parameters.length == 0)
            return undefined;

        const snippet = new vscode.SnippetString(this.command);

        snippet.appendText(" ");

        for (const parameter of this.parameters) {

            if (parameter.omittable)
                break;

            snippet.appendPlaceholder(parameter.name);
            snippet.appendText(" ");
        }

        return snippet;
    }

    isDirectory(): boolean {
        return !(this.children.size == 0);
    }

    toJSON() {
        return {
            command: this.command,
            guidance: this.guidance,
            parameters: this.parameters,
            children: Object.fromEntries(this.children)
        };
    }
}

export class Commands extends Map<string, Command> {

}

export function processCommands(path: string): Command {

    console.log("Processing commands from " + path);

    const reader = rd.createInterface(fs.createReadStream(path));

    // Initialise the specifiers
    const directoryPathSpecififier = "Command directory path : ";
    const guidanceSpecififier = "Guidance :";
    const subdirectoriesSpecifier = " Sub-directories :";
    const parametersSpecifier = "Parameter :";
    const commandSpecifier = "Command /";

    // Define the running variables
    const commands: Command = new Command();

    let currentCommand: Command | null = null;
    let commandPath: string[] = [];

    // Define the running flags
    let readingGuidance: boolean = false;
    let readingParameter: boolean = false;

    // Add a command to the command map
    const addCommand = (cmd: Command): void => {

        let thisCommand = commands.children;

        for (let i = 0; i < commandPath.length - 1; i++) {
            const nextCommand = thisCommand.get(commandPath[i]);

            if (!nextCommand)
                break;

            thisCommand = nextCommand.children;
        }

        thisCommand.set(commandPath[commandPath.length - 1], cmd);
    };

    console.log("Reading commands...");

    // Read all lines in the command file
    reader.on("line", (line: string) => {

        const isDirectory: boolean = line.startsWith(directoryPathSpecififier);
        const isCommand: boolean = line.startsWith(commandSpecifier);

        // Read the command/directory
        if (isDirectory || isCommand) {

            readingGuidance = false;
            readingParameter = false;

            // Get the command path
            if (isDirectory)
                commandPath = line.slice(directoryPathSpecififier.length).split("/").slice(1, -1);
            else
                commandPath = line.slice(commandSpecifier.length - 1).split("/").slice(1);

            // Initialise the current command
            currentCommand = new Command();
            currentCommand.command = commandPath[commandPath.length - 1];

            addCommand(currentCommand);
        }

        // Read the parameter name
        else if (line.startsWith(parametersSpecifier)) {
            readingParameter = true;
            readingGuidance = false;

            const parameterName = line.slice(parametersSpecifier.length + 1);

            if (currentCommand != null)
                currentCommand.parameters.push({ name: parameterName, type: "", omittable: false, default: "" });
        }

        // Abort guidance read if it is a subdirectory
        else if (line.startsWith(subdirectoriesSpecifier)) {
            readingGuidance = false;
            readingParameter = false;
        }

        // Start guidance read
        else if (line.startsWith(guidanceSpecififier)) {
            readingGuidance = true;
            readingParameter = false;
        }

        // Read parameter metadata
        else if (readingParameter && currentCommand != null) {

            if (line.startsWith(" Parameter type"))
                currentCommand.parameters[currentCommand.parameters.length - 1].type = line.split(" : ")[1];

            if (line.startsWith(" Omittable"))
                currentCommand.parameters[currentCommand.parameters.length - 1].omittable = line.split(" : ")[1] == "True";

            if (line.startsWith(" Default value"))
                currentCommand.parameters[currentCommand.parameters.length - 1].default = line.split(" : ")[1];
        }

        // Add to the guidance
        else if (readingGuidance && currentCommand != null) {

            if (currentCommand.guidance != "")
                currentCommand.guidance += "\n";

            currentCommand.guidance += line;
        }

    });

    return commands;

}
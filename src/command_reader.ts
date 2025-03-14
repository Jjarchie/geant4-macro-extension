
import * as fs from 'fs';
import * as rd from 'readline';
import * as vscode from 'vscode';

interface Parameter {
    name: string;
    type: string;
    omittable: boolean;
    default: string;
    candidates?: string[];
}

interface ICommand {
    command: string;
    path: string;
    guidance: string;
    parameters: Parameter[];
    children: Map<string, Command>;

    isDirectory(): boolean;

    getSnippetString(): vscode.SnippetString | undefined;
    processCommands(path: string): void;
    addCommand(commandPath: string, command: Command | null): void;
}

export class Command implements ICommand {
    command: string = "";
    guidance: string = "";
    path: string = "";
    parameters: Parameter[] = [];
    children: Map<string, Command> = new Map<string, Command>();

    private _onDidFinishReading = new vscode.EventEmitter<void>();
    public readonly onDidFinishReading = this._onDidFinishReading.event;

    constructor() {
        Object.defineProperties(this, {
            command: { enumerable: true },
            guidance: { enumerable: true },
            parameters: { enumerable: true },
            children: { enumerable: true }
        });
    }

    compare(a: Command, b: Command) : number  {
        return a.command.localeCompare(b.command);
    }

    public sortChildren() {

        this.children = new Map([...this.children.entries()].sort());

        for (const [, child] of this.children) {
            child.sortChildren();
        }
    }

    getSnippetString(addCommandToSnippet: boolean=true): vscode.SnippetString | undefined {

        if (this.parameters.length == 0)
            return undefined;

        const baseString = (addCommandToSnippet) ? this.command : "";
        const snippet = new vscode.SnippetString(baseString);

        snippet.appendText(" ");

        for (const parameter of this.parameters) {

            if (parameter.candidates)
                if (parameter.omittable)
                    snippet.appendChoice([" ", ...parameter.candidates]);
                else
                    snippet.appendChoice(parameter.candidates);

            else if (parameter.omittable)
                snippet.appendPlaceholder("");
            else
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

    addCommand(commandPath: string, command: Command | null = null): void {

        let thisCommand = this.children;

        const path = commandPath.split("/");

        if (path[path.length - 1] == '')
            path.pop();

        for (let i = 1; i < path.length; i++) {

            if (i == path.length - 1 && command) {
                thisCommand.set(path[i], command);
                break;
            }

            let nextCommand = thisCommand.get(path[i]);

            if (!nextCommand) {
                console.log("Creating new command " + path[i]);

                thisCommand.set(path[i], new Command());
                nextCommand = thisCommand.get(path[i]);

                if (!nextCommand)
                    break;

                nextCommand.command = path[i];
                nextCommand.path = path.slice(0, i + 1).join("/");
            }

            thisCommand = nextCommand.children;
        }

    }

    processCommands(path: string): void {

        console.log("Processing commands from " + path);

        const reader = rd.createInterface(fs.createReadStream(path));

        // Initialise the specifiers
        const directoryPathSpecififier = "Command directory path : ";
        const guidanceSpecififier = "Guidance :";
        const subdirectoriesSpecifier = " Sub-directories :";
        const parametersSpecifier = "Parameter :";
        const commandSpecifier = "Command /";

        let currentCommand: Command | null = null;
        let baseCommand: Command | null = null;
        let commandPathSplit: string[] = [];
        let commandPath: string = "";

        // Define the running flags
        let readingGuidance: boolean = false;
        let readingParameter: boolean = false;

        // Read all lines in the command file
        reader.on("line", (line: string) => {

            const isDirectory: boolean = line.startsWith(directoryPathSpecififier);
            const isCommand: boolean = line.startsWith(commandSpecifier);

            // Read the command/directory
            if (isDirectory || isCommand) {

                readingGuidance = false;
                readingParameter = false;

                // Get the command path

                if (isDirectory) {
                    commandPath = line.slice(directoryPathSpecififier.length);
                    commandPathSplit = commandPath.split("/").slice(1, -1);
                }
                else {
                    commandPath = line.slice(commandSpecifier.length - 1);
                    commandPathSplit = commandPath.split("/").slice(1);
                }

                // Initialise the current command
                currentCommand = new Command();
                currentCommand.command = commandPathSplit[commandPathSplit.length - 1];
                currentCommand.path = commandPath;

                if (baseCommand == null)
                    baseCommand = currentCommand;

                this.addCommand(commandPath, currentCommand);
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

                if (line.startsWith(" Candidates"))
                    currentCommand.parameters[currentCommand.parameters.length - 1].candidates = line.split(" : ")[1].split(" ");
            }

            // Add to the guidance
            else if (readingGuidance && currentCommand != null) {

                if (currentCommand.guidance != "")
                    currentCommand.guidance += "\n";

                currentCommand.guidance += line;
            }

        });

        // Update things that are required on close as the read is asynchronous
        reader.on("close", () => {
            // Notify listeners that we finished reading
            this._onDidFinishReading.fire(); 
        });


    }
}

export class Commands extends Map<string, Command> {

}

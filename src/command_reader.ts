
import * as fs from 'fs';
import * as rd from 'readline';
import { CommentThreadCollapsibleState } from 'vscode';

interface Parameter {
    name: string;
    type: string;
    omittable: boolean;
    default: string;
}

interface Command {
    command: string;
    guidance: string;
    parameters: Parameter[];
    children: Commands;
}

interface Commands {
    [key: string]: Command;
}


export function processCommands(path: string) {

    console.log("Processing commands from " + path);

    const reader = rd.createInterface(fs.createReadStream(path));

    const directoryPathSpecififier = "Command directory path : ";
    const guidanceSpecififier = "Guidance :";
    const subdirectoriesSpecifier = " Sub-directories :";
    const parametersSpecifier = "Parameter :";
    const commandSpecifier = "Command /";

    const commands: Commands = {};
    let currentCommand: Command | null = null;
    let commandPath: string[] = [];

    let readingGuidance: boolean = false;
    let readingParameter: boolean = false;

    console.log("Reading commands...");

    reader.on("line", (line: string) => {

        const isDirectory: boolean = line.startsWith(directoryPathSpecififier);
        const isCommand: boolean = line.startsWith(commandSpecifier);

        if (isDirectory || isCommand) {

            readingGuidance = false;
            readingParameter = false;

            let thisCommand = commands;

            // Add the current command if it has been initialised
            if (currentCommand != null && currentCommand.command != '') {

                for (let i = 0; i < commandPath.length - 1; i++)
                    thisCommand = thisCommand[commandPath[i]].children;

                thisCommand[commandPath[commandPath.length - 1]] = currentCommand;
            }

            // Get the command path
            if (isDirectory)
                commandPath = line.slice(directoryPathSpecififier.length).split("/").slice(1, -1);
            else
                commandPath = line.slice(commandSpecifier.length - 1).split("/").slice(1);

            // Initialise the current command
            currentCommand = { command: commandPath[commandPath.length - 1], guidance: "", parameters: [], children: {} };
        }

        else if (line.startsWith(subdirectoriesSpecifier)) {
            readingGuidance = false;
        }

        else if (line.startsWith(parametersSpecifier)) {
            readingParameter = true;
            readingGuidance = false;

            const parameterName = line.slice(parametersSpecifier.length + 1);

            if (currentCommand != null)
                currentCommand.parameters.push({ name: parameterName, type: "", omittable: false, default: "" });
        }

        else if (line.startsWith(guidanceSpecififier))
            readingGuidance = true;


        else if (readingParameter && currentCommand != null) {

            if (line.startsWith(" Parameters type"))
                currentCommand.parameters[currentCommand.parameters.length - 1].type = line.split(" : ")[1];

            if (line.startsWith(" Omittable"))
                currentCommand.parameters[currentCommand.parameters.length - 1].omittable = line.split(" : ")[1] == "True";

            if (line.startsWith(" Default value"))
                currentCommand.parameters[currentCommand.parameters.length - 1].default = line.split(" : ")[1];
        }

        else if (readingGuidance && currentCommand != null) {

            if (currentCommand.guidance != "")
                currentCommand.guidance += "\n";

            currentCommand.guidance += line;

        }

    });

    console.log(commands);

}
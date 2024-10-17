
import * as fs from 'fs';
import * as rd from 'readline';

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

    // Initialise the specifiers
    const directoryPathSpecififier = "Command directory path : ";
    const guidanceSpecififier = "Guidance :";
    const subdirectoriesSpecifier = " Sub-directories :";
    const parametersSpecifier = "Parameter :";
    const commandSpecifier = "Command /";

    // Define the running variables
    const commands: Commands = {};
    let currentCommand: Command | null = null;
    let commandPath: string[] = [];

    // Define the running flags
    let readingGuidance: boolean = false;
    let readingParameter: boolean = false;

    // Add a command to the command map
    const addCommand = (cmd: Command): void => {

        let thisCommand = commands;

        for (let i = 0; i < commandPath.length - 1; i++)
            thisCommand = thisCommand[commandPath[i]].children;

        thisCommand[commandPath[commandPath.length - 1]] = cmd;
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
            currentCommand = { command: commandPath[commandPath.length - 1], guidance: "", parameters: [], children: {} };

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
        else if (readingGuidance && line.startsWith(subdirectoriesSpecifier))
            readingGuidance = false;

        // Start guidance read
        else if (readingGuidance && line.startsWith(guidanceSpecififier))
            readingGuidance = true;

        // Read parameter metadata
        else if (readingParameter && currentCommand != null) {

            if (line.startsWith(" Parameters type"))
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


    console.log(commands);
    console.log("Command read complete!");

}
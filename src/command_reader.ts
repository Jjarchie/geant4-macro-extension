
import * as fs from 'fs';
import * as rd from 'readline';

interface Parameter {
    name: string;
    type: string;
    omittable: boolean;
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

    const reader = rd.createInterface(fs.createReadStream("example_custom.txt"));

    const directoryPathSpecififier = "Command directory path : ";
    const guidanceSpecififier = "Guidance : ";
    const subdirectoriesSpecifier = " Sub-directories :";
    const parametersSpecifier = "Parameters :";

    const commands: Commands = {};
    let currentCommand: Command | null = null;
    let commandPath: string[] = [];

    let readingGuidance: boolean = false;
    let readingParameter: boolean = false;

    reader.on("line", (line: string) => {

        if (line.startsWith(guidanceSpecififier)) {
            readingGuidance = true;
        }

        if (line.startsWith(directoryPathSpecififier)) {

            readingGuidance = false;
            readingParameter = false;

            commandPath = line.slice(directoryPathSpecififier.length).split("/");

            currentCommand = { command: commandPath[commandPath.length - 1], guidance: "", parameters: [], children: {} };
        }

        if (line.startsWith(subdirectoriesSpecifier)) {
            readingGuidance = false;
        }

        if (line.startsWith(parametersSpecifier)) {
            readingParameter = true;
            const parameterName = line.slice(parametersSpecifier.length);

            if (currentCommand != null)
                currentCommand.parameters.push({ name: parameterName, type: "", omittable: false });
        }


        if (readingGuidance && currentCommand != null) {

            if (currentCommand.guidance != "")
                currentCommand.guidance += "\n";

            currentCommand.guidance = line;
        }

        if (readingParameter && currentCommand != null) {
            if (line.startsWith(" Parameters type"))
                currentCommand.parameters[currentCommand.parameters.length - 1].type = line.split(" : ")[1];

            if (line.startsWith(" Omittable"))
                currentCommand.parameters[currentCommand.parameters.length - 1].omittable = line.split(" : ")[1] == "True";
        }

    });

}
# Geant4 Macro Extension

## Features

This is a basic VSCode extension for Geant4 UI command files (with extension `.mac`) which provides:

- Syntax highlighting to distinguish between UI directories, functions, parameters, units and variables.
- Autocompletion based on a set of base UI commands.
- Adding custom UI commands from a Geant4 simulation output or explicitly in VSCode.
- Type checking of command parameters.
- Hover information for commands and directories.

## Installation

The extension is available on the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=jjarchie.geant4-macro-extension).

## Usage

The extension will be activated when opening a file with the `.mac` extension.

### Syntax Highlighting

This extension provides syntax highlighting for Geant4 UI commands. Warnings are displayed for errors in commands and parameter types:

![Syntax Highlighting](https://private-user-images.githubusercontent.com/99645400/378072704-77e3b3f3-b179-4f9b-80da-d6efb806ccd1.gif?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3MjkzNzgxNjQsIm5iZiI6MTcyOTM3Nzg2NCwicGF0aCI6Ii85OTY0NTQwMC8zNzgwNzI3MDQtNzdlM2IzZjMtYjE3OS00ZjliLTgwZGEtZDZlZmI4MDZjY2QxLmdpZj9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNDEwMTklMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjQxMDE5VDIyNDQyNFomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPWIwY2RhMDQwNjY2ZTg0Mzg3ZWRlMzUyNDM2YjBjYzZmZTRmNmYzMzM0NzE2Mzc0MTY4MTMxMmYwNTk3M2JkNzUmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0In0.I2fJptL29o2Lc9pOJdz15ZjIvTatbUoZfbFW2vcgXl4)

### Autocompletion

Start typing to get a list of suggested UI commands and receive prompts for the parameters of the command:

![Autocompletion](https://private-user-images.githubusercontent.com/99645400/378072698-21d36c7b-53ea-4d46-9b3e-cb335f2c2028.gif?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3MjkzNzgxNjQsIm5iZiI6MTcyOTM3Nzg2NCwicGF0aCI6Ii85OTY0NTQwMC8zNzgwNzI2OTgtMjFkMzZjN2ItNTNlYS00ZDQ2LTliM2UtY2IzMzVmMmMyMDI4LmdpZj9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNDEwMTklMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjQxMDE5VDIyNDQyNFomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPWFmZTZmNmQwOWE0MTg1YjIzYzM4MDMwZjlhNjQ5YmEzNzc4YWMxODZjYzA5M2I3ZjBiNDdiMjgxZTUyOThlNDAmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0In0.7OcFL0QTDQl7Kb4S8tjC9s88In9cnXylFJS5PpUpcwY)

### Adding Custom Commands

Custom commands can be added several ways:
1. Storing the output of `/control/manual /` in a text file and running `Geant4 Macro: Add Command File...` from the command palette.
2. Running `Geant4 Macro: Add Command...` from the command palette and entering the command manually.
3. Using the code action generated on commands which do not exist. This can be done by hovering over the command and clicking the lightbulb icon, or by using the shortcut `Ctrl+.` as shown below.

![Adding Commands](https://private-user-images.githubusercontent.com/99645400/378072701-b3b2b74a-e295-411f-b6c0-41bd6a27efaa.gif?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3MjkzNzgxNjQsIm5iZiI6MTcyOTM3Nzg2NCwicGF0aCI6Ii85OTY0NTQwMC8zNzgwNzI3MDEtYjNiMmI3NGEtZTI5NS00MTFmLWI2YzAtNDFiZDZhMjdlZmFhLmdpZj9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNDEwMTklMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjQxMDE5VDIyNDQyNFomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPTdmZDBmYzA5ZWYzMWI5ZmU4NTYxZjdkODYwYTE0N2U0MjI3NDhjZTljYmUwMjBjZjE1ZTEyM2Q0NzkwYzA5ZjcmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0In0.-U7qEHscB0PeQ3qXe5a7pysV46fNUalBcUyo5V3UhH8)

Command files can also be removed using the command pallette or by directly modifying the `settings.json` file and refreshing the commands.

### Hover Information

Hover over a command to see information about the command and its parameters:

![Hover Information](https://private-user-images.githubusercontent.com/99645400/378072702-0b1bb390-466a-4cbe-97e8-412c9b15a11a.gif?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3MjkzNzgxNjQsIm5iZiI6MTcyOTM3Nzg2NCwicGF0aCI6Ii85OTY0NTQwMC8zNzgwNzI3MDItMGIxYmIzOTAtNDY2YS00Y2JlLTk3ZTgtNDEyYzliMTVhMTFhLmdpZj9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNDEwMTklMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjQxMDE5VDIyNDQyNFomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPWRlMDAwMmFmMzViNTAzMzEwNDRjZmIwODBhYTQ5M2ZjMjU3MWFjNWZhNmVjMTkyZWI5OWVhZWY2Mjk1MmE1MzImWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0In0.6XNQzpWFy9jT-FogEIlxc0Na6B63L0O3PDP1ssOc_TY)


## Feature Requests

If you have any feature requests or issues, please open an issue on the [GitHub repository](https://github.com/Jjarchie/geant4-macro-extension/issues).

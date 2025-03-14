# Geant4 Macro Extension

## Features

This is a basic VSCode extension for Geant4 UI command files (with extension `.mac`) which provides:

- Syntax highlighting to distinguish between UI directories, functions, parameters, units and variables.
- Autocompletion based on a set of base UI commands.
- Adding custom UI commands from a Geant4 simulation output or explicitly in VSCode.
- Type checking of command parameters.
- Hover information for commands and directories.
- A sidebar panel for finding commands, displaying information and adding them to your macro files.

## Installation

The extension is available on the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=jjarchie.geant4-macro-extension).

## Usage

The extension will be activated when opening a file with the `.mac` extension.

### Syntax Highlighting

This extension provides syntax highlighting for Geant4 UI commands. Warnings are displayed for errors in commands and parameter types:

![Syntax Highlighting](images/type-checking.gif)

### Autocompletion

Start typing to get a list of suggested UI commands and receive prompts for the parameters of the command.

![Autocompletion](images/auto-complete.gif)

### Sidebar Panel

A convenient sidebar panel can be used to find commands and add them to your macro file.

![Sidebar Panel](images/tree-ui-example.gif)

### Hover Information

Hover over a command to see information about the command and its parameters:

![Hover Information](images/hover.gif)

### Variable Definitions

Variables are commonly included in Geant4 macros through the use of the `/control/alias [PARAMETER_NAME] [PARAMETER_VALUE]` command. This extension provides autocomplete of variables which have been defined in the macro file. The type of the parameter where the variable is included is also considered.

The variables can also be renamed using the `F2` key or by right-clicking on the variable and selecting `Rename Symbol`. The definition of the variable can also be found by clicking on the variable and selecting `Go to Definition` or by clicking the variable name while holding `Ctrl`:

![Renaming](images/rename.gif)

_Note: this extension does not currently support autocomplete for variables which are not defined in the current document, such as those used in `/control/foreach` or `/control/loop`. This will be implemented in a future release._

### Adding Custom Commands

Custom commands can be added several ways:
1. Storing the output of `/control/manual /` in a text file and running `Geant4 Macro: Add Command File...` from the command palette.
2. Running `Geant4 Macro: Add Command...` from the command palette and entering the command manually.
3. Using the code action generated on commands which do not exist. This can be done by hovering over the command and clicking the lightbulb icon, or by using the shortcut `Ctrl+.` as shown below.

![Adding Commands](images/custom-commands.gif)

Command files can also be removed using the command pallette or by directly modifying the `settings.json` file and refreshing the commands.

## Feature Requests

If you have any feature requests or issues, please open an issue on the [GitHub repository](https://github.com/Jjarchie/geant4-macro-extension/issues).

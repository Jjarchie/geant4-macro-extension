# Geant4 Macro Extension

## Features

This is a basic VSCode extension for Geant4 UI command files (with extension `.mac`) which provides:

- Syntax highlighting to distinguish between UI directories, functions, parameters, units and variables.
- Autocompletion based on a set of base UI commands. Refreshing the UI command cache with custom commands will be added in the near future.
- Type checking to ensure parameters provided are of the correct type and format.

The base UI commands and some regex was adapted [from natl's Atom extension](https://github.com/natl/language-geant4-macro).
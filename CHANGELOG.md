# Change Log

All notable changes to this project will be documented in this file.

## [0.4.1] - 2025-03-16

### Fixed
- Made sidebar logo consistent with other logos (was missing one arm).

## [0.4.0] - 2025-03-15

### Added
- Implemented a view in the sidebar for showing available commands, information, basic search and quickly adding them into an open macro file.
- Created icons for Geant4 macro files (both dark and light mode) and sidebar.
- Sorting of commands in alphabetical order.

### Fixed
- An error due to an incorrect number of parameters will no longer show when using quotation marks in parameters and using comments inline.
- A minor bug was rectified where the completion dialogue shows the second parameter highlighted rather than the first one when a new macro command is entered.
- A warning now shows when no arguments are supplied to a command and the command requires non-omittable arguments.

## [0.2.0] - 2025-03-13

### Added

- Fixed type checking for variables as defined through /control/alias.
- Implemented definition provider so that a variable definition can be found from its usage throughout the macro.
- Added renaming support so that a variable can be consistently renamed throughout the macro.
- Added autocomplete for when the braces are used.

### Fixed
- Fixed issue [#5](https://github.com/Jjarchie/geant4-macro-extension/issues/5), where text in comments were interpreted as parameters leading to incorrect warnings.

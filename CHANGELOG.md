# Change Log

All notable changes to this project will be documented in this file.

## [0.2.0] - 2025-03-13
### Added
- Fixed type checking for variables as defined through /control/alias.
- Implemented definition provider so that a variable definition can be found from its usage throughout the macro.
- Added renaming support so that a variable can be consistently renamed throughout the macro.
- Added autocomplete for when the braces are used.

### Fixed
- Fixed issue [#5](https://github.com/Jjarchie/geant4-macro-extension/issues/5), where text in comments were interpreted as parameters leading to incorrect warnings.

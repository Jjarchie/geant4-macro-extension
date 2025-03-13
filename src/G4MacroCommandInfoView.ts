
import * as vscode from 'vscode';

import { Command } from './command_reader';

class G4MacroInfoViewItem extends vscode.TreeItem {


    updateContent(command: Command) {
        
        this.label = `***${command.command}***\n${command.guidance}`;

        if (command.parameters.length == 0)
            return;

        this.label += "\nParameters:\n";

        for (const parameter of command.parameters) {
            this.label += `_${parameter.name}_`;

            if (parameter.type != "")
                this.label += ` (${parameter.type})`;

            if (parameter.candidates?.length != 0) {
                this.label += ":";

                for (const candidate in parameter.candidates) {
                    
                    this.label += (this.label.at(-1) != ":") ? ", " : " "; 

                    this.label += candidate;
                }
            }

        }
    }

    constructor(
        command: Command | undefined
    ) {
        super("", vscode.TreeItemCollapsibleState.None);

        if (command != undefined)
            this.updateContent(command);
        
        this.contextValue = "static";
        this.command = undefined; 
    }

}

export class G4MacroCommandInfoViewProvider implements vscode.WebviewViewProvider {

    public static readonly viewType = 'geant4-macro-active-command';
    private _view?: vscode.WebviewView;
    command: Command | undefined = undefined;

    public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
        this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

		};

		webviewView.webview.html = this._getHtmlForWebview();

    }

    setCommand(command: Command | undefined) {
        this.command = command;

        if (!this._view) 
            return;

        this._view.webview.html = this._getHtmlForWebview();
    }
  

    private _getHtmlForWebview(): string {

        const g4doc_string = `<div style="position: absolute; bottom: 0;"><hr style="height:1px%;"><p> For more information, refer to the <a href="https://geant4.web.cern.ch/docs/">Geant4 Documentation</a>. </p></div>`;

        if (this.command == undefined) {
            return `<html><p>No command or directory selected...</p>${g4doc_string}</html>`;
        }

		let htmlString = "";

        htmlString += `<h2>${this.command.path}</h2>`;

        if (this.command.guidance.length != 0) {
            htmlString += `<p>${this.command.guidance}</p>`;
        }

        if (this.command.parameters.length > 0) {
            htmlString += `<table width="100%" style="margin: 0px; text-align: left;">\n<tr><th>Parameter</th><th>Type</th><th>Candidates</th></tr>`;

            for (const parameter of this.command.parameters) {
                const candidates = (parameter.candidates == undefined) ? "-" : parameter.candidates;
                htmlString += `<tr><td>${parameter.name}</td><td>${parameter.type}</td><td>${candidates}</td></tr>`;
    
            }

            htmlString += `</table>\n`;
            }
            

        htmlString = "<html>\n" + htmlString + "\n<p></p>" + g4doc_string + "</html>";

        return htmlString;
    }
    

  }
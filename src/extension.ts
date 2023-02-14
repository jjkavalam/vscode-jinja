// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { parseMacroDefinitions, parseMacroNameFromAnyLine, parseMacroInvocationsFromLine } from "./jinja";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "j2-definition-provider" is now active!');

	const jinjaSelector = {
		scheme: "file",
		language: "jinja",
	};

	let disposable = vscode.languages.registerDefinitionProvider(jinjaSelector, new DefProvider());

	context.subscriptions.push(disposable);

	disposable = vscode.languages.registerDocumentSymbolProvider(jinjaSelector, new SymbolsProvider());

	context.subscriptions.push(disposable);

	disposable = vscode.languages.registerReferenceProvider(jinjaSelector, new ReferenceProvider());

	context.subscriptions.push(disposable);
}

class DefProvider implements vscode.DefinitionProvider {
	async provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Location | null> {
		const r = document.getWordRangeAtPosition(position);
		const w = document.getText(r);

		const files = await vscode.workspace.findFiles("**/*.j2");
		for (const file of files) {
			const document = await vscode.workspace.openTextDocument(file);
			const macros = parseMacroDefinitions(document.getText());
			const ret = macros.filter(m => m.name === w)[0];
			if (ret) {
				return new vscode.Location(file, new vscode.Position(ret.line, 0));
			}
		}
		return null;
	}

}

class SymbolsProvider implements vscode.DocumentSymbolProvider {
	provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.SymbolInformation[] | vscode.DocumentSymbol[]> {
		const symbols: vscode.SymbolInformation[] = [];
		const macros = parseMacroDefinitions(document.getText());

		for (const macro of macros) {
			symbols.push(
				new vscode.SymbolInformation(macro.name, vscode.SymbolKind.Function, "document", 
				new vscode.Location(document.uri, new vscode.Position(macro.line, 0)))
				);
		}

		return symbols;
	}
}

class ReferenceProvider implements vscode.ReferenceProvider {
	async provideReferences(document: vscode.TextDocument, position: vscode.Position, context: vscode.ReferenceContext, token: vscode.CancellationToken): Promise<vscode.Location[] | null> {
		const line = document.lineAt(position.line);

		const macroName = parseMacroNameFromAnyLine(line.text);

		if (!macroName) {
			return null;
		}

		const files = await vscode.workspace.findFiles("**/*.j2");
		const locations: vscode.Location[]  = [];
		for (const file of files) {
			const document = await vscode.workspace.openTextDocument(file);
			const macroInvocations = parseMacroInvocationsOf(document, macroName);
			locations.push(...macroInvocations);
		}
		return locations;
	}
}

function parseMacroInvocationsOf(text: vscode.TextDocument, macroName: string): vscode.Location[] {
    const locations: vscode.Location[]  = [];
    for (let i = 0; i < text.lineCount; i++) {
        const line = text.lineAt(i);
        const matchingMacroInvocations = parseMacroInvocationsFromLine(line.text)
            .filter(mi => mi.name === macroName)
            .map(mi => new vscode.Location(text.uri, new vscode.Position(i, mi.col)));
        locations.push(...matchingMacroInvocations);
    }
    return locations;
}

// This method is called when your extension is deactivated
export function deactivate() {}

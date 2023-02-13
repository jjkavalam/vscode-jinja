
export class MacroDefinition {
    name: string;
    line: number;
    constructor(name: string, line: number) {
        this.name = name;
        this.line = line;
    }
}
export function parseMacroDefinitions(text: string): MacroDefinition[] {
    const r: MacroDefinition[] = [];
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        const m = /{% macro (\w+)/.exec(line);
        if (m) {
            r.push(new MacroDefinition(m[1], i));
        }
    }
    return r;
}
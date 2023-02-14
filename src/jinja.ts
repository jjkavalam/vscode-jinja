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
        const macroName = parseMacroNameFromDefLine(line);
        if (macroName) {
            r.push(new MacroDefinition(macroName, i));
        }
    }
    return r;
}

export function parseMacroNameFromAnyLine(line: string): string | null {
    // anything that resembles a function call (includes macro definitions as well as invocations)
    const m = /(\w+)\(.*\)/.exec(line);
    if (m) {
        return m[1];
    }
    return null;
}

export function parseMacroNameFromDefLine(line: string): string | null {
    const m = /{% macro (\w+)/.exec(line);
    if (m) {
        return m[1];
    }
    return null;
}

class MacroInvocation {
    name: string;
    col: number;
    constructor(name: string, col: number) {
        this.name = name;
        this.col = col;
    }
}


export function parseMacroInvocationsFromLine(line: string): MacroInvocation[] {
    // explicitely check if the line is a macro definition rather than an invocation
    // because those lines also match the regex we are using to target invocation
    if (line.startsWith("{% macro ")) {
        return [];
    }

    const re = /(\w+)\(.*\)/g;

    const invocations = [];

    let match;
    while ((match = re.exec(line)) !== null) {
        invocations.push(new MacroInvocation(match[1], match.index));
    }
    return invocations;
}
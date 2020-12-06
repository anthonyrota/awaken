import * as path from 'path';
import * as fs from 'fs-extra';
import * as oniguruma from 'vscode-oniguruma';
import * as vscodeTextmate from 'vscode-textmate';
import { rootDir } from '../../rootDir';
import { CodeBlockStyle } from '../types';

async function loadVscodeOnigurumaLib(): Promise<vscodeTextmate.IOnigLib> {
    const wasmArrayBuffer = (
        await fs.readFile(
            path.join(
                rootDir,
                'www/node_modules/vscode-oniguruma/release/onig.wasm',
            ),
        )
    ).buffer;

    await oniguruma.loadWASM(wasmArrayBuffer);

    return {
        // Types mismatch.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createOnigScanner(patterns): any {
            return new oniguruma.OnigScanner(patterns);
        },
        createOnigString(s) {
            return new oniguruma.OnigString(s);
        },
    };
}

export enum TokenizeLanguage {
    TypeScript = 'source.ts',
}

function makeGrammar(rawGrammarText: string): vscodeTextmate.IRawGrammar {
    return vscodeTextmate.parseRawGrammar(rawGrammarText);
}

const grammars: Record<string, Promise<vscodeTextmate.IRawGrammar>> = {
    [TokenizeLanguage.TypeScript]: fs
        .readFile(`${rootDir}/www/vendor/TypeScript.tmLanguage`, 'utf-8')
        .then(makeGrammar),
};

const registry = new vscodeTextmate.Registry({
    onigLib: loadVscodeOnigurumaLib(),
    loadGrammar: (scopeName) => {
        if (!(scopeName in grammars)) {
            return Promise.resolve(null);
        }

        return grammars[scopeName];
    },
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const themeJson: {
    name: string;
    tokenColors: vscodeTextmate.IRawThemeSetting[];
    colors: { 'editor.foreground': string; 'editor.background': string };
} = fs.readJSONSync(`${rootDir}/www/vendor/OneDark-Pro.json`);
registry.setTheme({
    name: themeJson.name,
    settings: themeJson.tokenColors,
});

export interface Token {
    startIndex: number;
    isItalic?: true;
    isBold?: true;
    isUnderline?: true;
    color?: string;
}

export interface TokenizedLine {
    startIndex: number;
    endIndex: number;
    tokens: Token[];
}

export interface TokenizedLines {
    lines: TokenizedLine[];
}

export const codeBlockStyle: CodeBlockStyle = {
    foreground: themeJson.colors['editor.foreground'],
    background: themeJson.colors['editor.background'],
};

// Is tokenize the right terminology? Idk.
export async function tokenizeText(
    text: string,
    language: TokenizeLanguage,
): Promise<TokenizedLines> {
    const grammar = await registry.loadGrammar(language);
    if (!grammar) {
        throw new Error(`No grammar found for scope ${language}`);
    }
    let ruleStack = vscodeTextmate.INITIAL;
    const tokenizedLines: TokenizedLine[] = [];
    let lineStartIndex = 0;
    text.split('\n').forEach((line) => {
        const result = grammar.tokenizeLine2(line, ruleStack);
        const lineTokens: Token[] = [];
        for (let i = 0; i < result.tokens.length; i += 2) {
            const startIndex = result.tokens[i];
            const metadata = result.tokens[i + 1];
            const fontStyle =
                (metadata & vscodeTextmate.MetadataConsts.FONT_STYLE_MASK) >>
                vscodeTextmate.MetadataConsts.FONT_STYLE_OFFSET;
            const foreground =
                (metadata & vscodeTextmate.MetadataConsts.FOREGROUND_MASK) >>
                vscodeTextmate.MetadataConsts.FOREGROUND_OFFSET;
            lineTokens.push({
                startIndex,
                isItalic: fontStyle & 1 ? true : undefined,
                isBold: fontStyle & 2 ? true : undefined,
                isUnderline: fontStyle & 4 ? true : undefined,
                color:
                    foreground === 1
                        ? undefined
                        : registry.getColorMap()[foreground],
            });
        }
        tokenizedLines.push({
            startIndex: lineStartIndex,
            endIndex: lineStartIndex + line.length,
            tokens: lineTokens,
        });
        lineStartIndex += line.length + 1;
        ruleStack = result.ruleStack;
    });
    return {
        lines: tokenizedLines,
    };
}

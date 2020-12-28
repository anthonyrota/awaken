import { Theme } from '../../../../src/theme';

// [startIndex, endIndex, ...Token].
// Token: consists of two numbers:
//   First number: start index relative to the start of the line.
//   Second number:
//     Last bit: whether italic or not.
//     Rest of bits: color index.
export type EncodedTokenizedLine = number[];
export type EncodedTokenizedLines = EncodedTokenizedLine[];

export interface UnencodedToken {
    startIndex: number;
    isItalic?: boolean;
    color: number;
}

export interface UnencodedTokenizedLine {
    startIndex: number;
    endIndex: number;
    tokens: UnencodedToken[];
}

export interface UnencodedTokenizedLines {
    lines: UnencodedTokenizedLine[];
}

export type EncodedTokenizedLinesMap = Record<Theme, EncodedTokenizedLines>;
export type UnencodedTokenizedLinesMap = Record<Theme, UnencodedTokenizedLines>;

export function encodeTokenizedLines(
    tokenizedLines: UnencodedTokenizedLines,
): EncodedTokenizedLines {
    return tokenizedLines.lines.map((line) => {
        const encodedLine: EncodedTokenizedLine = [
            line.startIndex,
            line.endIndex,
        ];
        line.tokens.forEach((token) => {
            encodedLine.push(
                token.startIndex,
                (token.color << 1) | +!!token.isItalic,
            );
        });
        return encodedLine;
    });
}

export function unencodedTokenizedLines(
    encodedTokenizedLines: EncodedTokenizedLines,
): UnencodedTokenizedLines {
    const tokenizedLines: UnencodedTokenizedLine[] = [];
    encodedTokenizedLines.forEach((line) => {
        const startIndex = line[0];
        const endIndex = line[1];
        const tokens: UnencodedToken[] = [];
        for (let i = 2; i < line.length; i += 2) {
            const startIndex = line[i];
            const encodedTokenData = line[i + 1];
            const isItalic = !!(encodedTokenData & 1);
            const color = encodedTokenData >> 1;
            tokens.push({
                startIndex,
                isItalic,
                color,
            });
        }
        tokenizedLines.push({
            startIndex,
            endIndex,
            tokens,
        });
    });
    return {
        lines: tokenizedLines,
    };
}

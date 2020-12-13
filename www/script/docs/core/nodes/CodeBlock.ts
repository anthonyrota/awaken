import { TokenizedLinesMap } from '../../util/tokenizeText';
import { Node, CoreNodeType } from '.';

export enum CodeLinkType {
    DocPage,
}

export interface CodeLink {
    type: CodeLinkType;
    pageId: string;
    hash?: string;
    startIndex: number;
    endIndex: number;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const $HACK_SYMBOL: unique symbol = (typeof Symbol !== 'undefined'
    ? Symbol()
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
      '') as any;

export interface $HackValues {
    syntaxHighlightingPrefix: string;
    syntaxHighlightingSuffix: string;
}

export interface CodeBlockParameters {
    language?: string;
    code: string;
    codeLinks?: CodeLink[];
    tokenizedLinesMap?: TokenizedLinesMap;
    [$HACK_SYMBOL]?: $HackValues;
}

export interface CodeBlockBase {
    language?: string;
    code: string;
    codeLinks?: CodeLink[];
    tokenizedLinesMap?: TokenizedLinesMap;
    [$HACK_SYMBOL]?: $HackValues;
}

export function CodeBlockBase(parameters: CodeBlockParameters): CodeBlockBase {
    return {
        code: parameters.code,
        language: parameters.language,
        codeLinks: parameters.codeLinks,
        tokenizedLinesMap: parameters.tokenizedLinesMap,
        [$HACK_SYMBOL]: parameters[$HACK_SYMBOL],
    };
}

export interface CodeBlockNode extends CodeBlockBase, Node {
    type: CoreNodeType.CodeBlock;
}

export function CodeBlockNode(parameters: CodeBlockParameters): CodeBlockNode {
    return {
        type: CoreNodeType.CodeBlock,
        ...CodeBlockBase(parameters),
    };
}

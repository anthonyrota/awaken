import { Node, CoreNodeType } from '.';

export interface CodeBlock extends Node {
    type: CoreNodeType.CodeBlock;
    language?: string;
    code: string;
}

export interface CodeBlockParameters {
    language?: string;
    code: string;
}

export function CodeBlock(parameters: CodeBlockParameters): CodeBlock {
    const codeBlock: CodeBlock = {
        type: CoreNodeType.CodeBlock,
        code: parameters.code,
    };
    if (parameters.language !== undefined) {
        codeBlock.language = parameters.language;
    }
    return codeBlock;
}

import { Node, CoreNodeType } from '.';

export interface CodeBlockParameters {
    language?: string;
    code: string;
}

export interface CodeBlockBase {
    language?: string;
    code: string;
}

export function CodeBlockBase(parameters: CodeBlockParameters): CodeBlockBase {
    const codeBlockBase: CodeBlockBase = {
        code: parameters.code,
    };
    if (parameters.language !== undefined) {
        codeBlockBase.language = parameters.language;
    }
    return codeBlockBase;
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

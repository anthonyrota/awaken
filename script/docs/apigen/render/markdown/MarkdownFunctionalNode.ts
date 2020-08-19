import { MarkdownOutput } from './MarkdownOutput';
import { Node } from '../../nodes';

export const MarkdownFunctionalNodeType =
    'core/markdown/rendering/MarkdownFunctionalNodeType';
export type MarkdownFunctionalNodeType = typeof MarkdownFunctionalNodeType;

export interface MarkdownFunctionalNode extends Node {
    type: MarkdownFunctionalNodeType;
    write: (output: MarkdownOutput) => void;
}

export interface MarkdownFunctionalNodeParameters {
    write: (output: MarkdownOutput) => void;
}

export function MarkdownFunctionalNode(
    parameters: MarkdownFunctionalNodeParameters,
): MarkdownFunctionalNode {
    return {
        type: MarkdownFunctionalNodeType,
        write: parameters.write,
    };
}

export function writeMarkdownFunctionalNode(
    markdownFunctionalNode: MarkdownFunctionalNode,
    output: MarkdownOutput,
): void {
    markdownFunctionalNode.write(output);
}

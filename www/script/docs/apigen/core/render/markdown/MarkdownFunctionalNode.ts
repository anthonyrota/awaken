import { Node } from '../../nodes';
import { MarkdownOutput } from './MarkdownOutput';

export interface MarkdownFunctionalParameters {
    write: (output: MarkdownOutput) => void;
}

export interface MarkdownFunctionalBase {
    write: (output: MarkdownOutput) => void;
}

export function MarkdownFunctionalBase(
    parameters: MarkdownFunctionalParameters,
): MarkdownFunctionalBase {
    return {
        write: parameters.write,
    };
}

export const MarkdownFunctionalNodeType =
    'core/markdown/rendering/MarkdownFunctionalNodeType';
export type MarkdownFunctionalNodeType = typeof MarkdownFunctionalNodeType;

export interface MarkdownFunctionalNode extends MarkdownFunctionalBase, Node {
    type: MarkdownFunctionalNodeType;
}

export function MarkdownFunctionalNode(
    parameters: MarkdownFunctionalParameters,
): MarkdownFunctionalNode {
    return {
        type: MarkdownFunctionalNodeType,
        ...MarkdownFunctionalBase(parameters),
    };
}

export function writeMarkdownFunctionalNode(
    markdownFunctionalNode: MarkdownFunctionalBase,
    output: MarkdownOutput,
): void {
    markdownFunctionalNode.write(output);
}

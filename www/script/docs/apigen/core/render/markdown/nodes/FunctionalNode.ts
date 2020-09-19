import { Node } from '../../../nodes';
import { MarkdownOutput } from '../MarkdownOutput';
import { RenderMarkdownNodeType } from '.';

export interface FunctionalParameters {
    write: (output: MarkdownOutput) => void;
}

export interface FunctionalBase {
    write: (output: MarkdownOutput) => void;
}

export function FunctionalBase(
    parameters: FunctionalParameters,
): FunctionalBase {
    return {
        write: parameters.write,
    };
}

export interface FunctionalNode extends FunctionalBase, Node {
    type: RenderMarkdownNodeType.FunctionalNode;
}

export function FunctionalNode(
    parameters: FunctionalParameters,
): FunctionalNode {
    return {
        type: RenderMarkdownNodeType.FunctionalNode,
        ...FunctionalBase(parameters),
    };
}

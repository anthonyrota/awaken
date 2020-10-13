import { Node, CoreNodeType } from '.';

export interface NamedAnchorParameters {
    name: string;
}

export interface NamedAnchorBase {
    name: string;
}

export function NamedAnchorBase(
    parameters: NamedAnchorParameters,
): NamedAnchorBase {
    return {
        name: parameters.name,
    };
}

export interface NamedAnchorNode extends NamedAnchorBase, Node {
    type: CoreNodeType.NamedAnchor;
}

export function NamedAnchorNode(
    parameters: NamedAnchorParameters,
): NamedAnchorNode {
    return {
        type: CoreNodeType.NamedAnchor,
        ...NamedAnchorBase(parameters),
    };
}

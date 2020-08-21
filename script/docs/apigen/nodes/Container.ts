import { Node, CoreNodeType } from '.';

export interface ContainerParameters<ChildNode extends Node> {
    children?: ChildNode[];
}

export interface ContainerBase<ChildNode extends Node> {
    children: ChildNode[];
}

export function ContainerBase<ChildNode extends Node>(
    parameters: ContainerParameters<ChildNode>,
): ContainerBase<ChildNode> {
    return {
        children: parameters.children ?? [],
    };
}

export interface ContainerNode<ChildNode extends Node>
    extends ContainerBase<ChildNode>,
        Node {
    type: CoreNodeType.Container;
}

export function ContainerNode<ChildNode extends Node>(
    parameters: ContainerParameters<ChildNode>,
): ContainerNode<ChildNode> {
    return {
        type: CoreNodeType.Container,
        ...ContainerBase(parameters),
    };
}

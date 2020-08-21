import { ContainerBase, ContainerParameters } from './Container';
import { Node, CoreNodeType } from '.';

export interface StrikethroughParameters<ChildNode extends Node>
    extends ContainerParameters<ChildNode> {}

export interface StrikethroughBase<ChildNode extends Node>
    extends ContainerBase<ChildNode> {}

export function StrikethroughBase<ChildNode extends Node>(
    parameters: StrikethroughParameters<ChildNode>,
): StrikethroughBase<ChildNode> {
    return {
        ...ContainerBase<ChildNode>({ children: parameters.children }),
    };
}

export interface StrikethroughNode<ChildNode extends Node>
    extends StrikethroughBase<ChildNode>,
        Node {
    type: CoreNodeType.Strikethrough;
}

export function StrikethroughNode<ChildNode extends Node>(
    parameters: StrikethroughParameters<ChildNode>,
): StrikethroughNode<ChildNode> {
    return {
        type: CoreNodeType.Strikethrough,
        ...StrikethroughBase(parameters),
    };
}

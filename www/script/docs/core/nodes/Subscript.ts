import { ContainerBase, ContainerParameters } from './Container';
import { Node, CoreNodeType } from '.';

export interface SubscriptParameters<ChildNode extends Node>
    extends ContainerParameters<ChildNode> {}

export interface SubscriptBase<ChildNode extends Node>
    extends ContainerBase<ChildNode> {}

export function SubscriptBase<ChildNode extends Node>(
    parameters: SubscriptParameters<ChildNode>,
): SubscriptBase<ChildNode> {
    return {
        ...ContainerBase<ChildNode>({ children: parameters.children }),
    };
}

export interface SubscriptNode<ChildNode extends Node>
    extends SubscriptBase<ChildNode>,
        Node {
    type: CoreNodeType.Subscript;
}

export function SubscriptNode<ChildNode extends Node>(
    parameters: SubscriptParameters<ChildNode>,
): SubscriptNode<ChildNode> {
    return {
        type: CoreNodeType.Subscript,
        ...SubscriptBase(parameters),
    };
}

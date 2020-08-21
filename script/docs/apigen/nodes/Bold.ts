import { ContainerBase, ContainerParameters } from './Container';
import { Node, CoreNodeType } from '.';

export interface BoldParameters<ChildNode extends Node>
    extends ContainerParameters<ChildNode> {}

export interface BoldBase<ChildNode extends Node>
    extends ContainerBase<ChildNode> {}

export function BoldBase<ChildNode extends Node>(
    parameters: BoldParameters<ChildNode>,
): BoldBase<ChildNode> {
    return {
        ...ContainerBase<ChildNode>({ children: parameters.children }),
    };
}

export interface BoldNode<ChildNode extends Node>
    extends BoldBase<ChildNode>,
        Node {
    type: CoreNodeType.Bold;
}

export function BoldNode<ChildNode extends Node>(
    parameters: BoldParameters<ChildNode>,
): BoldNode<ChildNode> {
    return {
        type: CoreNodeType.Bold,
        ...BoldBase(parameters),
    };
}

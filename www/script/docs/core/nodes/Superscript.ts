import { ContainerBase, ContainerParameters } from './Container';
import { Node, CoreNodeType } from '.';

export interface SuperscriptParameters<ChildNode extends Node>
    extends ContainerParameters<ChildNode> {}

export interface SuperscriptBase<ChildNode extends Node>
    extends ContainerBase<ChildNode> {}

export function SuperscriptBase<ChildNode extends Node>(
    parameters: SuperscriptParameters<ChildNode>,
): SuperscriptBase<ChildNode> {
    return {
        ...ContainerBase<ChildNode>({ children: parameters.children }),
    };
}

export interface SuperscriptNode<ChildNode extends Node>
    extends SuperscriptBase<ChildNode>,
        Node {
    type: CoreNodeType.Superscript;
}

export function SuperscriptNode<ChildNode extends Node>(
    parameters: SuperscriptParameters<ChildNode>,
): SuperscriptNode<ChildNode> {
    return {
        type: CoreNodeType.Superscript,
        ...SuperscriptBase(parameters),
    };
}

import { ContainerParameters, ContainerBase } from './Container';
import { Node, CoreNodeType } from '.';

export interface SubheadingParameters<ChildNode extends Node>
    extends ContainerParameters<ChildNode> {
    alternateId?: string;
}

export interface SubheadingBase<ChildNode extends Node>
    extends ContainerBase<ChildNode> {
    alternateId?: string;
}

export function SubheadingBase<ChildNode extends Node>(
    parameters: SubheadingParameters<ChildNode>,
): SubheadingBase<ChildNode> {
    const subheadingBase: SubheadingBase<ChildNode> = {
        ...ContainerBase<ChildNode>({ children: parameters.children }),
    };
    if (parameters.alternateId !== undefined) {
        subheadingBase.alternateId = parameters.alternateId;
    }
    return subheadingBase;
}

export interface SubheadingNode<ChildNode extends Node>
    extends SubheadingBase<ChildNode>,
        Node {
    type: CoreNodeType.Subheading;
}

export function SubheadingNode<ChildNode extends Node>(
    parameters: SubheadingParameters<ChildNode>,
): SubheadingNode<ChildNode> {
    return {
        type: CoreNodeType.Subheading,
        ...SubheadingBase(parameters),
    };
}

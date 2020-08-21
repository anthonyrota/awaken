import { ContainerBase, ContainerParameters } from './Container';
import { Node, CoreNodeType } from '.';

export interface HeadingParameters<ChildNode extends Node>
    extends ContainerParameters<ChildNode> {
    alternateId?: string;
}

export interface HeadingBase<ChildNode extends Node>
    extends ContainerBase<ChildNode> {
    alternateId?: string;
}

export function HeadingBase<ChildNode extends Node>(
    parameters: HeadingParameters<ChildNode>,
): HeadingBase<ChildNode> {
    const headingBase: HeadingBase<ChildNode> = {
        ...ContainerBase<ChildNode>({ children: parameters.children }),
    };
    if (parameters.alternateId !== undefined) {
        headingBase.alternateId = parameters.alternateId;
    }
    return headingBase;
}

export interface HeadingNode<ChildNode extends Node>
    extends HeadingBase<ChildNode>,
        Node {
    type: CoreNodeType.Heading;
}

export function HeadingNode<ChildNode extends Node>(
    parameters: HeadingParameters<ChildNode>,
): HeadingNode<ChildNode> {
    return {
        type: CoreNodeType.Heading,
        ...HeadingBase(parameters),
    };
}

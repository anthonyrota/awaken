import { ContainerBase, ContainerParameters } from './Container';
import { Node, CoreNodeType } from '.';

export interface LinkParameters<ChildNode extends Node>
    extends ContainerParameters<ChildNode> {
    destination: string;
    title?: string;
}

export interface LinkBase<ChildNode extends Node>
    extends ContainerBase<ChildNode> {
    destination: string;
    title?: string;
}

export function LinkBase<ChildNode extends Node>(
    parameters: LinkParameters<ChildNode>,
): LinkBase<ChildNode> {
    const linkBase: LinkBase<ChildNode> = {
        destination: parameters.destination,
        ...ContainerBase<ChildNode>({ children: parameters.children }),
    };
    if (parameters.title !== undefined) {
        linkBase.title = parameters.title;
    }
    return linkBase;
}

export interface LinkNode<ChildNode extends Node>
    extends LinkBase<ChildNode>,
        Node {
    type: CoreNodeType.Link;
}

export function LinkNode<ChildNode extends Node>(
    parameters: LinkParameters<ChildNode>,
): LinkNode<ChildNode> {
    return {
        type: CoreNodeType.Link,
        ...LinkBase(parameters),
    };
}

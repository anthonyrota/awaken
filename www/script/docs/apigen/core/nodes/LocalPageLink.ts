import { ContainerParameters, ContainerBase } from './Container';
import { Node, CoreNodeType } from '.';

export interface LocalPageLinkParameters<ChildNode extends Node>
    extends ContainerParameters<ChildNode> {
    destination: string;
    title?: string;
}

export interface LocalPageLinkBase<ChildNode extends Node>
    extends ContainerBase<ChildNode> {
    destination: string;
    title?: string;
}

export function LocalPageLinkBase<ChildNode extends Node>(
    parameters: LocalPageLinkParameters<ChildNode>,
): LocalPageLinkBase<ChildNode> {
    const localPageLinkBase: LocalPageLinkBase<ChildNode> = {
        destination: parameters.destination,
        ...ContainerBase<ChildNode>({ children: parameters.children }),
    };
    if (parameters.title !== undefined) {
        localPageLinkBase.title = parameters.title;
    }
    return localPageLinkBase;
}

export interface LocalPageLinkNode<ChildNode extends Node>
    extends LocalPageLinkBase<ChildNode>,
        Node {
    type: CoreNodeType.LocalPageLink;
}

export function LocalPageLinkNode<ChildNode extends Node>(
    parameters: LocalPageLinkParameters<ChildNode>,
): LocalPageLinkNode<ChildNode> {
    return {
        type: CoreNodeType.LocalPageLink,
        ...LocalPageLinkBase(parameters),
    };
}

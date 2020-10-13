import { ContainerParameters, ContainerBase } from './Container';
import { Node, CoreNodeType } from '.';

export interface DocPageLinkParameters<ChildNode extends Node>
    extends ContainerParameters<ChildNode> {
    pageId: string;
    hash?: string;
    title?: string;
}

export interface DocPageLinkBase<ChildNode extends Node>
    extends ContainerBase<ChildNode> {
    pageId: string;
    hash?: string;
    title?: string;
}

export function DocPageLinkBase<ChildNode extends Node>(
    parameters: DocPageLinkParameters<ChildNode>,
): DocPageLinkBase<ChildNode> {
    const docPageLinkBase: DocPageLinkBase<ChildNode> = {
        pageId: parameters.pageId,
        ...ContainerBase<ChildNode>({ children: parameters.children }),
    };
    if (parameters.hash !== undefined) {
        docPageLinkBase.hash = parameters.hash;
    }
    if (parameters.title !== undefined) {
        docPageLinkBase.title = parameters.title;
    }
    return docPageLinkBase;
}

export interface DocPageLinkNode<ChildNode extends Node>
    extends DocPageLinkBase<ChildNode>,
        Node {
    type: CoreNodeType.DocPageLink;
}

export function DocPageLinkNode<ChildNode extends Node>(
    parameters: DocPageLinkParameters<ChildNode>,
): DocPageLinkNode<ChildNode> {
    return {
        type: CoreNodeType.DocPageLink,
        ...DocPageLinkBase(parameters),
    };
}

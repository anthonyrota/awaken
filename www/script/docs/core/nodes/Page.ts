import { TableOfContents } from './../../types';
import { ContainerParameters, ContainerBase } from './Container';
import { Node, CoreNodeType } from '.';

export interface PageParameters<ChildNode extends Node>
    extends ContainerParameters<ChildNode> {
    pageId: string;
    title: string;
    tableOfContents?: TableOfContents;
}

export interface PageBase<ChildNode extends Node>
    extends ContainerBase<ChildNode> {
    pageId: string;
    title: string;
    tableOfContents?: TableOfContents;
}

export function PageBase<ChildNode extends Node>(
    parameters: PageParameters<ChildNode>,
): PageBase<ChildNode> {
    const pageBase: PageBase<ChildNode> = {
        pageId: parameters.pageId,
        title: parameters.title,
        ...ContainerBase<ChildNode>({ children: parameters.children }),
    };
    if (parameters.tableOfContents) {
        pageBase.tableOfContents = parameters.tableOfContents;
    }
    return pageBase;
}

export interface PageNode<ChildNode extends Node>
    extends PageBase<ChildNode>,
        Node {
    type: CoreNodeType.Page;
}

export function PageNode<ChildNode extends Node>(
    parameters: PageParameters<ChildNode>,
): PageNode<ChildNode> {
    return {
        type: CoreNodeType.Page,
        ...PageBase(parameters),
    };
}

import { PageMetadata } from '../../types';
import { ContainerParameters, ContainerBase } from './Container';
import { Node, CoreNodeType } from '.';

export interface PageParameters<ChildNode extends Node>
    extends ContainerParameters<ChildNode> {
    metadata: PageMetadata;
    pagePath: string;
    pageUrl: string;
}

export interface PageBase<ChildNode extends Node>
    extends ContainerBase<ChildNode> {
    metadata: PageMetadata;
    pagePath: string;
    pageUrl: string;
}

export function PageBase<ChildNode extends Node>(
    parameters: PageParameters<ChildNode>,
): PageBase<ChildNode> {
    return {
        metadata: parameters.metadata,
        pagePath: parameters.pagePath,
        pageUrl: parameters.pageUrl,
        ...ContainerBase<ChildNode>({ children: parameters.children }),
    };
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

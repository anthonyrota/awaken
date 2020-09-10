import { PageMetadata } from '../../../pageMetadata';
import { ContainerParameters, ContainerBase } from './Container';
import { Node, CoreNodeType } from '.';

export interface PageParameters<ChildNode extends Node>
    extends ContainerParameters<ChildNode> {
    metadata: PageMetadata;
}

export interface PageBase<ChildNode extends Node>
    extends ContainerBase<ChildNode> {
    metadata: PageMetadata;
}

export function PageBase<ChildNode extends Node>(
    parameters: PageParameters<ChildNode>,
): PageBase<ChildNode> {
    return {
        metadata: parameters.metadata,
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

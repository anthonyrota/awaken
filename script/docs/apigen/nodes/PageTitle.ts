import { ContainerBase } from './abstract/ContainerBase';
import { Node, CoreNodeType } from '.';

export interface PageTitle<ChildNode extends Node>
    extends ContainerBase<ChildNode> {
    type: CoreNodeType.PageTitle;
    alternateId?: string;
}

export interface PageTitleParameters {
    alternateId?: string;
}

export function PageTitle<ChildNode extends Node>(
    parameters: PageTitleParameters,
): PageTitle<ChildNode> {
    const pageTitle: PageTitle<ChildNode> = {
        type: CoreNodeType.PageTitle,
        ...ContainerBase<ChildNode>(),
    };
    if (parameters.alternateId !== undefined) {
        pageTitle.alternateId = parameters.alternateId;
    }
    return pageTitle;
}

import { ContainerParameters, ContainerBase } from './Container';
import { Node, CoreNodeType } from '.';

export interface PageTitleParameters<ChildNode extends Node>
    extends ContainerParameters<ChildNode> {
    alternateId?: string;
}

export interface PageTitleBase<ChildNode extends Node>
    extends ContainerBase<ChildNode> {
    alternateId?: string;
}

export function PageTitleBase<ChildNode extends Node>(
    parameters: PageTitleParameters<ChildNode>,
): PageTitleBase<ChildNode> {
    const pageTitleBase: PageTitleBase<ChildNode> = {
        ...ContainerBase<ChildNode>({ children: parameters.children }),
    };
    if (parameters.alternateId !== undefined) {
        pageTitleBase.alternateId = parameters.alternateId;
    }
    return pageTitleBase;
}

export interface PageTitleNode<ChildNode extends Node>
    extends PageTitleBase<ChildNode>,
        Node {
    type: CoreNodeType.PageTitle;
}

export function PageTitleNode<ChildNode extends Node>(
    parameters: PageTitleParameters<ChildNode>,
): PageTitleNode<ChildNode> {
    return {
        type: CoreNodeType.PageTitle,
        ...PageTitleBase(parameters),
    };
}

import { ContainerParameters, ContainerBase } from './Container';
import { Node, CoreNodeType } from '.';

export interface TitleParameters<ChildNode extends Node>
    extends ContainerParameters<ChildNode> {
    alternateId?: string;
}

export interface TitleBase<ChildNode extends Node>
    extends ContainerBase<ChildNode> {
    alternateId?: string;
}

export function TitleBase<ChildNode extends Node>(
    parameters: TitleParameters<ChildNode>,
): TitleBase<ChildNode> {
    const titleBase: TitleBase<ChildNode> = {
        ...ContainerBase<ChildNode>({ children: parameters.children }),
    };
    if (parameters.alternateId !== undefined) {
        titleBase.alternateId = parameters.alternateId;
    }
    return titleBase;
}

export interface TitleNode<ChildNode extends Node>
    extends TitleBase<ChildNode>,
        Node {
    type: CoreNodeType.Title;
}

export function TitleNode<ChildNode extends Node>(
    parameters: TitleParameters<ChildNode>,
): TitleNode<ChildNode> {
    return {
        type: CoreNodeType.Title,
        ...TitleBase(parameters),
    };
}

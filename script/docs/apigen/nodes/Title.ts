import { ContainerBase } from './abstract/ContainerBase';
import { Node, CoreNodeType } from '.';

export interface Title<ChildNode extends Node>
    extends ContainerBase<ChildNode> {
    type: CoreNodeType.Title;
    alternateId?: string;
}

export interface TitleParameters {
    alternateId?: string;
}

export function Title<ChildNode extends Node>(
    parameters: TitleParameters,
): Title<ChildNode> {
    const title: Title<ChildNode> = {
        type: CoreNodeType.Title,
        ...ContainerBase<ChildNode>(),
    };
    if (parameters.alternateId !== undefined) {
        title.alternateId = parameters.alternateId;
    }
    return title;
}

import { ContainerBase } from './abstract/ContainerBase';
import { Node, CoreNodeType } from '.';

export interface LocalPageLink<ChildNode extends Node>
    extends ContainerBase<ChildNode> {
    type: CoreNodeType.LocalPageLink;
    destination: string;
    title?: string;
}

export interface LocalPageLinkParameters {
    destination: string;
    title?: string;
}

export function LocalPageLink<ChildNode extends Node>(
    parameters: LocalPageLinkParameters,
): LocalPageLink<ChildNode> {
    const localPageLink: LocalPageLink<ChildNode> = {
        type: CoreNodeType.LocalPageLink,
        destination: parameters.destination,
        ...ContainerBase<ChildNode>(),
    };
    if (parameters.title !== undefined) {
        localPageLink.title = parameters.title;
    }
    return localPageLink;
}

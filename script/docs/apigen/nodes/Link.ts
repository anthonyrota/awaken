import { ContainerBase } from './abstract/ContainerBase';
import { Node, CoreNodeType } from '.';

export interface Link<ChildNode extends Node> extends ContainerBase<ChildNode> {
    type: CoreNodeType.Link;
    destination: string;
    title?: string;
}

export interface LinkParameters {
    destination: string;
    title?: string;
}

export function Link<ChildNode extends Node>(
    parameters: LinkParameters,
): Link<ChildNode> {
    const link: Link<ChildNode> = {
        type: CoreNodeType.Link,
        destination: parameters.destination,
        ...ContainerBase<ChildNode>(),
    };
    if (parameters.title !== undefined) {
        link.title = parameters.title;
    }
    return link;
}

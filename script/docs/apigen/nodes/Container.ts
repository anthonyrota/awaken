import { ContainerBase } from './abstract/ContainerBase';
import { Node, CoreNodeType } from '.';

export interface Container<ChildNode extends Node>
    extends ContainerBase<ChildNode> {
    type: CoreNodeType.Container;
}

export function Container<ChildNode extends Node>(): Container<ChildNode> {
    return {
        type: CoreNodeType.Container,
        ...ContainerBase<ChildNode>(),
    };
}

import { ContainerBase } from './abstract/ContainerBase';
import { Node, CoreNodeType } from '.';

export interface Bold<ChildNode extends Node> extends ContainerBase<ChildNode> {
    type: CoreNodeType.Bold;
}

export function Bold<ChildNode extends Node>(): Bold<ChildNode> {
    return {
        type: CoreNodeType.Bold,
        ...ContainerBase<ChildNode>(),
    };
}

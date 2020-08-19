import { ContainerBase } from './abstract/ContainerBase';
import { Node, CoreNodeType } from '.';

export interface Italics<ChildNode extends Node>
    extends ContainerBase<ChildNode> {
    type: CoreNodeType.Italics;
}

export function Italics<ChildNode extends Node>(): Italics<ChildNode> {
    return {
        type: CoreNodeType.Italics,
        ...ContainerBase<ChildNode>(),
    };
}

import { ContainerBase } from './abstract/ContainerBase';
import { Node, CoreNodeType } from '.';

export interface Strikethrough<ChildNode extends Node>
    extends ContainerBase<ChildNode> {
    type: CoreNodeType.Strikethrough;
}

export function Strikethrough<ChildNode extends Node>(): Strikethrough<
    ChildNode
> {
    return {
        type: CoreNodeType.Strikethrough,
        ...ContainerBase<ChildNode>(),
    };
}

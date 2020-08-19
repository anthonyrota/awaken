import { ContainerBase } from './abstract/ContainerBase';
import { Node, CoreNodeType } from '.';

export interface CodeSpan<ChildNode extends Node>
    extends ContainerBase<ChildNode> {
    type: CoreNodeType.CodeSpan;
}

export function CodeSpan<ChildNode extends Node>(): CodeSpan<ChildNode> {
    return {
        type: CoreNodeType.CodeSpan,
        ...ContainerBase<ChildNode>(),
    };
}

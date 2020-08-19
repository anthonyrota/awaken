import { ContainerBase } from './abstract/ContainerBase';
import { Node, CoreNodeType } from '.';

export interface Paragraph<ChildNode extends Node>
    extends ContainerBase<ChildNode> {
    type: CoreNodeType.Paragraph;
}

export function Paragraph<ChildNode extends Node>(): Paragraph<ChildNode> {
    const paragraph: Paragraph<ChildNode> = {
        type: CoreNodeType.Paragraph,
        ...ContainerBase<ChildNode>(),
    };
    return paragraph;
}

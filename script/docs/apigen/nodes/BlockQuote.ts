import { ContainerBase } from './abstract/ContainerBase';
import { Node, CoreNodeType } from '.';

export interface BlockQuote<ChildNode extends Node>
    extends ContainerBase<ChildNode> {
    type: CoreNodeType.BlockQuote;
}

export function BlockQuote<ChildNode extends Node>(): BlockQuote<ChildNode> {
    return {
        type: CoreNodeType.BlockQuote,
        ...ContainerBase<ChildNode>(),
    };
}

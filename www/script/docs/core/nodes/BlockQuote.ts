import { ContainerBase, ContainerParameters } from './Container';
import { Node, CoreNodeType } from '.';

export interface BlockQuoteParameters<ChildNode extends Node>
    extends ContainerParameters<ChildNode> {}

export interface BlockQuoteBase<ChildNode extends Node>
    extends ContainerBase<ChildNode> {}

export function BlockQuoteBase<ChildNode extends Node>(
    parameters: BlockQuoteParameters<ChildNode>,
): BlockQuoteBase<ChildNode> {
    return {
        ...ContainerBase<ChildNode>({ children: parameters.children }),
    };
}

export interface BlockQuoteNode<ChildNode extends Node>
    extends BlockQuoteBase<ChildNode>,
        Node {
    type: CoreNodeType.BlockQuote;
}

export function BlockQuoteNode<ChildNode extends Node>(
    parameters: BlockQuoteParameters<ChildNode>,
): BlockQuoteNode<ChildNode> {
    return {
        type: CoreNodeType.BlockQuote,
        ...BlockQuoteBase(parameters),
    };
}

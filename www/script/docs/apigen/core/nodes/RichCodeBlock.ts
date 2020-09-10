import { ContainerParameters, ContainerBase } from './Container';
import { Node, CoreNodeType } from '.';

export interface RichCodeBlockParameters<ChildNode extends Node>
    extends ContainerParameters<ChildNode> {
    language: string;
}

export interface RichCodeBlockBase<ChildNode extends Node>
    extends ContainerBase<ChildNode> {
    language: string;
}

export function RichCodeBlockBase<ChildNode extends Node>(
    parameters: RichCodeBlockParameters<ChildNode>,
): RichCodeBlockBase<ChildNode> {
    return {
        language: parameters.language,
        ...ContainerBase({ children: parameters.children }),
    };
}

export interface RichCodeBlockNode<ChildNode extends Node>
    extends RichCodeBlockBase<ChildNode>,
        Node {
    type: CoreNodeType.RichCodeBlock;
}

export function RichCodeBlockNode<ChildNode extends Node>(
    parameters: RichCodeBlockParameters<ChildNode>,
): RichCodeBlockNode<ChildNode> {
    return {
        type: CoreNodeType.RichCodeBlock,
        ...RichCodeBlockBase(parameters),
    };
}

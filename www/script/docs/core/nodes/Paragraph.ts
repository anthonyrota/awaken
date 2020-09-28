import { ContainerParameters, ContainerBase } from './Container';
import { Node, CoreNodeType } from '.';

export interface ParagraphParameters<ChildNode extends Node>
    extends ContainerParameters<ChildNode> {}

export interface ParagraphBase<ChildNode extends Node>
    extends ContainerBase<ChildNode> {}

export function ParagraphBase<ChildNode extends Node>(
    parameters: ParagraphParameters<ChildNode>,
): ParagraphBase<ChildNode> {
    const paragraph: ParagraphBase<ChildNode> = {
        ...ContainerBase<ChildNode>({ children: parameters.children }),
    };
    return paragraph;
}

export interface ParagraphNode<ChildNode extends Node>
    extends ParagraphBase<ChildNode>,
        Node {
    type: CoreNodeType.Paragraph;
}

export function ParagraphNode<ChildNode extends Node>(
    parameters: ParagraphParameters<ChildNode>,
): ParagraphNode<ChildNode> {
    return {
        type: CoreNodeType.Paragraph,
        ...ParagraphBase(parameters),
    };
}

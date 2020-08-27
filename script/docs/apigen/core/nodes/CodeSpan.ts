import { ContainerBase, ContainerParameters } from './Container';
import { Node, CoreNodeType } from '.';

export interface CodeSpanParameters<ChildNode extends Node>
    extends ContainerParameters<ChildNode> {}

export interface CodeSpanBase<ChildNode extends Node>
    extends ContainerBase<ChildNode> {}

export function CodeSpanBase<ChildNode extends Node>(
    parameters: CodeSpanParameters<ChildNode>,
): CodeSpanBase<ChildNode> {
    return {
        ...ContainerBase<ChildNode>({ children: parameters.children }),
    };
}

export interface CodeSpanNode<ChildNode extends Node>
    extends CodeSpanBase<ChildNode>,
        Node {
    type: CoreNodeType.CodeSpan;
}

export function CodeSpanNode<ChildNode extends Node>(
    parameters: CodeSpanParameters<ChildNode>,
): CodeSpanNode<ChildNode> {
    return {
        type: CoreNodeType.CodeSpan,
        ...CodeSpanBase(parameters),
    };
}

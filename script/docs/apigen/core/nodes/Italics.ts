import { ContainerBase, ContainerParameters } from './Container';
import { Node, CoreNodeType } from '.';

export interface ItalicsParameters<ChildNode extends Node>
    extends ContainerParameters<ChildNode> {}

export interface ItalicsBase<ChildNode extends Node>
    extends ContainerBase<ChildNode> {}

export function ItalicsBase<ChildNode extends Node>(
    parameters: ItalicsParameters<ChildNode>,
): ItalicsBase<ChildNode> {
    return {
        ...ContainerBase<ChildNode>({ children: parameters.children }),
    };
}

export interface ItalicsNode<ChildNode extends Node>
    extends ItalicsBase<ChildNode>,
        Node {
    type: CoreNodeType.Italics;
}

export function ItalicsNode<ChildNode extends Node>(
    parameters: ItalicsParameters<ChildNode>,
): ItalicsNode<ChildNode> {
    return {
        type: CoreNodeType.Italics,
        ...ItalicsBase(parameters),
    };
}

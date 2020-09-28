import { ContainerBase, ContainerParameters } from './Container';
import { Node, CoreNodeType } from '.';

export type Heading123456Level = 1 | 2 | 3 | 4 | 5 | 6;

export interface Heading123456Parameters<ChildNode extends Node>
    extends ContainerParameters<ChildNode> {
    level: Heading123456Level;
    alternateId?: string;
}

export interface Heading123456Base<ChildNode extends Node>
    extends ContainerBase<ChildNode> {
    level: Heading123456Level;
    alternateId?: string;
}

export function Heading123456Base<ChildNode extends Node>(
    parameters: Heading123456Parameters<ChildNode>,
): Heading123456Base<ChildNode> {
    const heading123456Base: Heading123456Base<ChildNode> = {
        level: parameters.level,
        ...ContainerBase<ChildNode>({ children: parameters.children }),
    };
    if (parameters.alternateId !== undefined) {
        heading123456Base.alternateId = parameters.alternateId;
    }
    return heading123456Base;
}

export interface Heading123456Node<ChildNode extends Node>
    extends Heading123456Base<ChildNode>,
        Node {
    type: CoreNodeType.Heading123456;
}

export function Heading123456Node<ChildNode extends Node>(
    parameters: Heading123456Parameters<ChildNode>,
): Heading123456Node<ChildNode> {
    return {
        type: CoreNodeType.Heading123456,
        ...Heading123456Base(parameters),
    };
}

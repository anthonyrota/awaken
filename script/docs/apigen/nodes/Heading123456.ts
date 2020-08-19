import { ContainerBase } from './abstract/ContainerBase';
import { Node, CoreNodeType } from '.';

export interface Heading123456<ChildNode extends Node>
    extends ContainerBase<ChildNode> {
    type: CoreNodeType.Heading123456;
    level: number;
    alternateId?: string;
}

export interface Heading123456Parameters {
    level: number;
    alternateId?: string;
}

export function Heading123456<ChildNode extends Node>(
    parameters: Heading123456Parameters,
): Heading123456<ChildNode> {
    const heading123456: Heading123456<ChildNode> = {
        type: CoreNodeType.Heading123456,
        level: parameters.level,
        ...ContainerBase<ChildNode>(),
    };
    if (parameters.alternateId !== undefined) {
        heading123456.alternateId = parameters.alternateId;
    }
    return heading123456;
}

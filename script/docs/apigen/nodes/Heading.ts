import { ContainerBase } from './abstract/ContainerBase';
import { Node, CoreNodeType } from '.';

export interface Heading<ChildNode extends Node>
    extends ContainerBase<ChildNode> {
    type: CoreNodeType.Heading;
    alternateId?: string;
}

export interface HeadingParameters {
    alternateId?: string;
}

export function Heading<ChildNode extends Node>(
    parameters: HeadingParameters,
): Heading<ChildNode> {
    const heading: Heading<ChildNode> = {
        type: CoreNodeType.Heading,
        ...ContainerBase<ChildNode>(),
    };
    if (parameters.alternateId !== undefined) {
        heading.alternateId = parameters.alternateId;
    }
    return heading;
}

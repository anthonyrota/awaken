import { ContainerBase } from './abstract/ContainerBase';
import { Node, CoreNodeType } from '.';

export interface Subheading<ChildNode extends Node>
    extends ContainerBase<ChildNode> {
    type: CoreNodeType.Subheading;
    alternateId?: string;
}

export interface SubheadingParameters {
    alternateId?: string;
}

export function Subheading<ChildNode extends Node>(
    parameters: SubheadingParameters,
): Subheading<ChildNode> {
    const subheading: Subheading<ChildNode> = {
        type: CoreNodeType.Subheading,
        ...ContainerBase<ChildNode>(),
    };
    if (parameters.alternateId !== undefined) {
        subheading.alternateId = parameters.alternateId;
    }
    return subheading;
}

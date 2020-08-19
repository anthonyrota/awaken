import { ContainerBase } from './abstract/ContainerBase';
import { Node, CoreNodeType } from '.';

export interface OrderedOptions {
    start: number;
}

export interface List<ChildNode extends Node> extends ContainerBase<ChildNode> {
    type: CoreNodeType.List;
    ordered?: OrderedOptions;
}

export interface ListParameters {
    ordered?: {
        start?: number;
    };
}

export function List<ChildNode extends Node>(
    parameters: ListParameters,
): List<ChildNode> {
    const list: List<ChildNode> = {
        type: CoreNodeType.List,
        ...ContainerBase<ChildNode>(),
    };
    if (parameters.ordered) {
        list.ordered = {
            start: parameters.ordered.start ?? 1,
        };
    }
    return list;
}

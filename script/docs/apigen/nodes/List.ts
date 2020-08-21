import { ContainerParameters, ContainerBase } from './Container';
import { Node, CoreNodeType } from '.';

export enum ListType {
    Ordered,
    Unordered,
}

export interface OrderedListProperties {
    start: number;
}

export interface OrderedListParameters {
    start?: number;
}

export interface UnorderedListProperties {}

export interface UnorderedListParameters {}

export type ListTypeParameters =
    | ({
          listType: ListType.Ordered;
      } & OrderedListParameters)
    | ({
          listType: ListType.Unordered;
      } & UnorderedListParameters);

export type ListParameters<ChildNode extends Node> = ContainerParameters<
    ChildNode
> &
    ListTypeParameters;

export type ListBaseTypeProperties =
    | ({
          listType: ListType.Ordered;
      } & OrderedListProperties)
    | ({
          listType: ListType.Unordered;
      } & UnorderedListProperties);

export type ListBase<ChildNode extends Node> = ContainerBase<ChildNode> &
    ListBaseTypeProperties;

export function ListBase<ChildNode extends Node>(
    parameters: ListParameters<ChildNode>,
): ListBase<ChildNode> {
    const linkBaseTypeProperties: ListBaseTypeProperties =
        parameters.listType === ListType.Ordered
            ? { listType: ListType.Ordered, start: parameters.start ?? 1 }
            : { listType: ListType.Unordered };
    return {
        ...linkBaseTypeProperties,
        ...ContainerBase({ children: parameters.children }),
    };
}

export type ListNode<ChildNode extends Node> = ListBase<ChildNode> &
    Node & {
        type: CoreNodeType.List;
    };

export function ListNode<ChildNode extends Node>(
    parameters: ListParameters<ChildNode>,
): ListNode<ChildNode> {
    return {
        type: CoreNodeType.List,
        ...ListBase(parameters),
    };
}

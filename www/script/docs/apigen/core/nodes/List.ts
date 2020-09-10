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
          type: ListType.Ordered;
      } & OrderedListParameters)
    | ({
          type: ListType.Unordered;
      } & UnorderedListParameters);

export interface ListParameters<ChildNode extends Node>
    extends ContainerParameters<ChildNode> {
    listType: ListTypeParameters;
}

export type ListBaseTypeProperties =
    | ({
          type: ListType.Ordered;
      } & OrderedListProperties)
    | ({
          type: ListType.Unordered;
      } & UnorderedListProperties);

export interface ListBase<ChildNode extends Node>
    extends ContainerBase<ChildNode> {
    listType: ListBaseTypeProperties;
}

export function ListBase<ChildNode extends Node>(
    parameters: ListParameters<ChildNode>,
): ListBase<ChildNode> {
    return {
        listType:
            parameters.listType.type === ListType.Ordered
                ? {
                      type: ListType.Ordered,
                      start: parameters.listType.start ?? 1,
                  }
                : { type: ListType.Unordered },
        ...ContainerBase({ children: parameters.children }),
    };
}

export interface ListNode<ChildNode extends Node>
    extends ListBase<ChildNode>,
        Node {
    type: CoreNodeType.List;
}

export function ListNode<ChildNode extends Node>(
    parameters: ListParameters<ChildNode>,
): ListNode<ChildNode> {
    return {
        type: CoreNodeType.List,
        ...ListBase(parameters),
    };
}

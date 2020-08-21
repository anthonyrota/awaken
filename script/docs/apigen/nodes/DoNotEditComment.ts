import { Node, CoreNodeType } from '.';

export interface DoNotEditCommentParameters {}

export interface DoNotEditCommentBase {}

export function DoNotEditCommentBase(
    _parameters: DoNotEditCommentParameters,
): DoNotEditCommentBase {
    return {};
}

export interface DoNotEditCommentNode extends DoNotEditCommentBase, Node {
    type: CoreNodeType.DoNotEditComment;
}

export function DoNotEditCommentNode(
    parameters: DoNotEditCommentParameters,
): DoNotEditCommentNode {
    return {
        type: CoreNodeType.DoNotEditComment,
        ...DoNotEditCommentBase(parameters),
    };
}

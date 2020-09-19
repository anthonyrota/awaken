import { Node } from '../../../nodes';
import { RenderMarkdownNodeType } from '.';

export interface DoNotEditCommentParameters {}

export interface DoNotEditCommentBase {}

export function DoNotEditCommentBase(
    _parameters: DoNotEditCommentParameters,
): DoNotEditCommentBase {
    return {};
}

export interface DoNotEditCommentNode extends DoNotEditCommentBase, Node {
    type: RenderMarkdownNodeType.DoNotEditComment;
}

export function DoNotEditCommentNode(
    parameters: DoNotEditCommentParameters,
): DoNotEditCommentNode {
    return {
        type: RenderMarkdownNodeType.DoNotEditComment,
        ...DoNotEditCommentBase(parameters),
    };
}

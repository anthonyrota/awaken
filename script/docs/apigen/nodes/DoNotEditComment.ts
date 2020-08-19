import { Node, CoreNodeType } from '.';

export interface DoNotEditComment extends Node {
    type: CoreNodeType.DoNotEditComment;
}

export function DoNotEditComment(): DoNotEditComment {
    return {
        type: CoreNodeType.DoNotEditComment,
    };
}

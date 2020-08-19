import { Node, CoreNodeType } from '.';

export interface HtmlComment extends Node {
    type: CoreNodeType.HtmlComment;
    comment: string;
    persist: boolean;
}

export interface HtmlCommentParameters {
    comment: string;
    persist?: boolean;
}

export function HtmlComment(parameters: HtmlCommentParameters): HtmlComment {
    return {
        type: CoreNodeType.HtmlComment,
        comment: parameters.comment,
        persist: parameters.persist ?? false,
    };
}

import { Node, CoreNodeType } from '.';

export interface HtmlCommentParameters {
    comment: string;
    persist?: boolean;
}

export interface HtmlCommentBase {
    comment: string;
    persist: boolean;
}

export function HtmlCommentBase(
    parameters: HtmlCommentParameters,
): HtmlCommentBase {
    return {
        comment: parameters.comment,
        persist: parameters.persist ?? false,
    };
}

export interface HtmlCommentNode extends HtmlCommentBase, Node {
    type: CoreNodeType.HtmlComment;
}

export function HtmlCommentNode(
    parameters: HtmlCommentParameters,
): HtmlCommentNode {
    return {
        type: CoreNodeType.HtmlComment,
        ...HtmlCommentBase(parameters),
    };
}

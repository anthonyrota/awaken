import { MarkdownOutput } from './MarkdownOutput';
import { HtmlCommentBase } from './nodes/HtmlComment';
import { ParamWriteRenderMarkdownNode } from '.';

export function writeHtmlComment(
    commentNode: HtmlCommentBase,
    output: MarkdownOutput,
    _writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
): void {
    if (commentNode.persist) {
        output.write('<!--');
        output.write(commentNode.comment);
        output.write('-->');
        return;
    }
    throw new Error(
        'Attempted to write a HtmlComment node to output. HtmlComment nodes are only used for metadata when parsing TSDoc comments.',
    );
}

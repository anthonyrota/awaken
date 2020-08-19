import { HtmlComment } from '../../nodes/HtmlComment';
import { MarkdownOutput } from './MarkdownOutput';

export function writeHtmlComment(
    commentNode: HtmlComment,
    output: MarkdownOutput,
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

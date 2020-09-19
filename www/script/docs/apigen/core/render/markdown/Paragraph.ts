import { Node } from '../../nodes';
import { HtmlElementNode } from '../../nodes/HtmlElement';
import { ParagraphBase } from '../../nodes/Paragraph';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteChildNode, ParamWriteRenderMarkdownNode } from '.';

export function writeParagraph<ChildNode extends Node>(
    paragraph: ParagraphBase<ChildNode>,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    writeRenderMarkdownNode(
        HtmlElementNode<ChildNode>({
            tagName: 'p',
            children: paragraph.children,
        }),
        output,
        writeChildNode,
    );
}

import { Node } from '../../nodes';
import { HtmlElementNode } from '../../nodes/HtmlElement';
import { ParagraphNode } from '../../nodes/Paragraph';
import { TitleBase } from '../../nodes/Title';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteChildNode, ParamWriteRenderMarkdownNode } from '.';

export function writeTitle<ChildNode extends Node>(
    title: TitleBase<ChildNode>,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    writeRenderMarkdownNode(
        ParagraphNode({
            children: [
                HtmlElementNode({
                    tagName: 'b',
                    children: title.children,
                }),
            ],
        }),
        output,
        (node) => writeRenderMarkdownNode(node, output, writeChildNode),
    );
}

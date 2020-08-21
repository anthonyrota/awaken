import { Node } from '../../nodes';
import { HtmlElementNode } from '../../nodes/HtmlElement';
import { ParagraphNode } from '../../nodes/Paragraph';
import { TitleBase } from '../../nodes/Title';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteChildNode, ParamWriteCoreNode } from '.';

export function writeTitle<ChildNode extends Node>(
    title: TitleBase<ChildNode>,
    output: MarkdownOutput,
    writeCoreNode: ParamWriteCoreNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    writeCoreNode(
        ParagraphNode({
            children: [
                HtmlElementNode({
                    tagName: 'b',
                    children: title.children,
                }),
            ],
        }),
        output,
        (node) => writeCoreNode(node, output, writeChildNode),
    );
}

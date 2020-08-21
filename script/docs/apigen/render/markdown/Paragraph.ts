import { Node } from '../../nodes';
import { HtmlElementNode } from '../../nodes/HtmlElement';
import { ParagraphBase } from '../../nodes/Paragraph';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteChildNode, ParamWriteCoreNode } from '.';

export function writeParagraph<ChildNode extends Node>(
    paragraph: ParagraphBase<ChildNode>,
    output: MarkdownOutput,
    writeCoreNode: ParamWriteCoreNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    writeCoreNode(
        HtmlElementNode<ChildNode>({
            tagName: 'p',
            children: paragraph.children,
        }),
        output,
        writeChildNode,
    );
}

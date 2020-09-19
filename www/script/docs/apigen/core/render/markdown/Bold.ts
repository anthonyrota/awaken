import { Node } from '../../nodes';
import { BoldBase } from '../../nodes/Bold';
import { HtmlElementNode } from '../../nodes/HtmlElement';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteChildNode, ParamWriteRenderMarkdownNode } from '.';

export function writeBold<ChildNode extends Node>(
    bold: BoldBase<ChildNode>,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    writeRenderMarkdownNode(
        HtmlElementNode<ChildNode>({
            tagName: 'b',
            children: bold.children,
        }),
        output,
        writeChildNode,
    );
}

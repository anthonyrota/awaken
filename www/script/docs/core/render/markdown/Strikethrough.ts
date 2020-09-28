import { Node } from '../../nodes';
import { HtmlElementNode } from '../../nodes/HtmlElement';
import { StrikethroughBase } from '../../nodes/Strikethrough';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteChildNode, ParamWriteRenderMarkdownNode } from '.';

export function writeStrikethrough<ChildNode extends Node>(
    Strikethrough: StrikethroughBase<ChildNode>,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    writeRenderMarkdownNode(
        HtmlElementNode<ChildNode>({
            tagName: 's',
            children: Strikethrough.children,
        }),
        output,
        writeChildNode,
    );
}

import { Node } from '../../nodes';
import { HtmlElementNode } from '../../nodes/HtmlElement';
import { SubscriptBase } from '../../nodes/Subscript';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteChildNode, ParamWriteRenderMarkdownNode } from '.';

export function writeSubscript<ChildNode extends Node>(
    subscript: SubscriptBase<ChildNode>,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    writeRenderMarkdownNode(
        HtmlElementNode<ChildNode>({
            tagName: 'sub',
            children: subscript.children,
        }),
        output,
        writeChildNode,
    );
}

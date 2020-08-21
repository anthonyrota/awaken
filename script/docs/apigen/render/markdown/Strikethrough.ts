import { Node } from '../../nodes';
import { HtmlElementNode } from '../../nodes/HtmlElement';
import { StrikethroughBase } from '../../nodes/Strikethrough';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteChildNode, ParamWriteCoreNode } from '.';

export function writeStrikethrough<ChildNode extends Node>(
    Strikethrough: StrikethroughBase<ChildNode>,
    output: MarkdownOutput,
    writeCoreNode: ParamWriteCoreNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    writeCoreNode(
        HtmlElementNode<ChildNode>({
            tagName: 's',
            children: Strikethrough.children,
        }),
        output,
        writeChildNode,
    );
}

import { Node } from '../../nodes';
import { CodeSpanBase } from '../../nodes/CodeSpan';
import { HtmlElementNode } from '../../nodes/HtmlElement';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteRenderMarkdownNode, ParamWriteChildNode } from '.';

export function writeCodeSpan<ChildNode extends Node>(
    codeSpan: CodeSpanBase<ChildNode>,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    output.withInSingleLine(() => {
        writeRenderMarkdownNode(
            HtmlElementNode({
                tagName: 'code',
                children: codeSpan.children,
            }),
            output,
            writeChildNode,
        );
    });
}

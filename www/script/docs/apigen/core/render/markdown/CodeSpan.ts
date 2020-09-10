import { Node } from '../../nodes';
import { CodeSpanBase } from '../../nodes/CodeSpan';
import { HtmlElementNode } from '../../nodes/HtmlElement';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteCoreNode, ParamWriteChildNode } from '.';

export function writeCodeSpan<ChildNode extends Node>(
    codeSpan: CodeSpanBase<ChildNode>,
    output: MarkdownOutput,
    writeCoreNode: ParamWriteCoreNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    output.withInSingleLine(() => {
        writeCoreNode(
            HtmlElementNode({
                tagName: 'code',
                children: codeSpan.children,
            }),
            output,
            writeChildNode,
        );
    });
}

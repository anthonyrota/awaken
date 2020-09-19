import { Node } from '../../nodes';
import { BlockQuoteBase } from '../../nodes/BlockQuote';
import { ContainerNode } from '../../nodes/Container';
import { HtmlElementNode } from '../../nodes/HtmlElement';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteChildNode, ParamWriteRenderMarkdownNode } from '.';

export function writeBlockQuote<ChildNode extends Node>(
    blockQuote: BlockQuoteBase<ChildNode>,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    if (output.constrainedToSingleLine) {
        writeRenderMarkdownNode(
            HtmlElementNode<ChildNode>({
                tagName: 'blockquote',
                children: blockQuote.children,
            }),
            output,
            writeChildNode,
        );
        return;
    }
    output.withParagraphBreak(() => {
        output.withIndent('> ', () =>
            writeRenderMarkdownNode(
                ContainerNode({ children: blockQuote.children }),
                output,
                writeChildNode,
            ),
        );
    });
}

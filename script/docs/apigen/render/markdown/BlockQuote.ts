import { Node } from '../../nodes';
import { BlockQuoteBase } from '../../nodes/BlockQuote';
import { HtmlElementNode } from '../../nodes/HtmlElement';
import { ContainerNode } from './../../nodes/Container';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteChildNode, ParamWriteCoreNode } from '.';

export function writeBlockQuote<ChildNode extends Node>(
    blockQuote: BlockQuoteBase<ChildNode>,
    output: MarkdownOutput,
    writeCoreNode: ParamWriteCoreNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    if (output.constrainedToSingleLine) {
        writeCoreNode(
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
            writeCoreNode(
                ContainerNode({ children: blockQuote.children }),
                output,
                writeChildNode,
            ),
        );
    });
}

import { addChildrenC } from '../../nodes/abstract/ContainerBase';
import { HtmlElement } from '../../nodes/HtmlElement';
import { BlockQuote } from '../../nodes/BlockQuote';
import { Node } from '../../nodes';
import { MarkdownOutput } from './MarkdownOutput';
import { writeContainerBase } from './ContainerBase';
import { writeHtmlElement } from './HtmlElement';

export function writeBlockQuote<ChildNode extends Node>(
    blockQuote: BlockQuote<ChildNode>,
    output: MarkdownOutput,
    writeChildNode: (node: ChildNode, output: MarkdownOutput) => void,
): void {
    if (output.constrainedToSingleLine) {
        writeHtmlElement(
            addChildrenC(
                HtmlElement<ChildNode>({ tagName: 'blockquote' }),
                ...blockQuote.children,
            ),
            output,
            writeChildNode,
        );
        return;
    }
    output.withParagraphBreak(() => {
        output.withIndent('> ', () =>
            writeContainerBase(blockQuote, output, writeChildNode),
        );
    });
}

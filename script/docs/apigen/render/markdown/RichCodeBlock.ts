import { addChildrenC } from '../../nodes/abstract/ContainerBase';
import { HtmlElement } from '../../nodes/HtmlElement';
import { RichCodeBlock } from '../../nodes/RichCodeBlock';
import { Node } from '../../nodes';
import { MarkdownOutput } from './MarkdownOutput';
import { writeHtmlElement } from './HtmlElement';

export function writeRichCodeBlock<ChildNode extends Node>(
    richCodeBlock: RichCodeBlock<ChildNode>,
    output: MarkdownOutput,
    writeChildNode: (node: ChildNode, output: MarkdownOutput) => void,
): void {
    if (output.constrainedToSingleLine) {
        output.withInSingleLineCodeBlock(() => {
            writeHtmlElement(
                addChildrenC(
                    HtmlElement<ChildNode>({ tagName: 'code' }),
                    ...richCodeBlock.children,
                ),
                output,
                writeChildNode,
            );
        });
        return;
    }

    writeHtmlElement(
        addChildrenC(
            HtmlElement<ChildNode>({ tagName: 'pre' }),
            ...richCodeBlock.children,
        ),
        output,
        writeChildNode,
    );
}

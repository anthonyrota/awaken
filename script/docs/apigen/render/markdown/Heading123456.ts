import {
    MarkdownFunctionalNode,
    writeMarkdownFunctionalNode,
} from './MarkdownFunctionalNode';
import { addChildrenC } from '../../nodes/abstract/ContainerBase';
import { HtmlElement } from '../../nodes/HtmlElement';
import { Heading123456 } from '../../nodes/Heading123456';
import { Node } from '../../nodes';
import { MarkdownOutput } from './MarkdownOutput';
import { writeHtmlElement } from './HtmlElement';
import { noop } from '../../util';
import { writeContainerBase } from './ContainerBase';

function writeInsides<ChildNode extends Node>(
    heading123456: Heading123456<ChildNode>,
    output: MarkdownOutput,

    writeChildNode: (node: ChildNode, output: MarkdownOutput) => void,
): void {
    output.withInSingleLine(() => {
        if (heading123456.alternateId) {
            writeHtmlElement(
                HtmlElement({
                    tagName: 'a',
                    attributes: { name: heading123456.alternateId },
                }),
                output,
                noop,
            );
        }
        writeContainerBase(heading123456, output, writeChildNode);
    });
}

export function writeHeading123456<ChildNode extends Node>(
    heading123456: Heading123456<ChildNode>,
    output: MarkdownOutput,
    writeChildNode: (node: ChildNode, output: MarkdownOutput) => void,
): void {
    if (output.constrainedToSingleLine) {
        writeHtmlElement(
            addChildrenC(
                HtmlElement<MarkdownFunctionalNode>({
                    tagName: `h${heading123456.level}`,
                }),
                MarkdownFunctionalNode({
                    write(): void {
                        writeInsides(heading123456, output, writeChildNode);
                    },
                }),
            ),
            output,
            writeMarkdownFunctionalNode,
        );
        return;
    }

    output.withParagraphBreak(() => {
        output.write(`${'#'.repeat(heading123456.level)} `);
        writeInsides(heading123456, output, writeChildNode);
    });
}

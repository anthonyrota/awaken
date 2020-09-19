import { noop } from '../../../util/noop';
import { Node } from '../../nodes';
import { ContainerNode } from '../../nodes/Container';
import { Heading123456Base } from '../../nodes/Heading123456';
import { HtmlElementNode } from '../../nodes/HtmlElement';
import { MarkdownOutput } from './MarkdownOutput';
import { FunctionalNode } from './nodes/FunctionalNode';
import {
    ParamWriteChildNode,
    ParamWriteRenderMarkdownNode,
    writeDeepRenderMarkdownNode,
} from '.';

function writeInsides<ChildNode extends Node>(
    heading123456: Heading123456Base<ChildNode>,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    output.withInSingleLine(() => {
        if (heading123456.alternateId) {
            writeRenderMarkdownNode(
                HtmlElementNode({
                    tagName: 'a',
                    attributes: { name: heading123456.alternateId },
                }),
                output,
                noop,
            );
        }
        writeRenderMarkdownNode(
            ContainerNode({ children: heading123456.children }),
            output,
            writeChildNode,
        );
    });
}

export function writeHeading123456<ChildNode extends Node>(
    heading123456: Heading123456Base<ChildNode>,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    if (output.constrainedToSingleLine) {
        writeDeepRenderMarkdownNode(
            HtmlElementNode({
                tagName: `h${heading123456.level}`,
                children: [
                    FunctionalNode({
                        write(): void {
                            writeInsides(
                                heading123456,
                                output,
                                writeRenderMarkdownNode,
                                writeChildNode,
                            );
                        },
                    }),
                ],
            }),
            output,
            writeRenderMarkdownNode,
        );
        return;
    }
    output.withParagraphBreak(() => {
        output.write(`${'#'.repeat(heading123456.level)} `);
        writeInsides(
            heading123456,
            output,
            writeRenderMarkdownNode,
            writeChildNode,
        );
    });
}

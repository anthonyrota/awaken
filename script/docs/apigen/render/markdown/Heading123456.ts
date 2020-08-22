import { Node } from '../../nodes';
import { ContainerNode } from '../../nodes/Container';
import { Heading123456Base } from '../../nodes/Heading123456';
import { HtmlElementNode } from '../../nodes/HtmlElement';
import { noop } from '../../util/noop';
import {
    MarkdownFunctionalNode,
    writeMarkdownFunctionalNode,
} from './MarkdownFunctionalNode';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteChildNode, ParamWriteCoreNode } from '.';

function writeInsides<ChildNode extends Node>(
    heading123456: Heading123456Base<ChildNode>,
    output: MarkdownOutput,
    writeCoreNode: ParamWriteCoreNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    output.withInSingleLine(() => {
        if (heading123456.alternateId) {
            writeCoreNode(
                HtmlElementNode({
                    tagName: 'a',
                    attributes: { name: heading123456.alternateId },
                }),
                output,
                noop,
            );
        }
        writeCoreNode(
            ContainerNode({ children: heading123456.children }),
            output,
            writeChildNode,
        );
    });
}

export function writeHeading123456<ChildNode extends Node>(
    heading123456: Heading123456Base<ChildNode>,
    output: MarkdownOutput,
    writeCoreNode: ParamWriteCoreNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    if (output.constrainedToSingleLine) {
        writeCoreNode(
            HtmlElementNode<MarkdownFunctionalNode>({
                tagName: `h${heading123456.level}`,
                children: [
                    MarkdownFunctionalNode({
                        write(): void {
                            writeInsides(
                                heading123456,
                                output,
                                writeCoreNode,
                                writeChildNode,
                            );
                        },
                    }),
                ],
            }),
            output,
            writeMarkdownFunctionalNode,
        );
        return;
    }
    output.withParagraphBreak(() => {
        output.write(`${'#'.repeat(heading123456.level)} `);
        writeInsides(heading123456, output, writeCoreNode, writeChildNode);
    });
}

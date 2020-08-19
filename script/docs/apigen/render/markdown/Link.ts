import { addChildrenC } from '../../nodes/abstract/ContainerBase';
import { HtmlElement } from '../../nodes/HtmlElement';
import { Link } from '../../nodes/Link';
import { Node } from '../../nodes';
import { MarkdownOutput } from './MarkdownOutput';
import { writeHtmlElement } from './HtmlElement';
import { writeContainerBase } from './ContainerBase';
import { writePlainText } from './PlainText';
import { PlainText } from '../../nodes/PlainText';

export function writeLink<ChildNode extends Node>(
    link: Link<ChildNode>,
    output: MarkdownOutput,
    writeChildNode: (node: ChildNode, output: MarkdownOutput) => void,
): void {
    output.withInSingleLine(() => {
        if (output.inHtmlBlockTag && !output.inTable) {
            const attributes: Record<string, string> = {
                href: link.destination,
            };
            if (link.title !== undefined) {
                attributes.title = link.title;
            }
            writeHtmlElement(
                addChildrenC(
                    HtmlElement<ChildNode>({ tagName: 'a', attributes }),
                    ...link.children,
                ),
                output,
                writeChildNode,
            );
            return;
        }
        output.write('[');
        writeContainerBase(link, output, writeChildNode);
        output.write('](');
        writePlainText(PlainText({ text: link.destination }), output);
        if (link.title) {
            output.write(' "');
            writePlainText(PlainText({ text: link.title }), output);
            output.write('"');
        }
        output.write(')');
    });
}

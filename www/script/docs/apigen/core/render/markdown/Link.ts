import { Node } from '../../nodes';
import { ContainerNode } from '../../nodes/Container';
import { HtmlElementNode } from '../../nodes/HtmlElement';
import { LinkBase } from '../../nodes/Link';
import { PlainTextNode } from '../../nodes/PlainText';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteChildNode, ParamWriteRenderMarkdownNode } from '.';

export function writeLink<ChildNode extends Node>(
    link: LinkBase<ChildNode>,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    output.withInSingleLine(() => {
        if (output.inHtmlBlockTag && !output.inTable) {
            const attributes: Record<string, string> = {
                href: link.destination,
            };
            if (link.title !== undefined) {
                attributes.title = link.title;
            }
            writeRenderMarkdownNode(
                HtmlElementNode<ChildNode>({
                    tagName: 'a',
                    attributes,
                    children: link.children,
                }),
                output,
                writeChildNode,
            );
            return;
        }
        output.write('[');
        writeRenderMarkdownNode(
            ContainerNode({ children: link.children }),
            output,
            writeChildNode,
        );
        output.write('](');
        writeRenderMarkdownNode(
            PlainTextNode({ text: link.destination }),
            output,
        );
        if (link.title) {
            output.write(' "');
            writeRenderMarkdownNode(
                PlainTextNode({ text: link.title }),
                output,
            );
            output.write('"');
        }
        output.write(')');
    });
}

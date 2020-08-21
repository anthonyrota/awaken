import { Node } from '../../nodes';
import { ContainerNode } from '../../nodes/Container';
import { HtmlElementNode } from '../../nodes/HtmlElement';
import { LinkBase } from '../../nodes/Link';
import { PlainTextNode } from '../../nodes/PlainText';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteChildNode, ParamWriteCoreNode } from '.';

export function writeLink<ChildNode extends Node>(
    link: LinkBase<ChildNode>,
    output: MarkdownOutput,
    writeCoreNode: ParamWriteCoreNode,
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
            writeCoreNode(
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
        writeCoreNode(
            ContainerNode({ children: link.children }),
            output,
            writeChildNode,
        );
        output.write('](');
        writeCoreNode(PlainTextNode({ text: link.destination }), output);
        if (link.title) {
            output.write(' "');
            writeCoreNode(PlainTextNode({ text: link.title }), output);
            output.write('"');
        }
        output.write(')');
    });
}

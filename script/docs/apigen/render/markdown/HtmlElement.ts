import { Node } from '../../nodes';
import { ContainerNode } from '../../nodes/Container';
import {
    HtmlElementBase,
    HtmlTagClassification,
    getHtmlTagClassification,
} from '../../nodes/HtmlElement';
import { PlainTextNode } from '../../nodes/PlainText';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteChildNode, ParamWriteCoreNode } from '.';

function writeStartTag(
    htmlElement: HtmlElementBase<Node>,
    output: MarkdownOutput,
    writeCoreNode: ParamWriteCoreNode,
): void {
    output.write('<');
    writeCoreNode(PlainTextNode({ text: htmlElement.tagName }), output);
    if (htmlElement.attributes) {
        for (const [attributeName, attributeValue] of Object.entries(
            htmlElement.attributes,
        )) {
            output.write(' ');
            output.write(attributeName);
            output.write('="');
            writeCoreNode(PlainTextNode({ text: attributeValue }), output);
            output.write('"');
        }
    }
    output.write('>');
}

function writeEndTag(
    htmlElement: HtmlElementBase<Node>,
    output: MarkdownOutput,
    writeCoreNode: ParamWriteCoreNode,
): void {
    output.write('</');
    writeCoreNode(PlainTextNode({ text: htmlElement.tagName }), output);
    output.write('>');
}

function writeAsBlockElement<ChildNode extends Node>(
    htmlElement: HtmlElementBase<ChildNode>,
    output: MarkdownOutput,
    writeCoreNode: ParamWriteCoreNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    writeStartTag(htmlElement, output, writeCoreNode);
    output.markStartOfParagraph();
    output.withInHtmlBlockTag(() => {
        writeCoreNode(
            ContainerNode({ children: htmlElement.children }),
            output,
            writeChildNode,
        );
    });
    writeEndTag(htmlElement, output, writeCoreNode);
}

export function writeHtmlElement<ChildNode extends Node>(
    htmlElement: HtmlElementBase<ChildNode>,
    output: MarkdownOutput,
    writeCoreNode: ParamWriteCoreNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
) {
    const classification = getHtmlTagClassification(htmlElement.tagName);
    if (classification === HtmlTagClassification.Block) {
        if (htmlElement.tagName === 'p') {
            output.withParagraphBreak(() => {
                writeCoreNode(
                    ContainerNode({ children: htmlElement.children }),
                    output,
                    writeChildNode,
                );
            });
            return;
        }
        if (output.constrainedToSingleLine) {
            writeAsBlockElement(
                htmlElement,
                output,
                writeCoreNode,
                writeChildNode,
            );
        } else {
            output.withParagraphBreak(() => {
                writeAsBlockElement(
                    htmlElement,
                    output,
                    writeCoreNode,
                    writeChildNode,
                );
            });
        }
        return;
    }
    if (classification === HtmlTagClassification.SelfClosing) {
        writeStartTag(htmlElement, output, writeCoreNode);
        return;
    }
    // If marked new paragraph -> opening inline html shouldn't affect.
    output.withWritingInlineHtmlTag(() => {
        writeStartTag(htmlElement, output, writeCoreNode);
    });
    writeCoreNode(
        ContainerNode({ children: htmlElement.children }),
        output,
        writeChildNode,
    );
    writeEndTag(htmlElement, output, writeCoreNode);
}

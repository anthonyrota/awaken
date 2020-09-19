import { Node } from '../../nodes';
import { ContainerNode } from '../../nodes/Container';
import {
    HtmlElementBase,
    HtmlTagClassification,
    getHtmlTagClassification,
} from '../../nodes/HtmlElement';
import { PlainTextNode } from '../../nodes/PlainText';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteChildNode, ParamWriteRenderMarkdownNode } from '.';

function writeStartTag(
    htmlElement: HtmlElementBase<Node>,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
): void {
    output.write('<');
    writeRenderMarkdownNode(
        PlainTextNode({ text: htmlElement.tagName }),
        output,
    );
    if (htmlElement.attributes) {
        for (const [attributeName, attributeValue] of Object.entries(
            htmlElement.attributes,
        )) {
            output.write(' ');
            output.write(attributeName);
            output.write('="');
            writeRenderMarkdownNode(
                PlainTextNode({ text: attributeValue }),
                output,
            );
            output.write('"');
        }
    }
    output.write('>');
}

function writeEndTag(
    htmlElement: HtmlElementBase<Node>,
    output: MarkdownOutput,
    writeRenderMarkdownMode: ParamWriteRenderMarkdownNode,
): void {
    output.write('</');
    writeRenderMarkdownMode(
        PlainTextNode({ text: htmlElement.tagName }),
        output,
    );
    output.write('>');
}

function writeAsBlockElement<ChildNode extends Node>(
    htmlElement: HtmlElementBase<ChildNode>,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    writeStartTag(htmlElement, output, writeRenderMarkdownNode);
    output.markStartOfParagraph();
    output.withInHtmlBlockTag(() => {
        writeRenderMarkdownNode(
            ContainerNode({ children: htmlElement.children }),
            output,
            writeChildNode,
        );
    });
    writeEndTag(htmlElement, output, writeRenderMarkdownNode);
}

export function writeHtmlElement<ChildNode extends Node>(
    htmlElement: HtmlElementBase<ChildNode>,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
) {
    const classification = getHtmlTagClassification(htmlElement.tagName);
    if (classification === HtmlTagClassification.Block) {
        if (htmlElement.tagName === 'p') {
            output.withParagraphBreak(() => {
                writeRenderMarkdownNode(
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
                writeRenderMarkdownNode,
                writeChildNode,
            );
        } else {
            output.withParagraphBreak(() => {
                writeAsBlockElement(
                    htmlElement,
                    output,
                    writeRenderMarkdownNode,
                    writeChildNode,
                );
            });
        }
        return;
    }
    if (classification === HtmlTagClassification.SelfClosing) {
        writeStartTag(htmlElement, output, writeRenderMarkdownNode);
        return;
    }
    // If marked new paragraph -> opening inline html shouldn't affect.
    output.withWritingInlineHtmlTag(() => {
        writeStartTag(htmlElement, output, writeRenderMarkdownNode);
    });
    writeRenderMarkdownNode(
        ContainerNode({ children: htmlElement.children }),
        output,
        writeChildNode,
    );
    writeEndTag(htmlElement, output, writeRenderMarkdownNode);
}

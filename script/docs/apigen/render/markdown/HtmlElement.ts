import { PlainText } from '../../nodes/PlainText';
import {
    HtmlElement,
    HtmlTagClassification,
    getHtmlTagClassification,
} from '../../nodes/HtmlElement';
import { Node } from '../../nodes';
import { MarkdownOutput } from './MarkdownOutput';
import { writeContainerBase } from './ContainerBase';
import { writePlainText } from './PlainText';

function writeStartTag(
    htmlElement: HtmlElement<Node>,
    output: MarkdownOutput,
): void {
    output.write('<');
    writePlainText(PlainText({ text: htmlElement.tagName }), output);
    if (htmlElement.attributes) {
        for (const [attributeName, attributeValue] of Object.entries(
            htmlElement.attributes,
        )) {
            output.write(' ');
            output.write(attributeName);
            output.write('="');
            writePlainText(PlainText({ text: attributeValue }), output);
            output.write('"');
        }
    }
    output.write('>');
}

function writeEndTag(
    htmlElement: HtmlElement<Node>,
    output: MarkdownOutput,
): void {
    output.write('</');
    writePlainText(PlainText({ text: htmlElement.tagName }), output);
    output.write('>');
}

function writeAsBlockElement<ChildNode extends Node>(
    htmlElement: HtmlElement<ChildNode>,
    output: MarkdownOutput,
    writeChildNode: (node: ChildNode, output: MarkdownOutput) => void,
): void {
    writeStartTag(htmlElement, output);
    output.markStartOfParagraph();
    output.withInHtmlBlockTag(() => {
        writeContainerBase(htmlElement, output, writeChildNode);
    });
    writeEndTag(htmlElement, output);
}

export function writeVoidHtmlElement(
    htmlElement: HtmlElement<never>,
    output: MarkdownOutput,
): void {
    if (
        getHtmlTagClassification(htmlElement.tagName) !==
        HtmlTagClassification.SelfClosing
    ) {
        throw new Error(
            `Provided html element is not void: ${htmlElement.tagName}`,
        );
    }
    writeStartTag(htmlElement, output);
}

export function writeHtmlElement<ChildNode extends Node>(
    htmlElement: HtmlElement<ChildNode>,
    output: MarkdownOutput,
    writeChildNode: (node: ChildNode, output: MarkdownOutput) => void,
) {
    const classification = getHtmlTagClassification(htmlElement.tagName);
    if (classification === HtmlTagClassification.Block) {
        if (htmlElement.tagName === 'p') {
            output.withParagraphBreak(() => {
                writeContainerBase(htmlElement, output, writeChildNode);
            });
            return;
        }
        if (output.constrainedToSingleLine) {
            writeAsBlockElement(htmlElement, output, writeChildNode);
        } else {
            output.withParagraphBreak(() => {
                writeAsBlockElement(htmlElement, output, writeChildNode);
            });
        }
        return;
    }
    if (classification === HtmlTagClassification.SelfClosing) {
        writeStartTag(htmlElement, output);
        return;
    }
    // If marked new paragraph -> opening inline html shouldn't affect.
    output.withWritingInlineHtmlTag(() => {
        writeStartTag(htmlElement, output);
    });
    writeContainerBase(htmlElement, output, writeChildNode);
    writeEndTag(htmlElement, output);
}

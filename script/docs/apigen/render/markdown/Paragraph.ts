import { addChildrenC } from '../../nodes/abstract/ContainerBase';
import { HtmlElement } from '../../nodes/HtmlElement';
import { Paragraph } from '../../nodes/Paragraph';
import { Node } from '../../nodes';
import { MarkdownOutput } from './MarkdownOutput';
import { writeHtmlElement } from './HtmlElement';

export function writeParagraph<ChildNode extends Node>(
    paragraph: Paragraph<ChildNode>,
    output: MarkdownOutput,
    writeChildNode: (node: ChildNode, output: MarkdownOutput) => void,
): void {
    writeHtmlElement(
        addChildrenC(
            HtmlElement<ChildNode>({ tagName: 'p' }),
            ...paragraph.children,
        ),
        output,
        writeChildNode,
    );
}

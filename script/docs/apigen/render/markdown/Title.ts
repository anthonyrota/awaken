import { Paragraph } from '../../nodes/Paragraph';
import { addChildrenC } from '../../nodes/abstract/ContainerBase';
import { HtmlElement } from '../../nodes/HtmlElement';
import { Title } from '../../nodes/Title';
import { Node } from '../../nodes';
import { MarkdownOutput } from './MarkdownOutput';
import { writeHtmlElement } from './HtmlElement';
import { writeParagraph } from './Paragraph';

export function writeTitle<ChildNode extends Node>(
    title: Title<ChildNode>,
    output: MarkdownOutput,
    writeChildNode: (node: ChildNode, output: MarkdownOutput) => void,
): void {
    writeParagraph(
        addChildrenC(
            Paragraph<HtmlElement<ChildNode>>(),
            addChildrenC(
                HtmlElement<ChildNode>({ tagName: 'b' }),
                ...title.children,
            ),
        ),
        output,
        (node) => writeHtmlElement(node, output, writeChildNode),
    );
}

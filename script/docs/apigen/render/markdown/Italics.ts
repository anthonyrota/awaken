import { addChildrenC } from '../../nodes/abstract/ContainerBase';
import { HtmlElement } from '../../nodes/HtmlElement';
import { Italics } from '../../nodes/Italics';
import { Node } from '../../nodes';
import { MarkdownOutput } from './MarkdownOutput';
import { writeHtmlElement } from './HtmlElement';

export function writeItalics<ChildNode extends Node>(
    italics: Italics<ChildNode>,
    output: MarkdownOutput,
    writeChildNode: (node: ChildNode, output: MarkdownOutput) => void,
): void {
    writeHtmlElement(
        addChildrenC(
            HtmlElement<ChildNode>({ tagName: 'i' }),
            ...italics.children,
        ),
        output,
        writeChildNode,
    );
}

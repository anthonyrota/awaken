import { addChildrenC } from '../../nodes/abstract/ContainerBase';
import { HtmlElement } from '../../nodes/HtmlElement';
import { Strikethrough } from '../../nodes/Strikethrough';
import { Node } from '../../nodes';
import { MarkdownOutput } from './MarkdownOutput';
import { writeHtmlElement } from './HtmlElement';

export function writeStrikethrough<ChildNode extends Node>(
    strikethrough: Strikethrough<ChildNode>,
    output: MarkdownOutput,
    writeChildNode: (node: ChildNode, output: MarkdownOutput) => void,
): void {
    writeHtmlElement(
        addChildrenC(
            HtmlElement<ChildNode>({ tagName: 's' }),
            ...strikethrough.children,
        ),
        output,
        writeChildNode,
    );
}

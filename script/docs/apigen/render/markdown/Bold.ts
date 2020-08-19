import { addChildrenC } from '../../nodes/abstract/ContainerBase';
import { HtmlElement } from '../../nodes/HtmlElement';
import { Bold } from '../../nodes/Bold';
import { Node } from '../../nodes';
import { MarkdownOutput } from './MarkdownOutput';
import { writeHtmlElement } from './HtmlElement';

export function writeBold<ChildNode extends Node>(
    bold: Bold<ChildNode>,
    output: MarkdownOutput,
    writeChildNode: (node: ChildNode, output: MarkdownOutput) => void,
): void {
    writeHtmlElement(
        addChildrenC(
            HtmlElement<ChildNode>({ tagName: 'b' }),
            ...bold.children,
        ),
        output,
        writeChildNode,
    );
}

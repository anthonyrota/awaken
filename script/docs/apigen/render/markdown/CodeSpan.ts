import { addChildrenC } from '../../nodes/abstract/ContainerBase';
import { HtmlElement } from '../../nodes/HtmlElement';
import { CodeSpan } from '../../nodes/CodeSpan';
import { Node } from '../../nodes';
import { MarkdownOutput } from './MarkdownOutput';
import { writeHtmlElement } from './HtmlElement';

export function writeCodeSpan<ChildNode extends Node>(
    codeSpan: CodeSpan<ChildNode>,
    output: MarkdownOutput,
    writeChildNode: (node: ChildNode, output: MarkdownOutput) => void,
): void {
    output.withInSingleLine(() => {
        writeHtmlElement(
            addChildrenC(
                HtmlElement<ChildNode>({ tagName: 'code' }),
                ...codeSpan.children,
            ),
            output,
            writeChildNode,
        );
    });
}

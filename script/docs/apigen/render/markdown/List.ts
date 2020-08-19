import { addChildrenC, addChildren } from '../../nodes/abstract/ContainerBase';
import { HtmlElement } from '../../nodes/HtmlElement';
import { List } from '../../nodes/List';
import { Node } from '../../nodes';
import { MarkdownOutput } from './MarkdownOutput';
import { writeHtmlElement } from './HtmlElement';

function writeListItems<ChildNode extends Node>(
    list: List<ChildNode>,
    output: MarkdownOutput,
    writeChildNode: (node: ChildNode, output: MarkdownOutput) => void,
): void {
    for (const [i, child] of list.children.entries()) {
        if (i !== 0) {
            output.ensureNewLine();
        }
        const listMarker = list.ordered ? `${list.ordered.start + i}. ` : '- ';
        output.write(listMarker);
        output.withIndent(' '.repeat(listMarker.length), () => {
            output.markStartOfParagraph();
            output.withInListNode(() => writeChildNode(child, output));
        });
    }
}

export function writeList<ChildNode extends Node>(
    list: List<ChildNode>,
    output: MarkdownOutput,
    writeChildNode: (node: ChildNode, output: MarkdownOutput) => void,
): void {
    if (output.constrainedToSingleLine) {
        const htmlElement = list.ordered
            ? HtmlElement<HtmlElement<ChildNode>>({
                  tagName: 'ol',
                  attributes: { start: `${list.ordered.start}` },
              })
            : HtmlElement<HtmlElement<ChildNode>>({ tagName: 'ul' });
        for (const child of list.children) {
            addChildren(
                htmlElement,
                addChildrenC(
                    HtmlElement<ChildNode>({ tagName: 'li' }),
                    child,
                ),
            );
        }
        writeHtmlElement(htmlElement, output, (node) => {
            writeHtmlElement(node, output, writeChildNode);
        });
        return;
    }
    if (output.inListNode) {
        output.ensureNewLine();
        writeListItems(list, output, writeChildNode);
        return;
    }
    output.withParagraphBreak(() => {
        writeListItems(list, output, writeChildNode);
    });
}

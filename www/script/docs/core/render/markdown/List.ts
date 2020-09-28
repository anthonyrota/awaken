import { Node } from '../../nodes';
import { HtmlElementNode } from '../../nodes/HtmlElement';
import { ListBase, ListType } from '../../nodes/List';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteChildNode, ParamWriteRenderMarkdownNode } from '.';

function writeListItems<ChildNode extends Node>(
    list: ListBase<ChildNode>,
    output: MarkdownOutput,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    for (const [i, child] of list.children.entries()) {
        if (i !== 0) {
            output.ensureNewLine();
        }
        const listMarker =
            list.listType.type === ListType.Ordered
                ? `${list.listType.start + i}. `
                : '- ';
        output.write(listMarker);
        output.withIndent(' '.repeat(listMarker.length), () => {
            output.markStartOfParagraph();
            output.withInListNode(() => writeChildNode(child, output));
        });
    }
}

export function writeList<ChildNode extends Node>(
    list: ListBase<ChildNode>,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    if (output.constrainedToSingleLine) {
        const children = list.children.map((child) => {
            return HtmlElementNode({
                tagName: 'li',
                children: [child],
            });
        });
        const htmlElement =
            list.listType.type === ListType.Ordered
                ? HtmlElementNode({
                      tagName: 'ol',
                      attributes: { start: `${list.listType.start}` },
                      children,
                  })
                : HtmlElementNode({
                      tagName: 'ul',
                      children,
                  });
        writeRenderMarkdownNode(htmlElement, output, (node) => {
            writeRenderMarkdownNode(node, output, writeChildNode);
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

import {
    TableOfContentsInlineReference,
    TableOfContentsMainReference,
} from '../../../types';
import { DeepCoreNode } from '../../nodes';
import { CodeSpanNode } from '../../nodes/CodeSpan';
import { ContainerNode } from '../../nodes/Container';
import { ListNode, ListType } from '../../nodes/List';
import { LocalPageLinkNode } from '../../nodes/LocalPageLink';
import { PlainTextNode } from '../../nodes/PlainText';
import { MarkdownOutput } from './MarkdownOutput';
import { TableOfContentsListBase } from './nodes/TableOfContentsList';
import { ParamWriteRenderMarkdownNode, writeDeepRenderMarkdownNode } from '.';

function buildTableOfContentsLink(
    reference: TableOfContentsInlineReference,
    output: MarkdownOutput,
): DeepCoreNode {
    return LocalPageLinkNode<DeepCoreNode>({
        pageId: output.pageId,
        hash: reference.urlHashText,
        children: [
            CodeSpanNode<DeepCoreNode>({
                children: [PlainTextNode({ text: reference.text })],
            }),
        ],
    });
}

function buildTableOfContentsListItem(
    reference: TableOfContentsMainReference,
    output: MarkdownOutput,
): ContainerNode<DeepCoreNode> {
    const listItem = ContainerNode<DeepCoreNode>({
        children: [buildTableOfContentsLink(reference, output)],
    });
    if (reference.inlineReferences && reference.inlineReferences.length > 0) {
        listItem.children.push(PlainTextNode({ text: ' - ' }));
        for (const [
            i,
            inlineReference,
        ] of reference.inlineReferences.entries()) {
            if (i !== 0) {
                listItem.children.push(PlainTextNode({ text: ', ' }));
            }
            listItem.children.push(
                buildTableOfContentsLink(inlineReference, output),
            );
        }
    }
    return listItem;
}

function buildTableOfContentsList(
    tableOfContentsList: TableOfContentsListBase,
    output: MarkdownOutput,
    mainReferences: TableOfContentsMainReference[],
): ListNode<DeepCoreNode> {
    const contentsList = ListNode<DeepCoreNode>({
        listType: {
            type: ListType.Ordered,
        },
    });
    for (const mainReference of mainReferences) {
        const listItem = buildTableOfContentsListItem(mainReference, output);
        contentsList.children.push(listItem);
        if (mainReference.nestedReferences) {
            listItem.children.push(
                buildTableOfContentsList(
                    tableOfContentsList,
                    output,
                    mainReference.nestedReferences,
                ),
            );
        }
    }
    return contentsList;
}

export function writeTableOfContentsList(
    tableOfContentsList: TableOfContentsListBase,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
): void {
    writeDeepRenderMarkdownNode(
        buildTableOfContentsList(
            tableOfContentsList,
            output,
            tableOfContentsList.tableOfContents,
        ),
        output,
        writeRenderMarkdownNode,
    );
}

import {
    TableOfContentsInlineReference,
    TableOfContentsNestedReference,
} from '../../../types';
import { DeepCoreNode } from '../../nodes';
import { CodeSpanNode } from '../../nodes/CodeSpan';
import { ContainerNode } from '../../nodes/Container';
import { ListNode, ListType } from '../../nodes/List';
import { LocalPageLinkNode } from '../../nodes/LocalPageLink';
import { PlainTextNode } from '../../nodes/PlainText';
import { TableOfContentsListBase } from '../../nodes/TableOfContentsList';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteCoreNode, writeDeepCoreNode } from '.';

function buildTableOfContentsLink(
    reference: TableOfContentsInlineReference,
    relativePagePath: string,
): DeepCoreNode {
    return LocalPageLinkNode<DeepCoreNode>({
        destination: `${relativePagePath}#${reference.urlHashText}`,
        children: [
            CodeSpanNode<DeepCoreNode>({
                children: [PlainTextNode({ text: reference.text })],
            }),
        ],
    });
}

function buildTableOfContentsListItem(
    reference: TableOfContentsNestedReference,
    relativePagePath: string,
): ContainerNode<DeepCoreNode> {
    const listItem = ContainerNode<DeepCoreNode>({
        children: [buildTableOfContentsLink(reference, relativePagePath)],
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
                buildTableOfContentsLink(inlineReference, relativePagePath),
            );
        }
    }
    return listItem;
}

export function writeTableOfContentsList(
    tableOfContentsList: TableOfContentsListBase,
    output: MarkdownOutput,
    writeCoreNode: ParamWriteCoreNode,
): void {
    const contentsList = ListNode<DeepCoreNode>({
        listType: {
            type: ListType.Ordered,
        },
    });
    for (const mainReference of tableOfContentsList.tableOfContents) {
        const listItem = buildTableOfContentsListItem(
            mainReference,
            tableOfContentsList.relativePagePath,
        );
        contentsList.children.push(listItem);
        if (mainReference.nested_references) {
            const nestedList = ListNode<DeepCoreNode>({
                listType: {
                    type: ListType.Ordered,
                },
            });
            listItem.children.push(nestedList);
            for (const nestedReference of mainReference.nested_references) {
                nestedList.children.push(
                    buildTableOfContentsListItem(
                        nestedReference,
                        tableOfContentsList.relativePagePath,
                    ),
                );
            }
        }
    }
    writeDeepCoreNode(contentsList, output, writeCoreNode);
}

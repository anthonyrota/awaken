import { outPagePathToPageUrl } from '../../../analyze/util/outPagePathToPageUrl';
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
import { MarkdownOutput } from './MarkdownOutput';
import { TableOfContentsListBase } from './nodes/TableOfContentsList';
import { ParamWriteRenderMarkdownNode, writeDeepRenderMarkdownNode } from '.';

function buildTableOfContentsLink(
    reference: TableOfContentsInlineReference,
    pagePath: string,
    output: MarkdownOutput,
): DeepCoreNode {
    const outPagePath = `${pagePath}#${reference.urlHashText}`;
    return LocalPageLinkNode<DeepCoreNode>({
        pagePath: outPagePath,
        pageUrl: outPagePathToPageUrl(outPagePath, output.analyzeContext),
        children: [
            CodeSpanNode<DeepCoreNode>({
                children: [PlainTextNode({ text: reference.text })],
            }),
        ],
    });
}

function buildTableOfContentsListItem(
    reference: TableOfContentsNestedReference,
    pagePath: string,
    output: MarkdownOutput,
): ContainerNode<DeepCoreNode> {
    const listItem = ContainerNode<DeepCoreNode>({
        children: [buildTableOfContentsLink(reference, pagePath, output)],
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
                buildTableOfContentsLink(inlineReference, pagePath, output),
            );
        }
    }
    return listItem;
}

export function writeTableOfContentsList(
    tableOfContentsList: TableOfContentsListBase,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
): void {
    const contentsList = ListNode<DeepCoreNode>({
        listType: {
            type: ListType.Ordered,
        },
    });
    for (const mainReference of tableOfContentsList.tableOfContents) {
        const listItem = buildTableOfContentsListItem(
            mainReference,
            tableOfContentsList.pagePath,
            output,
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
                        tableOfContentsList.pagePath,
                        output,
                    ),
                );
            }
        }
    }
    writeDeepRenderMarkdownNode(contentsList, output, writeRenderMarkdownNode);
}

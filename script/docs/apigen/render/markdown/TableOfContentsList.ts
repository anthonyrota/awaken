import { List } from './../../nodes/List';
import { DeepCoreNode } from './../../nodes';
import { PlainText } from '../../nodes/PlainText';
import { CodeSpan } from '../../nodes/CodeSpan';
import { Container } from '../../nodes/Container';
import { LocalPageLink } from '../../nodes/LocalPageLink';
import {
    TableOfContentsInlineReference,
    TableOfContentsNestedReference,
} from '../../../pageMetadata';
import { addChildrenC, addChildren } from '../../nodes/abstract/ContainerBase';
import { TableOfContentsList } from '../../nodes/TableOfContentsList';
import { MarkdownOutput } from './MarkdownOutput';

function buildTableOfContentsLink(
    reference: TableOfContentsInlineReference,
    relativePagePath: string,
): DeepCoreNode {
    return addChildrenC<DeepCoreNode, LocalPageLink<DeepCoreNode>>(
        LocalPageLink<DeepCoreNode>({
            destination: `${relativePagePath}#${reference.url_hash_text}`,
        }),
        addChildrenC<DeepCoreNode, CodeSpan<DeepCoreNode>>(
            CodeSpan<DeepCoreNode>(),
            PlainText({ text: reference.text }),
        ),
    );
}

function buildTableOfContentsListItem(
    reference: TableOfContentsNestedReference,
    relativePagePath: string,
): Container<DeepCoreNode> {
    const listItem = addChildrenC(
        Container<DeepCoreNode>(),
        buildTableOfContentsLink(reference, relativePagePath),
    );
    if (reference.inline_references && reference.inline_references.length > 0) {
        addChildren(listItem, PlainText({ text: ' - ' }));
        for (const [
            i,
            inlineReference,
        ] of reference.inline_references.entries()) {
            if (i !== 0) {
                addChildren(listItem, PlainText({ text: ', ' }));
            }
            addChildren(
                listItem,
                buildTableOfContentsLink(inlineReference, relativePagePath),
            );
        }
    }
    return listItem;
}

export function writeTableOfContentsList(
    tableOfContentsList: TableOfContentsList,
    output: MarkdownOutput,
    writeDeepCoreNode: (node: DeepCoreNode, output: MarkdownOutput) => void,
): void {
    const contentsList = List<DeepCoreNode>({ ordered: {} });
    for (const mainReference of tableOfContentsList.tableOfContents) {
        const listItem = buildTableOfContentsListItem(
            mainReference,
            tableOfContentsList.relativePagePath,
        );
        addChildren(contentsList, listItem);
        if (mainReference.nested_references) {
            const nestedList = List<DeepCoreNode>({ ordered: {} });
            addChildren(listItem, nestedList);
            for (const nestedReference of mainReference.nested_references) {
                addChildren(
                    nestedList,
                    buildTableOfContentsListItem(
                        nestedReference,
                        tableOfContentsList.relativePagePath,
                    ),
                );
            }
        }
    }
    writeDeepCoreNode(contentsList, output);
}

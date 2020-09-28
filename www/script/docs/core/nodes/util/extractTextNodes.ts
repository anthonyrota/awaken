import { CoreNodeType, DeepCoreNode } from '..';
import { PlainTextNode } from '../PlainText';

// TODO: generalize, differentiate between actual text nodes and dynamic text
// nodes.
export function extractTextNodes(
    node: DeepCoreNode,
    textNodes: PlainTextNode[] = [],
): PlainTextNode[] {
    if ('children' in node) {
        for (const childNode of node.children) {
            extractTextNodes(childNode, textNodes);
        }
    }

    switch (node.type) {
        case CoreNodeType.CollapsibleSection: {
            extractTextNodes(node.summaryNode, textNodes);
            break;
        }
        case CoreNodeType.Table: {
            for (const cellNode of node.header.children) {
                extractTextNodes(cellNode, textNodes);
            }
            for (const row of node.rows) {
                for (const cellNode of row.children) {
                    extractTextNodes(cellNode, textNodes);
                }
            }
            break;
        }
        case CoreNodeType.PlainText: {
            textNodes.push(node);
            break;
        }
        case CoreNodeType.CodeBlock: {
            const codeBlockNode = node;
            textNodes.push({
                type: CoreNodeType.PlainText,
                get text() {
                    return codeBlockNode.code;
                },
                set text(text: string) {
                    codeBlockNode.code = text;
                },
            });
            break;
        }
    }

    return textNodes;
}

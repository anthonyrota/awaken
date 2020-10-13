import { CoreNodeType, DeepCoreNode } from '..';
import { CodeBlockNode } from '../CodeBlock';
import { PlainTextNode } from '../PlainText';

export interface ExtractedTextNode {
    originalNode: PlainTextNode | CodeBlockNode;
    text: string;
}

// TODO: generalize, differentiate between actual text nodes and dynamic text
// nodes.
export function extractTextNodes(
    node: DeepCoreNode,
    textNodes: ExtractedTextNode[] = [],
): ExtractedTextNode[] {
    if ('children' in node) {
        for (const childNode of node.children) {
            extractTextNodes(childNode, textNodes);
        }
    }

    switch (node.type) {
        case CoreNodeType.CollapsibleSection: {
            if (node.summaryNode) {
                extractTextNodes(node.summaryNode, textNodes);
            }
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
            const plainTextNode = node;
            textNodes.push({
                originalNode: plainTextNode,
                get text() {
                    return plainTextNode.text;
                },
                set text(text) {
                    plainTextNode.text = text;
                },
            });
            break;
        }
        case CoreNodeType.CodeBlock: {
            const codeBlockNode = node;
            textNodes.push({
                originalNode: codeBlockNode,
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

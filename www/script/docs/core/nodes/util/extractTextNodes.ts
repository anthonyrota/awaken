import { CoreNodeType, DeepCoreNode } from '..';
import { PlainTextNode } from '../PlainText';

export interface ExtractTextNodesOptions {
    includeCodeBlocks?: boolean;
}

// TODO: generalize, differentiate between actual text nodes and dynamic text
// nodes.
export function extractTextNodes(
    node: DeepCoreNode,
    textNodes: PlainTextNode[] = [],
    options?: ExtractTextNodesOptions,
): PlainTextNode[] {
    const includeCodeBlocks = options?.includeCodeBlocks ?? true;

    if ('children' in node) {
        for (const childNode of node.children) {
            extractTextNodes(childNode, textNodes, options);
        }
    }

    switch (node.type) {
        case CoreNodeType.CollapsibleSection: {
            if (node.summaryNode) {
                extractTextNodes(node.summaryNode, textNodes, options);
            }
            break;
        }
        case CoreNodeType.Table: {
            for (const cellNode of node.header.children) {
                extractTextNodes(cellNode, textNodes, options);
            }
            for (const row of node.rows) {
                for (const cellNode of row.children) {
                    extractTextNodes(cellNode, textNodes, options);
                }
            }
            break;
        }
        case CoreNodeType.PlainText: {
            textNodes.push(node);
            break;
        }
        case CoreNodeType.CodeBlock: {
            if (!includeCodeBlocks) {
                break;
            }
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

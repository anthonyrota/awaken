import { Node, CoreNodeType, DeepCoreNode, CoreNode } from '..';

function visitChildren<ChildNode extends Node>(
    children: ChildNode[],
    onChildNode: (
        node: ChildNode,
        replaceNode: (newNode: ChildNode) => void,
    ) => void,
): void {
    children.forEach((childNode, index) => {
        onChildNode(childNode, (newNode) => {
            children[index] = newNode;
        });
    });
}

export function visitCoreNodeChildren<ChildNode extends Node>(
    node: CoreNode<ChildNode>,
    onChildNode: (
        node: ChildNode,
        replaceNode: (newNode: ChildNode) => void,
    ) => void,
): void {
    if ('children' in node) {
        visitChildren(node.children, onChildNode);
    }

    switch (node.type) {
        case CoreNodeType.CollapsibleSection: {
            if (node.summaryNode) {
                onChildNode(node.summaryNode, (newNode) => {
                    node.summaryNode = newNode;
                });
            }
            break;
        }
        case CoreNodeType.Table: {
            visitChildren(node.header.children, onChildNode);
            for (const row of node.rows) {
                visitChildren(row.children, onChildNode);
            }
            break;
        }
    }
}

export function walkDeepCoreNode(
    node: DeepCoreNode,
    onNode: (
        node: DeepCoreNode,
        replaceNode: ((newNode: DeepCoreNode) => void) | null,
    ) => boolean | void,
): void {
    function onChildNode(
        node: DeepCoreNode,
        replaceNode: ((newNode: DeepCoreNode) => void) | null,
    ): void {
        if (onNode(node, replaceNode) !== true) {
            visitCoreNodeChildren(node, onChildNode);
        }
    }

    onChildNode(node, null);
}

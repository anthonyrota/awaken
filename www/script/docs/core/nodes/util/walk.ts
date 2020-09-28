import { Node, CoreNodeType, DeepCoreNode, CoreNode } from '..';

export function visitCoreNodeChildren<ChildNode extends Node>(
    node: CoreNode<ChildNode>,
    onChildNode: (node: ChildNode) => void,
): void {
    if ('children' in node) {
        node.children.forEach(onChildNode);
    }

    switch (node.type) {
        case CoreNodeType.CollapsibleSection: {
            onChildNode(node.summaryNode);
            break;
        }
        case CoreNodeType.Table: {
            node.header.children.forEach(onChildNode);
            for (const row of node.rows) {
                row.children.forEach(onChildNode);
            }
            break;
        }
    }
}

export function walkDeepCoreNode(
    node: DeepCoreNode,
    onNode: (node: DeepCoreNode) => void,
): void {
    function onChildNode(node: DeepCoreNode): void {
        onNode(node);
        visitCoreNodeChildren(node, onChildNode);
    }

    onChildNode(node);
}

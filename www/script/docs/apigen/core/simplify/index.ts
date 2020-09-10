import { Node, CoreNodeType, DeepCoreNode, CoreNode } from '../nodes';
import { ContainerNode } from '../nodes/Container';
import { PlainTextNode } from '../nodes/PlainText';

export function mergePlainTextNodes(children: Node[]): void {
    for (let i = 0; i < children.length - 1; i++) {
        const child = children[i];
        const nextChild = children[i + 1];
        if (
            child.type === CoreNodeType.PlainText &&
            nextChild.type === CoreNodeType.PlainText
        ) {
            children.splice(i-- + 1, 1);
            (child as PlainTextNode).text += (nextChild as PlainTextNode).text;
        }
    }
}

/**
 * WARNING: Not type safe if ChildNode extends ContainerNode<not ChildNode>
 */
export function mergeNestedContainers<ChildNode extends Node>(
    children: (ContainerNode<ChildNode> | ChildNode)[],
): void {
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.type === CoreNodeType.Container) {
            // Not type safe.
            children.splice(
                i--,
                1,
                ...(child as ContainerNode<ChildNode>).children,
            );
        }
    }
}

/**
 * WARNING: Not type safe if ChildNode extends ContainerNode<not ChildNode>
 */
export function replaceSingleItemContainers<ChildNode extends Node>(
    children: (ContainerNode<ChildNode> | ChildNode)[],
): void {
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (
            child.type === CoreNodeType.Container &&
            (child as ContainerNode<ChildNode>).children.length === 1
        ) {
            // Not type safe.
            children[i] = (child as ContainerNode<ChildNode>).children[0];
        }
    }
}

export function isChildEmpty(child: Node): boolean {
    return (
        (child.type === CoreNodeType.PlainText &&
            (child as PlainTextNode).text === '') ||
        (child.type === CoreNodeType.Container &&
            (child as ContainerNode<Node>).children.length === 0)
    );
}

export function removeEmptyChildren<ChildNode extends Node>(
    children: (ContainerNode<ChildNode> | ChildNode)[],
): void {
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isChildEmpty(child) && child.type !== CoreNodeType.Container) {
            children.splice(i--, 1);
        }
    }
}

export function replaceEmptyChildren<ChildNode extends Node>(
    children: (ContainerNode<ChildNode> | ChildNode)[],
): void {
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isChildEmpty(child) && child.type !== CoreNodeType.Container) {
            children[i] = ContainerNode({});
        }
    }
}

export function simplifyCoreNode<ChildNode extends Node>(
    node: CoreNode<ChildNode>,
    simplifyChildNode: (node: ChildNode) => void,
): void {
    if ('children' in node) {
        node.children.forEach(simplifyChildNode);
        if (node.type === CoreNodeType.List) {
            replaceSingleItemContainers(node.children);
            replaceEmptyChildren(node.children);
        } else {
            mergeNestedContainers(node.children);
            removeEmptyChildren(node.children);
            mergePlainTextNodes(node.children);
        }
    }

    switch (node.type) {
        case CoreNodeType.CollapsibleSection: {
            simplifyChildNode(node.summaryNode);
            break;
        }
        case CoreNodeType.Table: {
            node.header.children.forEach(simplifyChildNode);
            replaceSingleItemContainers(node.header.children);
            replaceEmptyChildren(node.header.children);
            for (const row of node.rows) {
                row.children.forEach(simplifyChildNode);
                replaceSingleItemContainers(row.children);
                replaceEmptyChildren(node.header.children);
            }
            break;
        }
    }
}

export function simplifyDeepCoreNode(node: DeepCoreNode): void {
    simplifyCoreNode(node, simplifyDeepCoreNode);
}

import { Node, CoreNodeType, DeepCoreNode, CoreNode } from '..';
import { ContainerBase, ContainerNode } from '../Container';
import {
    getHtmlTagClassification,
    HtmlTagClassification,
} from '../HtmlElement';
import { ParagraphNode } from '../Paragraph';
import { PlainTextNode } from '../PlainText';
import { walkDeepCoreNode } from './walk';

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
        ((child.type === CoreNodeType.Container ||
            child.type === CoreNodeType.Italics ||
            child.type === CoreNodeType.Bold ||
            child.type === CoreNodeType.Strikethrough ||
            child.type === CoreNodeType.CodeSpan ||
            child.type === CoreNodeType.Link ||
            child.type === CoreNodeType.DocPageLink ||
            child.type === CoreNodeType.GithubSourceLink ||
            child.type === CoreNodeType.Subscript ||
            child.type === CoreNodeType.Superscript) &&
            (child as Node & ContainerBase<Node>).children.length === 0)
    );
}

export function isChildEmptyBlock(child: Node): boolean {
    return (
        child.type === CoreNodeType.List &&
        (child as Node & ContainerBase<Node>).children.length === 0
    );
}

export function removeEmptyChildren<ChildNode extends Node>(
    children: (
        | ContainerNode<ChildNode>
        | ParagraphNode<ChildNode>
        | ChildNode
    )[],
): void {
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isChildEmpty(child)) {
            children.splice(i--, 1);
        } else if (isChildEmptyBlock(child)) {
            children[i] = ParagraphNode({});
        }
    }
}

export function replaceEmptyChildren<ChildNode extends Node>(
    children: (
        | ContainerNode<ChildNode>
        | ParagraphNode<ChildNode>
        | ChildNode
    )[],
): void {
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isChildEmpty(child) && child.type !== CoreNodeType.Container) {
            children[i] = ContainerNode({});
        } else if (isChildEmptyBlock(child)) {
            children[i] = ParagraphNode({});
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
            if (node.summaryNode) {
                simplifyChildNode(node.summaryNode);
            }
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

export function collapseDeepCoreNodeWhitespace(rootNode: DeepCoreNode): void {
    function isBlock(node: DeepCoreNode): boolean {
        return (
            node.type === CoreNodeType.HorizontalRule ||
            (node.type === CoreNodeType.HtmlElement &&
                getHtmlTagClassification(node.tagName) !==
                    HtmlTagClassification.Inline) ||
            node.type === CoreNodeType.BlockQuote ||
            node.type === CoreNodeType.CodeBlock ||
            node.type === CoreNodeType.Image ||
            node.type === CoreNodeType.Paragraph ||
            node.type === CoreNodeType.Heading123456 ||
            node.type === CoreNodeType.Heading ||
            node.type === CoreNodeType.Subheading ||
            node.type === CoreNodeType.Title ||
            node.type === CoreNodeType.List ||
            node.type === CoreNodeType.Table ||
            node.type === CoreNodeType.CollapsibleSection ||
            node.type === CoreNodeType.LineBreak ||
            node.type === CoreNodeType.PageTitle
        );
    }

    function isInlineVoid(node: DeepCoreNode): boolean {
        return (
            node.type === CoreNodeType.HtmlElement &&
            getHtmlTagClassification(node.tagName) ===
                HtmlTagClassification.SelfClosing
        );
    }

    let lastTextNodes: { text: string }[] = [];
    const textBlocks: { text: string }[][] = [];
    walkDeepCoreNode(rootNode, (node): boolean | void => {
        if (node.type === CoreNodeType.PlainText) {
            if (lastTextNodes.length === 0) {
                textBlocks.push(lastTextNodes);
            }
            lastTextNodes.push(node);
        } else if (isBlock(node)) {
            lastTextNodes = [];
        } else if (isInlineVoid(node)) {
            if (lastTextNodes.length === 0) {
                textBlocks.push(lastTextNodes);
            }
            // Placeholder to represent the void node so surrounding whitespace
            // doesn't disappear.
            lastTextNodes.push({ text: 'x' });
        }
    });

    // Collapse whitespace in each block.
    for (const textNodes of textBlocks) {
        const text = textNodes.map((textNode) => textNode.text).join('');
        let offset = 0;
        for (const whitespaceRegionMatch of text.matchAll(/\s+/g)) {
            const matchedText = whitespaceRegionMatch[0];
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const originalMatchStart = whitespaceRegionMatch.index!;
            const originalMatchEnd = originalMatchStart + matchedText.length;
            const replacementText =
                originalMatchStart === 0 || originalMatchEnd === text.length
                    ? ''
                    : ' ';
            if (replacementText === matchedText) {
                continue;
            }
            const matchStart = offset + originalMatchStart;
            const matchEnd = offset + originalMatchEnd;
            offset += replacementText.length - (matchEnd - matchStart);
            let textNodeStartIndex = 0;
            for (let i = 0; i < textNodes.length; i++) {
                const textNode = textNodes[i];
                const textNodeEndIndex =
                    textNodeStartIndex + textNode.text.length;
                if (matchEnd <= textNodeStartIndex) {
                    break;
                }
                if (matchStart < textNodeEndIndex) {
                    const textNodeMatchStart = Math.max(
                        matchStart - textNodeStartIndex,
                        0,
                    );
                    const textNodeMatchEnd = matchEnd - textNodeStartIndex;
                    textNode.text =
                        textNode.text.slice(0, textNodeMatchStart) +
                        (matchStart >= textNodeStartIndex
                            ? // Replace whitespace at first node.
                              replacementText
                            : '') +
                        textNode.text.slice(textNodeMatchEnd);
                }
                textNodeStartIndex = textNodeEndIndex;
            }
        }
    }
}

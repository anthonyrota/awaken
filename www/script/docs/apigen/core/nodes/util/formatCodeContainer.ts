import { CoreNodeType, Node } from '..';
import { format, formatWithCursor, Language } from '../../../util/prettier';
import { ContainerBase } from '../Container';
import { PlainTextNode } from '../PlainText';

export function formatCodeContainer(container: ContainerBase<Node>): void {
    const textNodes = extractTextNodes(container);

    let text = '';
    const offsets: number[] = [0];

    for (const textNode of textNodes) {
        text += textNode.text;
        offsets.push(text.length);
    }

    const formattedText = format(text, Language.TypeScript, { semi: false });
    const formattedOffsets = offsets.map((offset) => {
        return formatWithCursor(text, offset, Language.TypeScript, {
            semi: false,
        }).cursorOffset;
    });

    for (const [i, textNode] of textNodes.entries()) {
        textNode.text = formattedText.slice(
            formattedOffsets[i],
            formattedOffsets[i + 1],
        );
    }
}

/**
 * Not type safe. Requires that all child nodes with 'children' property
 * implement the `ContainerBase` interface.
 */
function extractTextNodes(
    container: ContainerBase<Node>,
    textNodes: PlainTextNode[] = [],
): PlainTextNode[] {
    for (const child of container.children) {
        if ('children' in child) {
            extractTextNodes(child as Node & ContainerBase<Node>, textNodes);
        }
        if (child.type === CoreNodeType.PlainText) {
            textNodes.push(child as PlainTextNode);
        }
    }
    return textNodes;
}

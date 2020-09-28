import { DeepCoreNode } from '..';
import { format, formatWithCursor, Language } from '../../../util/prettier';
import { ContainerBase } from '../Container';
import { PlainTextNode } from '../PlainText';
import { extractTextNodes } from './extractTextNodes';

export function formatCodeContainer(
    container: ContainerBase<DeepCoreNode>,
): void {
    const textNodes: PlainTextNode[] = [];
    for (const childNode of container.children) {
        extractTextNodes(childNode, textNodes);
    }

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

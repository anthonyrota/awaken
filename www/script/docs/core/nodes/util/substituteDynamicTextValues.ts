import { DeepCoreNode } from '..';
import { extractTextNodes } from './extractTextNodes';

export function substituteDynamicTextValues(
    node: DeepCoreNode,
    getReplacement: (variableName: string) => string,
): void {
    for (const textNode of extractTextNodes(node)) {
        let offset = 0;
        for (const match of textNode.text.matchAll(
            // eslint-disable-next-line max-len
            /{{(?!{)[^\S\r\n]*(?<variableName>[a-zA-Z_$][a-zA-Z_$]*?)[^\S\r\n]*}}/g,
        )) {
            // eslint-disable-next-line max-len
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const matchStart = match.index!;
            // eslint-disable-next-line max-len
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const variableName = match.groups!.variableName;
            const sourceMatchStart = offset + matchStart;
            const sourceMatchEnd = sourceMatchStart + match[0].length;
            const replacement = getReplacement(variableName);
            textNode.text =
                textNode.text.slice(0, sourceMatchStart) +
                replacement +
                textNode.text.slice(sourceMatchEnd);
            offset += replacement.length - (sourceMatchEnd - sourceMatchStart);
        }
    }
}

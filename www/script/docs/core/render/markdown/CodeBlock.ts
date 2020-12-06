import { DeepCoreNode } from '../../nodes';
import { CodeBlockBase } from '../../nodes/CodeBlock';
import { DocPageLinkNode } from '../../nodes/DocPageLink';
import { HtmlElementNode } from '../../nodes/HtmlElement';
import { PlainTextNode } from '../../nodes/PlainText';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteRenderMarkdownNode, writeDeepRenderMarkdownNode } from '.';

export function writeCodeBlock(
    codeBlock: CodeBlockBase,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
): void {
    const { codeLinks } = codeBlock;
    if (codeLinks && codeLinks.length !== 0) {
        const children: DeepCoreNode[] = [];
        const firstCodeLink = codeLinks[0];
        if (firstCodeLink.startIndex !== 0) {
            children.push(
                PlainTextNode({
                    text: codeBlock.code.slice(0, firstCodeLink.startIndex),
                }),
            );
        }
        codeLinks.forEach((codeLink, i) => {
            children.push(
                DocPageLinkNode({
                    pageId: codeLink.pageId,
                    hash: codeLink.hash,
                    children: [
                        PlainTextNode({
                            text: codeBlock.code.slice(
                                codeLink.startIndex,
                                codeLink.endIndex,
                            ),
                        }),
                    ],
                }),
            );
            const nextCodeLink = codeLinks[i + 1];
            const nextStartIndex = nextCodeLink
                ? nextCodeLink.startIndex
                : codeBlock.code.length;
            if (codeLink.endIndex !== nextStartIndex) {
                children.push(
                    PlainTextNode({
                        text: codeBlock.code.slice(
                            codeLink.endIndex,
                            nextStartIndex,
                        ),
                    }),
                );
            }
        });

        writeDeepRenderMarkdownNode(
            HtmlElementNode({
                tagName: 'pre',
                children,
            }),
            output,
            writeRenderMarkdownNode,
        );
        return;
    }

    if (output.constrainedToSingleLine) {
        let attributes: Record<string, string> | undefined = undefined;
        if (
            codeBlock.language !== undefined &&
            // <br> elements in highlighted pre elements are removed.
            !/\r?\n/.test(codeBlock.code)
        ) {
            attributes = { lang: codeBlock.language };
        }
        writeDeepRenderMarkdownNode(
            HtmlElementNode({
                tagName: 'pre',
                attributes,
                children: [PlainTextNode({ text: codeBlock.code })],
            }),
            output,
            writeRenderMarkdownNode,
        );
        return;
    }

    output.withParagraphBreak(() => {
        output.withInMarkdownCode(() => {
            output.write('```');
            if (codeBlock.language) {
                writeRenderMarkdownNode(
                    PlainTextNode({ text: codeBlock.language }),
                    output,
                );
            }
            output.writeLine();
            writeRenderMarkdownNode(
                PlainTextNode({ text: codeBlock.code }),
                output,
            );
            output.ensureNewLine();
        });
        output.write('```');
        // Nothing can go on the same line as the backticks or it will break.
        output.writeLine();
    });
}

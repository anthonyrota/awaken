import { CodeBlockBase } from '../../nodes/CodeBlock';
import { HtmlElementNode } from '../../nodes/HtmlElement';
import { PlainTextNode } from '../../nodes/PlainText';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteRenderMarkdownNode, writeDeepRenderMarkdownNode } from '.';

export function writeCodeBlock(
    codeBlock: CodeBlockBase,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
): void {
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
    });
}

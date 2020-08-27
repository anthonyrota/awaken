import { CodeBlockBase } from '../../nodes/CodeBlock';
import { HtmlElementNode } from '../../nodes/HtmlElement';
import { PlainTextNode } from '../../nodes/PlainText';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteCoreNode, writeDeepCoreNode } from '.';

export function writeCodeBlock(
    codeBlock: CodeBlockBase,
    output: MarkdownOutput,
    writeCoreNode: ParamWriteCoreNode,
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
        writeDeepCoreNode(
            HtmlElementNode({
                tagName: 'pre',
                attributes,
                children: [PlainTextNode({ text: codeBlock.code })],
            }),
            output,
            writeCoreNode,
        );
        return;
    }

    output.withParagraphBreak(() => {
        output.withInMarkdownCode(() => {
            output.write('```');
            if (codeBlock.language) {
                writeCoreNode(
                    PlainTextNode({ text: codeBlock.language }),
                    output,
                );
            }
            output.writeLine();
            writeCoreNode(PlainTextNode({ text: codeBlock.code }), output);
            output.ensureNewLine();
        });
        output.write('```');
    });
}

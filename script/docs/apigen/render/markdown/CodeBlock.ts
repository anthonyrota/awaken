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
        output.withInSingleLineCodeBlock(() => {
            writeDeepCoreNode(
                HtmlElementNode({
                    tagName: 'code',
                    children: [PlainTextNode({ text: codeBlock.code })],
                }),
                output,
                writeCoreNode,
            );
        });
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

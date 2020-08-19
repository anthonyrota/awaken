import { addChildrenC } from '../../nodes/abstract/ContainerBase';
import { HtmlElement } from '../../nodes/HtmlElement';
import { CodeBlock } from '../../nodes/CodeBlock';
import { MarkdownOutput } from './MarkdownOutput';
import { writeHtmlElement } from './HtmlElement';
import { writePlainText } from './PlainText';
import { PlainText } from '../../nodes/PlainText';

export function writeCodeBlock(
    codeBlock: CodeBlock,
    output: MarkdownOutput,
): void {
    if (output.constrainedToSingleLine) {
        output.withInSingleLineCodeBlock(() => {
            writeHtmlElement(
                addChildrenC(
                    HtmlElement<PlainText>({ tagName: 'code' }),
                    PlainText({ text: codeBlock.code }),
                ),
                output,
                writePlainText,
            );
        });
        return;
    }

    output.withParagraphBreak(() => {
        output.withInMarkdownCode(() => {
            output.write('```');
            if (codeBlock.language) {
                writePlainText(PlainText({ text: codeBlock.language }), output);
            }
            output.writeLine();
            writePlainText(PlainText({ text: codeBlock.code }), output);
            output.ensureNewLine();
        });
        output.write('```');
    });
}

import { HorizontalRule } from '../../nodes/HorizontalRule';
import { HtmlElement } from '../../nodes/HtmlElement';
import { MarkdownOutput } from './MarkdownOutput';
import { writeVoidHtmlElement } from './HtmlElement';

export function writeHorizontalRule(
    _horizontalRule: HorizontalRule,
    output: MarkdownOutput,
): void {
    if (output.constrainedToSingleLine) {
        writeVoidHtmlElement(HtmlElement({ tagName: 'hr' }), output);
    } else {
        output.withParagraphBreak(() => {
            output.writeLine('---');
        });
    }
}

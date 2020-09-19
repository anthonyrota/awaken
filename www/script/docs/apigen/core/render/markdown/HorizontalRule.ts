import { noop } from '../../../util/noop';
import { HorizontalRuleBase } from '../../nodes/HorizontalRule';
import { HtmlElementNode } from '../../nodes/HtmlElement';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteRenderMarkdownNode } from '.';

export function writeHorizontalRule(
    _horizontalRule: HorizontalRuleBase,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
): void {
    if (output.constrainedToSingleLine) {
        writeRenderMarkdownNode(
            HtmlElementNode({ tagName: 'hr' }),
            output,
            noop,
        );
    } else {
        output.withParagraphBreak(() => {
            output.writeLine('---');
        });
    }
}

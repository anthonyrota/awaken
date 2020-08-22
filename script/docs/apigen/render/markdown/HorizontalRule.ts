import { HorizontalRuleBase } from '../../nodes/HorizontalRule';
import { HtmlElementNode } from '../../nodes/HtmlElement';
import { noop } from '../../util/noop';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteCoreNode } from '.';

export function writeHorizontalRule(
    _horizontalRule: HorizontalRuleBase,
    output: MarkdownOutput,
    writeCoreNode: ParamWriteCoreNode,
): void {
    if (output.constrainedToSingleLine) {
        writeCoreNode(HtmlElementNode({ tagName: 'hr' }), output, noop);
    } else {
        output.withParagraphBreak(() => {
            output.writeLine('---');
        });
    }
}

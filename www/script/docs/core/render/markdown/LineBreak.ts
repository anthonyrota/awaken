import { noop } from '../../../util/noop';
import { HtmlElementNode } from '../../nodes/HtmlElement';
import { LineBreakBase } from '../../nodes/LineBreak';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteRenderMarkdownNode } from '.';

export function writeLineBreak(
    _lineBreak: LineBreakBase,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
): void {
    writeRenderMarkdownNode(HtmlElementNode({ tagName: 'br' }), output, noop);
}

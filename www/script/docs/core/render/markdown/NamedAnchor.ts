import { noop } from '../../../util/noop';
import { HtmlElementNode } from '../../nodes/HtmlElement';
import { NamedAnchorBase } from '../../nodes/NamedAnchor';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteRenderMarkdownNode } from '.';

export function writeNamedAnchor(
    namedAnchor: NamedAnchorBase,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
): void {
    writeRenderMarkdownNode(
        HtmlElementNode({
            tagName: 'a',
            attributes: {
                name: namedAnchor.name,
            },
        }),
        output,
        noop,
    );
}

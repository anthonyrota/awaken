import { Node } from '../../nodes';
import { HtmlElementNode } from '../../nodes/HtmlElement';
import { SuperscriptBase } from '../../nodes/Superscript';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteChildNode, ParamWriteRenderMarkdownNode } from '.';

export function writeSuperscript<ChildNode extends Node>(
    superscript: SuperscriptBase<ChildNode>,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    writeRenderMarkdownNode(
        HtmlElementNode<ChildNode>({
            tagName: 'sup',
            children: superscript.children,
        }),
        output,
        writeChildNode,
    );
}

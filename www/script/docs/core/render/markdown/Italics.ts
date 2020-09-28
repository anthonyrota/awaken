import { Node } from '../../nodes';
import { HtmlElementNode } from '../../nodes/HtmlElement';
import { ItalicsBase } from '../../nodes/Italics';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteChildNode, ParamWriteRenderMarkdownNode } from '.';

export function writeItalics<ChildNode extends Node>(
    Italics: ItalicsBase<ChildNode>,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    writeRenderMarkdownNode(
        HtmlElementNode<ChildNode>({
            tagName: 'i',
            children: Italics.children,
        }),
        output,
        writeChildNode,
    );
}

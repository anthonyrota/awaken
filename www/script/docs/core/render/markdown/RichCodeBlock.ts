import { Node } from '../../nodes';
import { HtmlElementNode } from '../../nodes/HtmlElement';
import { RichCodeBlockBase } from '../../nodes/RichCodeBlock';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteChildNode, ParamWriteRenderMarkdownNode } from '.';

export function writeRichCodeBlock<ChildNode extends Node>(
    richCodeBlock: RichCodeBlockBase<ChildNode>,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    if (output.constrainedToSingleLine) {
        writeRenderMarkdownNode(
            HtmlElementNode<ChildNode>({
                tagName: 'pre',
                children: richCodeBlock.children,
            }),
            output,
            writeChildNode,
        );
        return;
    }

    writeRenderMarkdownNode(
        HtmlElementNode<ChildNode>({
            tagName: 'pre',
            children: richCodeBlock.children,
        }),
        output,
        writeChildNode,
    );
}

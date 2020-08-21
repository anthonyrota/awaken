import { Node } from '../../nodes';
import { BoldBase } from '../../nodes/Bold';
import { HtmlElementNode } from '../../nodes/HtmlElement';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteChildNode, ParamWriteCoreNode } from '.';

export function writeBold<ChildNode extends Node>(
    bold: BoldBase<ChildNode>,
    output: MarkdownOutput,
    writeCoreNode: ParamWriteCoreNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    writeCoreNode(
        HtmlElementNode<ChildNode>({
            tagName: 'b',
            children: bold.children,
        }),
        output,
        writeChildNode,
    );
}

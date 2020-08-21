import { Node } from '../../nodes';
import { HtmlElementNode } from '../../nodes/HtmlElement';
import { ItalicsBase } from '../../nodes/Italics';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteChildNode, ParamWriteCoreNode } from '.';

export function writeItalics<ChildNode extends Node>(
    Italics: ItalicsBase<ChildNode>,
    output: MarkdownOutput,
    writeCoreNode: ParamWriteCoreNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    writeCoreNode(
        HtmlElementNode<ChildNode>({
            tagName: 'i',
            children: Italics.children,
        }),
        output,
        writeChildNode,
    );
}

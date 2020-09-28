import { Node } from '../../nodes';
import { ContainerBase } from '../../nodes/Container';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteRenderMarkdownNode, ParamWriteChildNode } from '.';

export function writeContainer<ChildNode extends Node>(
    container: ContainerBase<ChildNode>,
    output: MarkdownOutput,
    _writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    for (const child of container.children) {
        writeChildNode(child, output);
    }
}

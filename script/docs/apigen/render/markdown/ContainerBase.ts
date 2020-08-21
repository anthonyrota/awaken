import { Node } from '../../nodes';
import { ContainerBase } from '../../nodes/Container';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteCoreNode, ParamWriteChildNode } from './index';

export function writeContainer<ChildNode extends Node>(
    container: ContainerBase<ChildNode>,
    output: MarkdownOutput,
    _writeCoreNode: ParamWriteCoreNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    for (const child of container.children) {
        writeChildNode(child, output);
    }
}

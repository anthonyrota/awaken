import { ContainerBase } from '../../nodes/abstract/ContainerBase';
import { Node } from '../../nodes';
import { MarkdownOutput } from './MarkdownOutput';

export function writeContainerBase<ChildNode extends Node>(
    container: ContainerBase<ChildNode>,
    output: MarkdownOutput,
    writeChildNode: (node: ChildNode, output: MarkdownOutput) => void,
): void {
    for (const child of container.children) {
        writeChildNode(child, output);
    }
}

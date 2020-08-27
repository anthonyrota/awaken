import { Node } from '../../nodes';
import { Heading123456Node } from '../../nodes/Heading123456';
import { SubheadingBase } from '../../nodes/Subheading';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteChildNode, ParamWriteCoreNode } from '.';

export function writeSubheading<ChildNode extends Node>(
    subheading: SubheadingBase<ChildNode>,
    output: MarkdownOutput,
    writeCoreNode: ParamWriteCoreNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    writeCoreNode(
        Heading123456Node<ChildNode>({
            level: 3,
            alternateId: subheading.alternateId,
            children: subheading.children,
        }),
        output,
        writeChildNode,
    );
}

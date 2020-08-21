import { Node } from '../../nodes';
import { HeadingBase } from '../../nodes/Heading';
import { Heading123456Node } from '../../nodes/Heading123456';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteChildNode, ParamWriteCoreNode } from '.';

export function writeHeading<ChildNode extends Node>(
    heading: HeadingBase<ChildNode>,
    output: MarkdownOutput,
    writeCoreNode: ParamWriteCoreNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    writeCoreNode(
        Heading123456Node<ChildNode>({
            level: 2,
            alternateId: heading.alternateId,
            children: heading.children,
        }),
        output,
        writeChildNode,
    );
}

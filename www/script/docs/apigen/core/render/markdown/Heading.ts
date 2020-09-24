import { Node } from '../../nodes';
import { HeadingBase } from '../../nodes/Heading';
import { Heading123456Node } from '../../nodes/Heading123456';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteChildNode, ParamWriteRenderMarkdownNode } from '.';

export function writeHeading<ChildNode extends Node>(
    heading: HeadingBase<ChildNode>,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    writeRenderMarkdownNode(
        Heading123456Node<ChildNode>({
            level: 2,
            includeLink: { alternateId: heading.alternateId },
            children: heading.children,
        }),
        output,
        writeChildNode,
    );
}

import { Node } from '../../nodes';
import { Heading123456Node } from '../../nodes/Heading123456';
import { SubheadingBase } from '../../nodes/Subheading';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteChildNode, ParamWriteRenderMarkdownNode } from '.';

export function writeSubheading<ChildNode extends Node>(
    subheading: SubheadingBase<ChildNode>,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    writeRenderMarkdownNode(
        Heading123456Node<ChildNode>({
            level: 3,
            includeLink: { alternateId: subheading.alternateId },
            children: subheading.children,
        }),
        output,
        writeChildNode,
    );
}

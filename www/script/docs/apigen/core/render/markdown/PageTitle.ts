import { Node } from '../../nodes';
import { Heading123456Node } from '../../nodes/Heading123456';
import { PageTitleBase } from '../../nodes/PageTitle';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteChildNode, ParamWriteRenderMarkdownNode } from '.';

export function writePageTitle<ChildNode extends Node>(
    pageTitle: PageTitleBase<ChildNode>,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    writeRenderMarkdownNode(
        Heading123456Node<ChildNode>({
            level: 1,
            includeLink: { alternateId: pageTitle.alternateId },
            children: pageTitle.children,
        }),
        output,
        writeChildNode,
    );
}

import { getRelativePath } from '../../../util/getRelativePath';
import { Node } from '../../nodes';
import { LinkNode } from '../../nodes/Link';
import { LocalPageLinkBase } from '../../nodes/LocalPageLink';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteChildNode, ParamWriteRenderMarkdownNode } from '.';

export function writeLocalPageLink<ChildNode extends Node>(
    localPageLink: LocalPageLinkBase<ChildNode>,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    const relativePath = getRelativePath(
        output.getPagePathFromPageId(output.pageId),
        `${output.getPagePathFromPageId(localPageLink.pageId)}#${
            localPageLink.hash !== undefined ? localPageLink.hash : 'readme'
        }`,
    );
    writeRenderMarkdownNode(
        LinkNode<ChildNode>({
            destination: relativePath,
            title: localPageLink.title,
            children: localPageLink.children,
        }),
        output,
        writeChildNode,
    );
}

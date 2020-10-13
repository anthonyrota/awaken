import { getRelativePath } from '../../../util/getRelativePath';
import { Node } from '../../nodes';
import { DocPageLinkBase } from '../../nodes/DocPageLink';
import { LinkNode } from '../../nodes/Link';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteChildNode, ParamWriteRenderMarkdownNode } from '.';

export function writeDocPageLink<ChildNode extends Node>(
    docPageLink: DocPageLinkBase<ChildNode>,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    const relativePath = getRelativePath(
        output.getPagePathFromPageId(output.pageId),
        `${output.getPagePathFromPageId(docPageLink.pageId)}#${
            docPageLink.hash !== undefined ? docPageLink.hash : 'readme'
        }`,
    );
    writeRenderMarkdownNode(
        LinkNode<ChildNode>({
            destination: relativePath,
            title: docPageLink.title,
            children: docPageLink.children,
        }),
        output,
        writeChildNode,
    );
}

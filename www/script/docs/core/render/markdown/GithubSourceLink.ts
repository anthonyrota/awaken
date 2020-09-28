import { getRelativePath } from '../../../util/getRelativePath';
import { Node } from '../../nodes';
import { GithubSourceLinkBase } from '../../nodes/GithubSourceLink';
import { LinkNode } from '../../nodes/Link';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteChildNode, ParamWriteRenderMarkdownNode } from '.';

export function writeGithubSourceLink<ChildNode extends Node>(
    githubSourceLink: GithubSourceLinkBase<ChildNode>,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    const relativePath = getRelativePath(
        output.getPagePathFromPageId(output.pageId),
        githubSourceLink.pathFromRoot,
    );
    writeRenderMarkdownNode(
        LinkNode<ChildNode>({
            destination: relativePath,
            title: githubSourceLink.title,
            children: githubSourceLink.children,
        }),
        output,
        writeChildNode,
    );
}

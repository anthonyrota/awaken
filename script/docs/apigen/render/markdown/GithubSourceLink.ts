import { Node } from '../../nodes';
import { GithubSourceLinkBase } from '../../nodes/GithubSourceLink';
import { LinkNode } from '../../nodes/Link';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteChildNode, ParamWriteCoreNode } from '.';

export function writeGithubSourceLink<ChildNode extends Node>(
    githubSourceLink: GithubSourceLinkBase<ChildNode>,
    output: MarkdownOutput,
    writeCoreNode: ParamWriteCoreNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    writeCoreNode(
        LinkNode<ChildNode>({
            destination: githubSourceLink.destination,
            title: githubSourceLink.title,
            children: githubSourceLink.children,
        }),
        output,
        writeChildNode,
    );
}

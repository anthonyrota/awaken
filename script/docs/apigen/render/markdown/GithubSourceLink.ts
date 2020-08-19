import { Link } from '../../nodes/Link';
import { GithubSourceLink } from '../../nodes/GithubSourceLink';
import { Node } from '../../nodes';
import { MarkdownOutput } from './MarkdownOutput';
import { writeLink } from './Link';
import { addChildrenC } from '../../nodes/abstract/ContainerBase';

export function writeGithubSourceLink<ChildNode extends Node>(
    githubSourceLink: GithubSourceLink<ChildNode>,
    output: MarkdownOutput,
    writeChildNode: (node: ChildNode, output: MarkdownOutput) => void,
): void {
    writeLink(
        addChildrenC(
            Link<ChildNode>({
                destination: githubSourceLink.destination,
                title: githubSourceLink.title,
            }),
            ...githubSourceLink.children,
        ),
        output,
        writeChildNode,
    );
}

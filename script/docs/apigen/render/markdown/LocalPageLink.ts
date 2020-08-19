import { Link } from '../../nodes/Link';
import { LocalPageLink } from '../../nodes/LocalPageLink';
import { Node } from '../../nodes';
import { MarkdownOutput } from './MarkdownOutput';
import { writeLink } from './Link';
import { addChildrenC } from '../../nodes/abstract/ContainerBase';

export function writeLocalPageLink<ChildNode extends Node>(
    localPageLink: LocalPageLink<ChildNode>,
    output: MarkdownOutput,
    writeChildNode: (node: ChildNode, output: MarkdownOutput) => void,
): void {
    const [path, hash] = localPageLink.destination.split('#');
    writeLink(
        addChildrenC(
            Link<ChildNode>({
                destination: path
                    ? hash
                        ? `${path}.md#${hash}`
                        : `${path}.md`
                    : `#${hash}`,
                title: localPageLink.title,
            }),
            ...localPageLink.children,
        ),
        output,
        writeChildNode,
    );
}

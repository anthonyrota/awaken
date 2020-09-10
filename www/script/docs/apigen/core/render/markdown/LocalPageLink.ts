import { Node } from '../../nodes';
import { LinkNode } from '../../nodes/Link';
import { LocalPageLinkBase } from '../../nodes/LocalPageLink';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteChildNode, ParamWriteCoreNode } from '.';

export function writeLocalPageLink<ChildNode extends Node>(
    localPageLink: LocalPageLinkBase<ChildNode>,
    output: MarkdownOutput,
    writeCoreNode: ParamWriteCoreNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    const [path, hash] = localPageLink.destination.split('#');
    writeCoreNode(
        LinkNode<ChildNode>({
            destination: path
                ? hash
                    ? `${path}.md#${hash}`
                    : `${path}.md#readme`
                : `#${hash}`,
            title: localPageLink.title,
            children: localPageLink.children,
        }),
        output,
        writeChildNode,
    );
}

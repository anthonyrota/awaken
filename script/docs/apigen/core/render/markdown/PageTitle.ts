import { Node } from '../../nodes';
import { Heading123456Node } from '../../nodes/Heading123456';
import { PageTitleBase } from '../../nodes/PageTitle';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteChildNode, ParamWriteCoreNode } from '.';

export function writePageTitle<ChildNode extends Node>(
    pageTitle: PageTitleBase<ChildNode>,
    output: MarkdownOutput,
    writeCoreNode: ParamWriteCoreNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    writeCoreNode(
        Heading123456Node<ChildNode>({
            level: 1,
            alternateId: pageTitle.alternateId,
            children: pageTitle.children,
        }),
        output,
        writeChildNode,
    );
}

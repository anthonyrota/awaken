import { Node, DeepCoreNode } from '../../nodes';
import { ContainerNode } from '../../nodes/Container';
import { DoNotEditCommentNode } from '../../nodes/DoNotEditComment';
import { PageBase } from '../../nodes/Page';
import { PageTitleNode } from '../../nodes/PageTitle';
import { PlainTextNode } from '../../nodes/PlainText';
import { TableOfContentsNode } from '../../nodes/TableOfContents';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteCoreNode, ParamWriteChildNode, writeDeepCoreNode } from '.';

export function writePage<ChildNode extends Node>(
    page: PageBase<ChildNode>,
    output: MarkdownOutput,
    writeCoreNode: ParamWriteCoreNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    writeCoreNode(DoNotEditCommentNode({}), output);
    writeDeepCoreNode(
        PageTitleNode<DeepCoreNode>({
            children: [PlainTextNode({ text: page.metadata.title })],
        }),
        output,
        writeCoreNode,
    );
    writeCoreNode(
        TableOfContentsNode({
            tableOfContents: page.metadata.table_of_contents,
        }),
        output,
    );
    writeCoreNode(
        ContainerNode({ children: page.children }),
        output,
        writeChildNode,
    );
    output.ensureNewLine();
}

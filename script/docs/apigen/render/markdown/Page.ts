import { Node, DeepCoreNode } from './../../nodes';
import { PageTitle } from './../../nodes/PageTitle';
import { PlainText } from './../../nodes/PlainText';
import { Page } from '../../nodes/Page';
import { MarkdownOutput } from './MarkdownOutput';
import { addChildrenC } from '../../nodes/abstract/ContainerBase';
import { DoNotEditComment } from '../../nodes/DoNotEditComment';
import { TableOfContents } from '../../nodes/TableOfContents';
import { writeContainerBase } from './ContainerBase';

export function writePage<ChildNode extends Node>(
    page: Page<ChildNode>,
    output: MarkdownOutput,
    writeChildNode: (node: ChildNode, output: MarkdownOutput) => void,
    writeDeepCoreNode: (node: DeepCoreNode, output: MarkdownOutput) => void,
): void {
    writeDeepCoreNode(DoNotEditComment(), output);
    writeDeepCoreNode(
        addChildrenC<DeepCoreNode, PageTitle<DeepCoreNode>>(
            PageTitle<DeepCoreNode>({}),
            PlainText({ text: page.metadata.title }),
        ),
        output,
    );
    writeDeepCoreNode(
        TableOfContents({ tableOfContents: page.metadata.table_of_contents }),
        output,
    );
    writeContainerBase(page, output, writeChildNode);
    output.ensureNewLine();
}

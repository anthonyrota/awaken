import { Node, CoreNodeType } from '../../nodes';
import { CollapsibleSectionBase } from '../../nodes/CollapsibleSection';
import { ContainerNode } from '../../nodes/Container';
import { HtmlElementNode } from '../../nodes/HtmlElement';
import { writeContainer } from './ContainerBase';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteCoreNode, ParamWriteChildNode } from '.';

export function writeCollapsibleSection<
    SummaryNode extends Node,
    ChildNode extends Node
>(
    collapsibleSection: CollapsibleSectionBase<SummaryNode, ChildNode>,
    output: MarkdownOutput,
    writeCoreNode: ParamWriteCoreNode,
    writeSummaryNode: ParamWriteChildNode<SummaryNode>,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    const detailsElement = HtmlElementNode({
        tagName: 'details',
        children: [
            HtmlElementNode<SummaryNode>({
                tagName: 'summary',
                children: [collapsibleSection.summaryNode],
            }),
            ContainerNode<ChildNode>({ children: collapsibleSection.children }),
        ],
    });
    writeCoreNode(detailsElement, output, (node) => {
        if (node.type === CoreNodeType.Container) {
            writeContainer(node, output, writeCoreNode, writeChildNode);
            return;
        }
        writeCoreNode(node, output, writeSummaryNode);
    });
}

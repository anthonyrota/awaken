import { Node, CoreNodeType } from '../../nodes';
import { CollapsibleSectionBase } from '../../nodes/CollapsibleSection';
import { ContainerNode } from '../../nodes/Container';
import { HtmlElementNode } from '../../nodes/HtmlElement';
import { writeContainer } from './ContainerBase';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteRenderMarkdownNode, ParamWriteChildNode } from '.';

export function writeCollapsibleSection<
    SummaryNode extends Node,
    ChildNode extends Node
>(
    collapsibleSection: CollapsibleSectionBase<SummaryNode, ChildNode>,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
    writeSummaryNode: ParamWriteChildNode<SummaryNode>,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    const containerNode = ContainerNode({
        children: collapsibleSection.children,
    });
    const detailsElement = HtmlElementNode({
        tagName: 'details',
        children: collapsibleSection.summaryNode
            ? [
                  HtmlElementNode<SummaryNode>({
                      tagName: 'summary',
                      children: [collapsibleSection.summaryNode],
                  }),
                  containerNode,
              ]
            : [containerNode],
    });
    writeRenderMarkdownNode(detailsElement, output, (node) => {
        if (node.type === CoreNodeType.Container) {
            writeContainer(
                node,
                output,
                writeRenderMarkdownNode,
                writeChildNode,
            );
            return;
        }
        writeRenderMarkdownNode(node, output, writeSummaryNode);
    });
}

import { Container } from '../../nodes/Container';
import { addChildrenC } from '../../nodes/abstract/ContainerBase';
import { HtmlElement } from '../../nodes/HtmlElement';
import { CollapsibleSection } from '../../nodes/CollapsibleSection';
import { Node, CoreNodeType } from '../../nodes';
import { MarkdownOutput } from './MarkdownOutput';
import { writeHtmlElement } from './HtmlElement';
import { writeContainerBase } from './ContainerBase';

export function writeCollapsibleSection<
    SummaryNode extends Node,
    ChildNode extends Node
>(
    collapsibleSection: CollapsibleSection<SummaryNode, ChildNode>,
    output: MarkdownOutput,
    writeSummaryNode: (node: SummaryNode, output: MarkdownOutput) => void,
    writeChildNode: (node: ChildNode, output: MarkdownOutput) => void,
): void {
    // Typescript...
    const detailsElement = addChildrenC<
        HtmlElement<SummaryNode> | Container<ChildNode>,
        HtmlElement<HtmlElement<SummaryNode> | Container<ChildNode>>
    >(
        HtmlElement<HtmlElement<SummaryNode> | Container<ChildNode>>({
            tagName: 'details',
        }),
        addChildrenC(
            HtmlElement<SummaryNode>({ tagName: 'summary' }),
            collapsibleSection.summaryNode,
        ),
        addChildrenC(Container<ChildNode>(), ...collapsibleSection.children),
    );
    writeHtmlElement(detailsElement, output, (node) => {
        if (node.type === CoreNodeType.Container) {
            writeContainerBase(node, output, writeChildNode);
            return;
        }
        writeHtmlElement(node, output, writeSummaryNode);
    });
}

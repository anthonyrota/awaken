import { ContainerBase, ContainerParameters } from './Container';
import { Node, CoreNodeType } from '.';

export interface CollapsibleSectionParameters<
    SummaryNode extends Node,
    ChildNode extends Node
> extends ContainerParameters<ChildNode> {
    summaryNode?: SummaryNode;
}

export interface CollapsibleSectionBase<
    SummaryNode extends Node,
    ChildNode extends Node
> extends ContainerBase<ChildNode> {
    summaryNode?: SummaryNode;
}

export function CollapsibleSectionBase<
    SummaryNode extends Node,
    ChildNode extends Node
>(
    parameters: CollapsibleSectionParameters<SummaryNode, ChildNode>,
): CollapsibleSectionBase<SummaryNode, ChildNode> {
    const collapsibleSection: CollapsibleSectionBase<
        SummaryNode,
        ChildNode
    > = ContainerBase({
        children: parameters.children,
    });
    if (parameters.summaryNode !== undefined) {
        collapsibleSection.summaryNode = parameters.summaryNode;
    }
    return collapsibleSection;
}

export interface CollapsibleSectionNode<
    SummaryNode extends Node,
    ChildNode extends Node
> extends CollapsibleSectionBase<SummaryNode, ChildNode>, Node {
    type: CoreNodeType.CollapsibleSection;
}

export function CollapsibleSectionNode<
    SummaryNode extends Node,
    ChildNode extends Node
>(
    parameters: CollapsibleSectionParameters<SummaryNode, ChildNode>,
): CollapsibleSectionNode<SummaryNode, ChildNode> {
    return {
        type: CoreNodeType.CollapsibleSection,
        ...CollapsibleSectionBase(parameters),
    };
}

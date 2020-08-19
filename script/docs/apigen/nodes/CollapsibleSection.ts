import { ContainerBase } from './abstract/ContainerBase';
import { Node, CoreNodeType } from '.';

export interface CollapsibleSection<
    SummaryNode extends Node,
    ChildNode extends Node
> extends ContainerBase<ChildNode> {
    type: CoreNodeType.CollapsibleSection;
    summaryNode: SummaryNode;
}

export interface CollapsibleSectionParameters<SummaryNode extends Node> {
    summaryNode: SummaryNode;
}

export function CollapsibleSection<
    SummaryNode extends Node,
    ChildNode extends Node
>(
    parameters: CollapsibleSectionParameters<SummaryNode>,
): CollapsibleSection<SummaryNode, ChildNode> {
    return {
        type: CoreNodeType.CollapsibleSection,
        summaryNode: parameters.summaryNode,
        ...ContainerBase<ChildNode>(),
    };
}

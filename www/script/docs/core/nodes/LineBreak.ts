import { Node, CoreNodeType } from '.';

export interface LineBreakParameters {}

export interface LineBreakBase {}

export function LineBreakBase(_parameters: LineBreakParameters): LineBreakBase {
    return {};
}

export interface LineBreakNode extends LineBreakBase, Node {
    type: CoreNodeType.LineBreak;
}

export function LineBreakNode(parameters: LineBreakParameters): LineBreakNode {
    return {
        type: CoreNodeType.LineBreak,
        ...LineBreakBase(parameters),
    };
}

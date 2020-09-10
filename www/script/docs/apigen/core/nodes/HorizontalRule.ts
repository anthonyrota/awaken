import { Node, CoreNodeType } from '.';

export interface HorizontalRuleParameters {}

export interface HorizontalRuleBase {}

export function HorizontalRuleBase(
    _parameters: HorizontalRuleParameters,
): HorizontalRuleBase {
    return {};
}

export interface HorizontalRuleNode extends HorizontalRuleBase, Node {
    type: CoreNodeType.HorizontalRule;
}

export function HorizontalRuleNode(
    parameters: HorizontalRuleParameters,
): HorizontalRuleNode {
    return {
        type: CoreNodeType.HorizontalRule,
        ...HorizontalRuleBase(parameters),
    };
}

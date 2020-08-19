import { Node, CoreNodeType } from '.';

export interface HorizontalRule extends Node {
    type: CoreNodeType.HorizontalRule;
}

export function HorizontalRule(): HorizontalRule {
    return {
        type: CoreNodeType.HorizontalRule,
    };
}

import { Node, CoreNodeType } from '.';

export interface PlainTextParameters {
    text: string;
}

export interface PlainTextBase {
    text: string;
}

export function PlainTextBase(parameters: PlainTextParameters): PlainTextBase {
    return {
        text: parameters.text,
    };
}

export interface PlainTextNode extends PlainTextBase, Node {
    type: CoreNodeType.PlainText;
}

export function PlainTextNode(parameters: PlainTextParameters): PlainTextNode {
    return {
        type: CoreNodeType.PlainText,
        ...PlainTextBase(parameters),
    };
}

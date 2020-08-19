const $$Text = Symbol('TextNode');

export interface Text {
    [$$Text]: void;
    text: string;
}

export interface TextParameters {
    text: string;
}

export function Text(parameters: TextParameters): Text {
    return {
        [$$Text]: undefined,
        text: parameters.text,
    };
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function isText(node: object): node is Text {
    return $$Text in node;
}

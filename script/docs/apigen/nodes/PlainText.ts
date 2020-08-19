import { Text } from './abstract/Text';
import { CoreNodeType } from '.';

export interface PlainText extends Text {
    type: CoreNodeType.PlainText;
}

export interface PlainTextParameters {
    text: string;
}

export function PlainText(parameters: PlainTextParameters): PlainText {
    return {
        type: CoreNodeType.PlainText,
        ...Text({ text: parameters.text }),
    };
}

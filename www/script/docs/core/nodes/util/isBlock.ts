import {
    HtmlTagClassification,
    getHtmlTagClassification,
} from '../HtmlElement';

import { DeepCoreNode, CoreNodeType } from '../index';

export function isBlock(node: DeepCoreNode): boolean {
    return (
        node.type === CoreNodeType.HorizontalRule ||
        (node.type === CoreNodeType.HtmlElement &&
            getHtmlTagClassification(node.tagName) !==
                HtmlTagClassification.Inline) ||
        node.type === CoreNodeType.BlockQuote ||
        node.type === CoreNodeType.CodeBlock ||
        node.type === CoreNodeType.Image ||
        node.type === CoreNodeType.Paragraph ||
        node.type === CoreNodeType.Heading123456 ||
        node.type === CoreNodeType.Heading ||
        node.type === CoreNodeType.Subheading ||
        node.type === CoreNodeType.Title ||
        node.type === CoreNodeType.List ||
        node.type === CoreNodeType.Table ||
        node.type === CoreNodeType.CollapsibleSection ||
        node.type === CoreNodeType.LineBreak ||
        node.type === CoreNodeType.PageTitle
    );
}

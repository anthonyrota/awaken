import { ContainerBase } from './abstract/ContainerBase';
import { Node, CoreNodeType } from '.';

export interface HtmlElement<ChildNode extends Node>
    extends ContainerBase<ChildNode> {
    type: CoreNodeType.HtmlElement;
    tagName: string;
    attributes?: Record<string, string>;
}

export interface HtmlElementParameters {
    tagName: string;
    attributes?: Record<string, string>;
}

export function HtmlElement<ChildNode extends Node>(
    parameters: HtmlElementParameters,
): HtmlElement<ChildNode> {
    const htmlElement: HtmlElement<ChildNode> = {
        type: CoreNodeType.HtmlElement,
        tagName: parameters.tagName,
        ...ContainerBase<ChildNode>(),
    };
    if (parameters.attributes) {
        htmlElement.attributes = parameters.attributes;
    }
    return htmlElement;
}

export enum HtmlTagClassification {
    Inline,
    Block,
    SelfClosing,
}

// prettier-ignore
const htmlBlockElements = new Set(['address', 'article', 'aside', 'blockquote', 'canvas', 'dd', 'div', 'dl', 'dt', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'header', 'hr', 'li', 'main', 'nav', 'noscript', 'ol', 'p', 'pre', 'section', 'table', 'tfoot', 'ul', 'video', 'base', 'basefont', 'body', 'caption', 'center', 'col', 'colgroup', 'details', 'dialog', 'dir', 'frame', 'frameset', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'hgroup', 'html', 'iframe', 'legend', 'link', 'menu', 'menuitem', 'meta', 'noframes', 'optgroup', 'option', 'param', 'source', 'title', 'summary', 'tbody', 'td', 'th', 'thead', 'tr', 'track']);
// prettier-ignore
const htmlSelfClosingElements = new Set(['area', 'base', 'basefont', 'br', 'col', 'command', 'embed', 'frame', 'hr', 'img', 'input', 'isindex', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

export function getHtmlTagClassification(
    tagName: string,
): HtmlTagClassification {
    return htmlBlockElements.has(tagName)
        ? HtmlTagClassification.Block
        : htmlSelfClosingElements.has(tagName)
        ? HtmlTagClassification.SelfClosing
        : HtmlTagClassification.Inline;
}

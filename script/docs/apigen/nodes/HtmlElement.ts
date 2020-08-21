import { ContainerBase, ContainerParameters } from './Container';
import { Node, CoreNodeType } from '.';

export interface HtmlElementParameters<ChildNode extends Node>
    extends ContainerParameters<ChildNode> {
    tagName: string;
    attributes?: Record<string, string>;
}

export interface HtmlElementBase<ChildNode extends Node>
    extends ContainerBase<ChildNode> {
    tagName: string;
    attributes?: Record<string, string>;
}

export function HtmlElementBase<ChildNode extends Node>(
    parameters: HtmlElementParameters<ChildNode>,
): HtmlElementBase<ChildNode> {
    const htmlElementBase: HtmlElementBase<ChildNode> = {
        tagName: parameters.tagName,
        ...ContainerBase<ChildNode>({ children: parameters.children }),
    };
    if (parameters.attributes) {
        htmlElementBase.attributes = parameters.attributes;
    }
    return htmlElementBase;
}

export interface HtmlElementNode<ChildNode extends Node>
    extends HtmlElementBase<ChildNode>,
        Node {
    type: CoreNodeType.HtmlElement;
}

export function HtmlElementNode<ChildNode extends Node>(
    parameters: HtmlElementParameters<ChildNode>,
): HtmlElementNode<ChildNode> {
    return {
        type: CoreNodeType.HtmlElement,
        ...HtmlElementBase(parameters),
    };
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

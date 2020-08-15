/* eslint-disable max-len */
/**
 * Thanks to the api-documenter team for some ideas used in this script:
 *
 * https://github.com/microsoft/rushstack/blob/e7e9429/apps/api-documenter/src/nodes/DocTable.ts
 *
 * The api-documenter project is licensed under MIT, and its license can be found at <rootDir>/vendor/licenses/@microsoft/api-documenter/LICENSE
 */
/* eslint-enable max-len */

import * as unified from 'unified';
import * as remarkParse from 'remark-parse';
import * as mdast from 'mdast';
import * as definitions from 'mdast-util-definitions';
import * as htmlparser2 from 'htmlparser2';
import { IndentedWriter } from './util';
import {
    TableOfContentsInlineReference,
    TableOfContentsNestedReference,
    TableOfContents as TableOfContents_,
    PageMetadata,
} from './../pageMetadata';

export class MarkdownOutput extends IndentedWriter {
    private _inSingleLineCodeBlock = false;
    private _inTable = false;
    private _writeSingleLine = false;
    private _inHtmlBlockTag = false;
    private _inMarkdownCode = false;
    private _inListNode = false;
    private _inHtmlAttribute = false;
    private _isMarkedNewParagraph = false;
    private _writingInlineHtmlTag = false;

    public withInTable(write: () => void): void {
        const before = this._inTable;
        this._inTable = true;
        write();
        this._inTable = before;
    }

    public withInSingleLineCodeBlock(write: () => void): void {
        const before = this._inSingleLineCodeBlock;
        this._inSingleLineCodeBlock = true;
        write();
        this._inSingleLineCodeBlock = before;
    }

    public withInSingleLine(write: () => void): void {
        const before = this._writeSingleLine;
        this._writeSingleLine = true;
        write();
        this._writeSingleLine = before;
    }

    public withInHtmlBlockTag(write: () => void): void {
        const before = this._inHtmlBlockTag;
        this._inHtmlBlockTag = true;
        write();
        this._inHtmlBlockTag = before;
    }

    public withInMarkdownCode(write: () => void): void {
        const before = this._inMarkdownCode;
        this._inMarkdownCode = true;
        write();
        this._inMarkdownCode = before;
    }

    public withInListNode(write: () => void): void {
        const before = this._inListNode;
        this._inListNode = true;
        write();
        this._inListNode = before;
    }

    public withInHtmlAttribute(write: () => void): void {
        const before = this._inHtmlAttribute;
        this._inHtmlAttribute = true;
        write();
        this._inHtmlAttribute = before;
    }

    public withParagraphBreak(write: () => void): void {
        if (this._isMarkedNewParagraph) {
            write();
            return;
        }
        if (this.constrainedToSingleLine) {
            throw new Error(
                'Cannot start new paragraph if constrained to single line.',
            );
        }
        if (!this._isMarkedNewParagraph) {
            this.ensureSkippedLine();
            // Content after skipped line in block tag is parsed as markdown.
            this._inHtmlBlockTag = false;
            this.markStartOfParagraph();
        }
        write();
    }

    public markStartOfParagraph(): void {
        this._isMarkedNewParagraph = true;
    }

    public withWritingInlineHtmlTag(write: () => void): void {
        const before = this._writingInlineHtmlTag;
        this._writingInlineHtmlTag = true;
        write();
        this._writingInlineHtmlTag = before;
    }

    public get constrainedToSingleLine(): boolean {
        return this._writeSingleLine || this._inTable;
    }

    public get inTable(): boolean {
        return this._inTable;
    }

    public get inSingleLineCodeBlock(): boolean {
        return this._inSingleLineCodeBlock;
    }

    public get inHtmlBlockTag(): boolean {
        return this._inHtmlBlockTag;
    }

    public get inMarkdownCode(): boolean {
        return this._inMarkdownCode;
    }

    public get inListNode(): boolean {
        return this._inListNode;
    }

    public get inHtmlAttribute(): boolean {
        return this._inHtmlAttribute;
    }

    public get isMarkedNewParagraph(): boolean {
        return this._isMarkedNewParagraph;
    }

    protected _write(str: string): void {
        if (this.constrainedToSingleLine && /[\n\r]/.test(str)) {
            throw new Error('Newline when constrained to single line.');
        }
        if (
            this._isMarkedNewParagraph &&
            !this._writingInlineHtmlTag &&
            /\S/.test(str)
        ) {
            this._isMarkedNewParagraph = false;
        }
        super._write(str);
    }
}

export abstract class Node {
    abstract writeAsMarkdown(output: MarkdownOutput): void;

    public renderAsMarkdown(): string {
        const output = new MarkdownOutput();
        this.writeAsMarkdown(output);
        return output.toString();
    }
}

export class Container<T extends Node = Node> extends Node {
    protected _children: T[] = [];

    public setChildren(children: T[]): this {
        this._children = children;
        return this;
    }

    public addChild(child: T): this {
        this._children.push(child);
        return this;
    }

    public addChildren(...children: T[]): this {
        this._children.push(...children);
        return this;
    }

    public getChildren(): T[] {
        return this._children;
    }

    public getChildCount(): number {
        return this._children.length;
    }

    public getLastNestedChild(): Node | void {
        for (let i = this._children.length - 1; i >= 0; i--) {
            const child = this._children[i];
            if (child instanceof Container) {
                if (child._children.length !== 0) {
                    const last = child.getLastNestedChild();
                    if (last) {
                        return last;
                    }
                }
            } else {
                return child;
            }
        }
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        for (const child of this._children) {
            child.writeAsMarkdown(output);
        }
    }
}

const newlineRegexp = /\r?\n/g;

export class RawText extends Node {
    constructor(public text: string) {
        super();
    }

    public append(text: string) {
        this.text += text;
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        output.write(this.text);
    }
}

function escapeHashAtEnd(str: string): string {
    return `${str.slice(0, -1)}\\#`;
}

export class PlainText extends RawText {
    public writeAsMarkdown(output: MarkdownOutput): void {
        let { text } = this;

        if (!output.inMarkdownCode) {
            text = text
                .replace(/"/g, '&quot;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

            if (!output.inHtmlBlockTag) {
                // Escape four space code blocks: Space -> Em space.
                text = text.replace(/^ {4}/gm, ' '.repeat(4));
            }

            if (output.inTable) {
                text = text.replace(/\|/g, '&#124;');
                if (!output.inSingleLineCodeBlock && !output.inHtmlAttribute) {
                    text = text.replace(newlineRegexp, '<br>');
                }
            }

            if (!output.inHtmlBlockTag) {
                text = text
                    .replace(/\\/, '\\\\')
                    .replace(/[*/()[\]<>_]/g, '\\$&')
                    .replace(/\n\s*#/g, escapeHashAtEnd);

                let isOnlyWhitespace = true;
                for (const char of output.iterateCharactersBackwards()) {
                    if (char === '\n') {
                        break;
                    }
                    if (char !== ' ') {
                        isOnlyWhitespace = false;
                        break;
                    }
                }
                if (isOnlyWhitespace) {
                    text = text.replace(/^\s*#/g, escapeHashAtEnd);
                }
            }

            if (output.inHtmlAttribute) {
                text = text.replace(newlineRegexp, '\\n');
            } else if (output.inSingleLineCodeBlock) {
                text = text.split(newlineRegexp).join('</code><br><code>');
            } else if (output.inHtmlBlockTag && !output.inTable) {
                text = text.replace(newlineRegexp, '<br>');
            }
        }

        output.write(text);
    }
}

export function writePlainText(output: MarkdownOutput, text: string): void {
    new PlainText(text).writeAsMarkdown(output);
}

const remark = unified().use(remarkParse);

export function parseMarkdown(
    text: string,
    opt?: {
        unwrapFirstLineParagraph?: boolean;
    },
): Container {
    const rootNode = remark.parse(text) as mdast.Root;
    const definition = definitions(rootNode);

    let htmlParserContainer: Container;
    const htmlParser = new htmlparser2.Parser({
        onerror(error): void {
            throw error;
        },
        onopentag(tagName, attributes): void {
            tagName;
            attributes;
            // TODO.
            throw new Error('Unexpected html tag.');
        },
        onclosetag(tagName): void {
            tagName;
            // TODO.
        },
        ontext(text: string): void {
            text;
            // TODO.
            throw new Error('Unexpected html text.');
        },
        oncomment(comment: string): void {
            htmlParserContainer.addChild(new HtmlComment(comment));
        },
        oncdatastart(): void {
            throw new Error('Unexpected CDATA.');
        },
        onprocessinginstruction(): void {
            throw new Error('Unexpected processing instruction.');
        },
    });

    // https://github.com/syntax-tree/mdast
    function traverseNode(container: Container, node: mdast.Content): void {
        switch (node.type) {
            case 'paragraph': {
                if (!node.position) {
                    throw new Error('No.');
                }
                if (
                    opt?.unwrapFirstLineParagraph &&
                    node.position.start.column === 1 &&
                    node.position.start.line === 1
                ) {
                    traverseChildren(container, node);
                    break;
                }
                const paragraph = new Paragraph();
                container.addChild(paragraph);
                traverseChildren(paragraph, node);
                break;
            }
            case 'heading': {
                let heading: Container;
                switch (node.depth) {
                    case 2: {
                        heading = new Heading();
                        break;
                    }
                    case 3: {
                        heading = new Subheading();
                        break;
                    }
                    case 4: {
                        heading = new Title();
                        break;
                    }
                    default: {
                        throw new Error(
                            `Unsupported heading depth: ${node.depth}.`,
                        );
                    }
                }
                container.addChild(heading);
                traverseChildren(heading, node);
                break;
            }
            case 'thematicBreak': {
                container.addChild(new HorizontalRule());
                break;
            }
            case 'blockquote': {
                const blockQuote = new BlockQuote();
                container.addChild(blockQuote);
                traverseChildren(blockQuote, node);
                break;
            }
            case 'listItem': {
                throw new Error('Unexpected list item node.');
            }
            case 'list': {
                const list = new List(
                    node.ordered ?? undefined,
                    node.start ?? undefined,
                );
                container.addChild(list);
                for (const childNode of node.children) {
                    const container = new Container();
                    list.addChild(container);
                    if (childNode.type === 'listItem') {
                        if (childNode.checked !== null) {
                            throw new Error(
                                `Unsupported list item type. ${JSON.stringify(
                                    node,
                                    null,
                                    2,
                                )}`,
                            );
                        }
                        traverseChildren(container, childNode);
                        continue;
                    }
                    traverseNode(container, childNode);
                }
                break;
            }
            case 'table': {
                // TODO: support different align types.
                if (node.align && node.align.some((item) => item !== null)) {
                    throw new Error('Unsupported table align.');
                }
                if (node.children.length === 0) {
                    throw new Error('Table has no rows.');
                }
                const heading = parseTableRow(node.children[0]);
                const table = new Table(heading);
                for (const child of node.children.slice(1)) {
                    table.addChild(parseTableRow(child));
                }
                break;
            }
            case 'tableRow': {
                throw new Error('Unexpected table row.');
            }
            case 'tableCell': {
                throw new Error('Unexpected table cell.');
            }
            case 'html': {
                htmlParserContainer = container;
                htmlParser.write(node.value);
                break;
            }
            case 'code': {
                if (node.meta !== null) {
                    throw new Error('Invalid code block.');
                }
                const codeBlock = new CodeBlock(node.lang, node.value);
                container.addChild(codeBlock);
                break;
            }
            case 'definition': {
                // Don't output.
                break;
            }
            case 'footnoteDefinition': {
                throw new Error('Footnote definitions are not supported.');
            }
            case 'text': {
                container.addChild(new PlainText(node.value));
                break;
            }
            case 'emphasis': {
                const italics = new Italics();
                container.addChild(italics);
                traverseChildren(italics, node);
                break;
            }
            case 'strong': {
                const bold = new Bold();
                container.addChild(bold);
                traverseChildren(bold, node);
                break;
            }
            case 'delete': {
                const strikethrough = new Strikethrough();
                container.addChild(strikethrough);
                traverseChildren(strikethrough, node);
                break;
            }
            case 'inlineCode': {
                const inlineCode = new CodeSpan().addChild(
                    new PlainText(node.value),
                );
                container.addChild(inlineCode);
                break;
            }
            case 'break': {
                throw new Error(
                    'Markdown breaks are not supported. Trailing spaces representing line breaks is unpleasant.',
                );
            }
            case 'link': {
                const link = new Link(node.url, node.title);
                container.addChild(link);
                traverseChildren(link, node);
                break;
            }
            case 'image': {
                const image = new Image(node.url, node.title, node.alt);
                container.addChild(image);
                break;
            }
            case 'linkReference': {
                const definitionNode = definition(node.identifier);
                if (!definitionNode) {
                    throw new Error(
                        `No definition found for identifier ${node.identifier}`,
                    );
                }
                const link = new Link(definitionNode.url, definitionNode.title);
                container.addChild(link);
                if (node.children.length > 0) {
                    traverseChildren(link, node);
                } else {
                    link.addChild(
                        new PlainText(
                            node.label ||
                                definitionNode.label ||
                                node.identifier,
                        ),
                    );
                }
                break;
            }
            case 'imageReference': {
                const definitionNode = definition(node.identifier);
                if (!definitionNode) {
                    throw new Error(
                        `No definition found for identifier ${node.identifier}`,
                    );
                }
                const image = new Image(
                    definitionNode.url,
                    definitionNode.title,
                    node.alt,
                );
                container.addChild(image);
                break;
            }
            case 'footnote': {
                // TODO: support footnotes.
                throw new Error('Footnotes are not supported.');
            }
            default: {
                console.error(`Unknown node type ${node.type}`);
                console.dir(node);
            }
        }
    }

    function parseTableRow(node: mdast.TableRow): TableRow {
        const row = new TableRow();
        // Loop over cells.
        for (const childNode of node.children) {
            const container = new Container();
            row.addChild(container);
            traverseChildren(container, childNode);
        }
        return row;
    }

    function traverseChildren(
        container: Container,
        parent: mdast.Parent,
    ): void {
        for (const node of parent.children) {
            traverseNode(container, node);
        }
    }

    const container = new Container();
    traverseChildren(container, rootNode);
    return container;
}

export class HorizontalRule extends Node {
    public writeAsMarkdown(output: MarkdownOutput): void {
        if (output.constrainedToSingleLine) {
            new HtmlElement('hr').writeAsMarkdown(output);
        } else {
            output.withParagraphBreak(() => {
                output.writeLine('---');
            });
        }
    }
}

export class HtmlComment extends Node {
    constructor(public comment: string, private _persist = true) {
        super();
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        if (this._persist) {
            output.write('<!--');
            output.write(this.comment);
            output.write('-->');
            return;
        }
        throw new Error(
            'Attempted to write a HtmlComment node to output. HtmlComment nodes are only used for metadata when parsing TSDoc comments.',
        );
    }
}

export class BlockQuote extends Container {
    public writeAsMarkdown(output: MarkdownOutput): void {
        if (output.constrainedToSingleLine) {
            new HtmlElement('blockquote')
                .addChildren(...this._children)
                .writeAsMarkdown(output);
            return;
        }
        output.withParagraphBreak(() => {
            output.withIndent('> ', () => super.writeAsMarkdown(output));
        });
    }
}

// prettier-ignore
const htmlBlockElements = new Set(['address', 'article', 'aside', 'blockquote', 'canvas', 'dd', 'div', 'dl', 'dt', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'header', 'hr', 'li', 'main', 'nav', 'noscript', 'ol', 'p', 'pre', 'section', 'table', 'tfoot', 'ul', 'video', 'base', 'basefont', 'body', 'caption', 'center', 'col', 'colgroup', 'details', 'dialog', 'dir', 'frame', 'frameset', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'hgroup', 'html', 'iframe', 'legend', 'link', 'menu', 'menuitem', 'meta', 'noframes', 'optgroup', 'option', 'param', 'source', 'title', 'summary', 'tbody', 'td', 'th', 'thead', 'tr', 'track']);
// prettier-ignore
const htmlSelfClosingElements = new Set(['area', 'base', 'basefont', 'br', 'col', 'command', 'embed', 'frame', 'hr', 'img', 'input', 'isindex', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

export const enum HtmlTagClassification {
    Inline,
    Block,
    SelfClosing,
}

export class HtmlElement extends Container {
    public classification: HtmlTagClassification = htmlBlockElements.has(
        this.tagName,
    )
        ? HtmlTagClassification.Block
        : htmlSelfClosingElements.has(this.tagName)
        ? HtmlTagClassification.SelfClosing
        : HtmlTagClassification.Inline;

    constructor(
        public tagName: string,
        private _attributesMap?: Map<string, string>,
    ) {
        super();
    }

    private _writeStartTag(output: MarkdownOutput): void {
        output.write('<');
        writePlainText(output, this.tagName);
        if (this._attributesMap) {
            for (const [attributeName, attributeValue] of this._attributesMap) {
                output.write(' ');
                output.write(attributeName);
                output.write('="');
                writePlainText(output, attributeValue);
                output.write('"');
            }
        }
        output.write('>');
    }

    private _writeEndTag(output: MarkdownOutput): void {
        output.write('</');
        writePlainText(output, this.tagName);
        output.write('>');
    }

    private _writeAsBlockElement(output: MarkdownOutput): void {
        this._writeStartTag(output);
        output.markStartOfParagraph();
        output.withInHtmlBlockTag(() => {
            super.writeAsMarkdown(output);
        });
        this._writeEndTag(output);
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        if (this.classification === HtmlTagClassification.Block) {
            if (this.tagName === 'p') {
                output.withParagraphBreak(() => {
                    super.writeAsMarkdown(output);
                });
                return;
            }
            if (output.constrainedToSingleLine) {
                this._writeAsBlockElement(output);
            } else {
                output.withParagraphBreak(() => {
                    this._writeAsBlockElement(output);
                });
            }
            return;
        }
        if (this.classification === HtmlTagClassification.SelfClosing) {
            this._writeStartTag(output);
            return;
        }
        // If marked new paragraph -> opening inline html shouldn't affect.
        output.withWritingInlineHtmlTag(() => {
            this._writeStartTag(output);
        });
        super.writeAsMarkdown(output);
        this._writeEndTag(output);
    }
}

export class Italics extends HtmlElement {
    constructor() {
        super('i');
    }
}

export class Bold extends HtmlElement {
    constructor() {
        super('b');
    }
}

export class Strikethrough extends HtmlElement {
    constructor() {
        super('s');
    }
}

export class CodeSpan extends HtmlElement {
    constructor() {
        super('code');
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        output.withInSingleLine(() => {
            super.writeAsMarkdown(output);
        });
    }
}

export class CodeBlock extends Node {
    constructor(private _language: string | undefined, private _code: string) {
        super();
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        if (output.constrainedToSingleLine) {
            output.withInSingleLineCodeBlock(() => {
                new HtmlElement('code')
                    .addChild(new PlainText(this._code))
                    .writeAsMarkdown(output);
            });
            return;
        }

        output.withParagraphBreak(() => {
            output.withInMarkdownCode(() => {
                output.write('```');
                if (this._language) {
                    writePlainText(output, this._language);
                }
                output.writeLine();
                output.write(this._code);
                output.ensureNewLine();
            });
            output.write('```');
        });
    }
}

export class RichCodeBlock extends Container {
    constructor(private _language: string) {
        super();
        this._language;
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        if (output.constrainedToSingleLine) {
            output.withInSingleLineCodeBlock(() => {
                new HtmlElement('code')
                    .setChildren(this._children)
                    .writeAsMarkdown(output);
            });
            return;
        }

        new HtmlElement('pre')
            .setChildren(this._children)
            .writeAsMarkdown(output);
    }
}

export class Link extends Container {
    constructor(private _destination: string, private _title?: string) {
        super();
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        output.withInSingleLine(() => {
            if (output.inHtmlBlockTag && !output.inTable) {
                // TODO: add property support to html element construct.
                const attributeMap = new Map<string, string>([
                    ['href', this._destination],
                ]);
                if (this._title != null) {
                    attributeMap.set('title', this._title);
                }
                new HtmlElement('a', attributeMap)
                    .addChildren(...this._children)
                    .writeAsMarkdown(output);
                return;
            }
            output.write('[');
            super.writeAsMarkdown(output);
            output.write('](');
            writePlainText(output, this._destination);
            if (this._title) {
                output.write(' "');
                writePlainText(output, this._title);
                output.write('"');
            }
            output.write(')');
        });
    }
}

export class LocalPageLink extends Container {
    constructor(private _destination: string, private _title?: string) {
        super();
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        const [path, hash] = this._destination.split('#');
        new Link(
            path ? (hash ? `${path}.md#${hash}` : `${path}.md`) : `#${hash}`,
            this._title,
        )
            .setChildren(this._children)
            .writeAsMarkdown(output);
    }
}

export class Image extends Node {
    constructor(
        private _src: string,
        private _title?: string,
        private _alt?: string,
    ) {
        super();
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        output.withInSingleLine(() => {
            if (output.inHtmlBlockTag && !output.inTable) {
                const attributeMap = new Map<string, string>([
                    ['src', this._src],
                ]);
                if (this._title) {
                    attributeMap.set('title', this._title);
                }
                if (this._alt) {
                    attributeMap.set('alt', this._alt);
                }
                new HtmlElement('img', attributeMap).writeAsMarkdown(output);
            }
            output.write('![');
            if (this._alt) writePlainText(output, this._alt);
            output.write('](');
            writePlainText(output, this._src);
            if (this._title) {
                output.write(' "');
                writePlainText(output, this._title);
                output.write('"');
            }
            output.write(')');
        });
    }
}

export class Paragraph extends Container {
    public writeAsMarkdown(output: MarkdownOutput): void {
        new HtmlElement('p')
            .addChildren(...this._children)
            .writeAsMarkdown(output);
    }
}

export class FunctionalNode extends Node {
    constructor(public writeAsMarkdown: () => void) {
        super();
    }
}

class HeadingBase extends Container {
    constructor(
        private _level: 1 | 2 | 3 | 4 | 5 | 6,
        private _alternateId?: string,
    ) {
        super();
    }

    private _writeInsides(output: MarkdownOutput): void {
        output.withInSingleLine(() => {
            if (this._alternateId) {
                new HtmlElement(
                    'a',
                    new Map([['name', this._alternateId]]),
                ).writeAsMarkdown(output);
            }
            super.writeAsMarkdown(output);
        });
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        if (output.constrainedToSingleLine) {
            new HtmlElement(`h${this._level}`).addChild(
                new FunctionalNode(() => this._writeInsides(output)),
            );
            return;
        }

        output.withParagraphBreak(() => {
            output.write(`${'#'.repeat(this._level)} `);
            this._writeInsides(output);
        });
    }
}

export class Heading extends HeadingBase {
    constructor(alternateId?: string) {
        super(2, alternateId);
    }
}

export class Subheading extends HeadingBase {
    constructor(alternateId?: string) {
        super(3, alternateId);
    }
}

export class Title extends Container {
    public writeAsMarkdown(output: MarkdownOutput): void {
        new Paragraph()
            // At the time of writing Github styles regular text and h4 elements
            // with the same font size. Therefore rendering titles as bold spans
            // will ensure that an anchor is not generated for this node in the
            // rendered html.
            .addChild(new HtmlElement('b').setChildren(this._children))
            .writeAsMarkdown(output);
    }
}

export class List extends Container {
    constructor(private _ordered?: boolean, private _start = 1) {
        super();
    }

    private _writeListItems(output: MarkdownOutput): void {
        for (const [i, child] of this._children.entries()) {
            if (i !== 0) {
                output.ensureNewLine();
            }
            const listMarker = this._ordered ? `${this._start + i}. ` : '- ';
            output.write(listMarker);
            output.withIndent(' '.repeat(listMarker.length), () => {
                output.markStartOfParagraph();
                output.withInListNode(() => child.writeAsMarkdown(output));
            });
        }
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        if (output.constrainedToSingleLine) {
            const htmlElement = this._ordered
                ? new HtmlElement('ol', new Map([['start', `${this._start}`]]))
                : new HtmlElement('ul');
            for (const child of this._children) {
                htmlElement.addChild(new HtmlElement('li').addChild(child));
            }
            htmlElement.writeAsMarkdown(output);
            return;
        }
        if (output.inListNode) {
            output.ensureNewLine();
            this._writeListItems(output);
            return;
        }
        output.withParagraphBreak(() => this._writeListItems(output));
    }
}

export class TableRow extends Container {
    public writeAsMarkdown(
        output: MarkdownOutput,
        columnCount = this.getChildCount(),
    ): void {
        output.write('|');
        for (const cell of this._children) {
            output.write(' ');
            output.markStartOfParagraph();
            output.withInTable(() => {
                cell.writeAsMarkdown(output);
            });
            output.write(' |');
        }
        output.write(
            '  |'.repeat(Math.max(0, columnCount - this.getChildCount())),
        );
    }
}

export class Table extends Container<TableRow> {
    public constructor(private readonly _header: TableRow) {
        super();
    }

    private _getColumnCount(): number {
        const columnCount = Math.max(
            this._header?.getChildCount() ?? 0,
            ...this._children.map((child) => child.getChildCount()),
        );

        if (columnCount === 0) {
            throw new Error('No columns.');
        }

        return columnCount;
    }

    private _buildRowAsHtmlElement(
        row: TableRow,
        cellTagName: string,
        columnCount: number,
    ): HtmlElement {
        const tableRow = new HtmlElement('tr');
        const children = row.getChildren();
        for (const child of children) {
            tableRow.addChild(new HtmlElement(cellTagName).addChild(child));
        }
        for (let i = children.length; i < columnCount; i++) {
            tableRow.addChild(new HtmlElement(cellTagName));
        }
        return tableRow;
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        const columnCount = this._getColumnCount();

        if (output.constrainedToSingleLine) {
            const tableElement = new HtmlElement('table');
            if (this._header) {
                tableElement.addChild(
                    this._buildRowAsHtmlElement(
                        this._header,
                        'th',
                        columnCount,
                    ),
                );
            }
            for (const row of this._children) {
                tableElement.addChild(
                    this._buildRowAsHtmlElement(row, 'td', columnCount),
                );
            }
            tableElement.writeAsMarkdown(output);
        }

        output.withParagraphBreak(() => {
            if (this._header) {
                this._header.writeAsMarkdown(output, columnCount);
            } else {
                output.write('|  '.repeat(columnCount));
                output.write('|');
            }

            // Divider.
            output.writeLine();
            output.write('| --- '.repeat(this._getColumnCount()));
            output.write('|');

            for (const child of this._children) {
                output.ensureNewLine();
                child.writeAsMarkdown(output, columnCount);
            }
        });
    }
}

export class CollapsibleSection extends HtmlElement {
    constructor(summaryNode: Node) {
        super('details');
        this.addChild(new HtmlElement('summary').addChild(summaryNode));
    }
}

export class PageTitle extends HeadingBase {
    constructor(alternateId?: string) {
        super(1, alternateId);
    }
}

export class TableOfContentsList extends Node {
    constructor(
        private _toc: TableOfContents_,
        private _relativePagePath = '',
    ) {
        super();
    }

    private _buildTableOfContentsLink(
        reference: TableOfContentsInlineReference,
    ): Node {
        return new LocalPageLink(
            `${this._relativePagePath}#${reference.url_hash_text}`,
        ).addChild(new CodeSpan().addChild(new PlainText(reference.text)));
    }

    private _buildTableOfContentsListItem(
        reference: TableOfContentsNestedReference,
    ): Container {
        const listItem = new Container().addChild(
            this._buildTableOfContentsLink(reference),
        );
        if (
            reference.inline_references &&
            reference.inline_references.length > 0
        ) {
            listItem.addChild(new PlainText(' - '));
            for (const [
                i,
                inlineReference,
            ] of reference.inline_references.entries()) {
                if (i !== 0) {
                    listItem.addChild(new PlainText(', '));
                }
                listItem.addChild(
                    this._buildTableOfContentsLink(inlineReference),
                );
            }
        }
        return listItem;
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        const contentsList = new List(true);
        for (const mainReference of this._toc) {
            const listItem = this._buildTableOfContentsListItem(mainReference);
            contentsList.addChild(listItem);
            if (mainReference.nested_references) {
                const nestedList = new List(true);
                listItem.addChild(nestedList);
                for (const nestedReference of mainReference.nested_references) {
                    nestedList.addChild(
                        this._buildTableOfContentsListItem(nestedReference),
                    );
                }
            }
        }
        contentsList.writeAsMarkdown(output);
    }
}

export class TableOfContents extends Node {
    constructor(
        private _toc: TableOfContents_,
        private _relativePagePath?: string,
    ) {
        super();
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        new CollapsibleSection(
            new Bold().addChild(new PlainText('Table of Contents')),
        )
            .addChildren(
                new HtmlElement('br'),
                new TableOfContentsList(this._toc, this._relativePagePath),
            )
            .writeAsMarkdown(output);
    }
}

export class DoNotEditComment extends Node {
    public writeAsMarkdown(output: MarkdownOutput): void {
        new BlockQuote()
            .addChildren(
                new PlainText(
                    // TODO: make two spaces at end mean break in md parsing.
                    'This file is automatically generated by a build script.',
                ),
                new HtmlElement('br'),
                new PlainText(
                    'If you notice anything off, please feel free to open a new issue!',
                ),
            )
            .writeAsMarkdown(output);
    }
}

export class Page extends Container {
    constructor(private _metadata: PageMetadata) {
        super();
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        new Container()
            .addChild(new DoNotEditComment())
            .addChild(
                new PageTitle().addChild(new PlainText(this._metadata.title)),
            )
            .addChild(new TableOfContents(this._metadata.table_of_contents))
            .writeAsMarkdown(output);
        super.writeAsMarkdown(output);
        output.ensureNewLine();
    }
}

/* eslint-disable max-len */
/**
 * Thanks to the api-documenter team for some ideas used in this script:
 *
 * https://github.com/microsoft/rushstack/blob/e7e9429/apps/api-documenter/src/nodes/DocTable.ts
 *
 * The api-documenter project is licensed under MIT, and its license can be found at <rootDir>/vendor/licenses/@microsoft/api-documenter/LICENSE
 */
/* eslint-enable max-len */

import * as unist from 'unist';
import * as unified from 'unified';
import * as remarkParse from 'remark-parse';
import { IndentedWriter } from './util';
import { htmlBlockElements } from './htmlBlockElements';
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
    private _inParagraphNode = false;
    private _inListNode = false;
    private _isMarkedNewParagraph = false;

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

    public withInParagraphNode(write: () => void): void {
        const before = this._inParagraphNode;
        this._inParagraphNode = true;
        write();
        this._inParagraphNode = before;
    }

    public withInListNode(write: () => void): void {
        const before = this._inListNode;
        this._inListNode = true;
        write();
        this._inListNode = before;
    }

    public withMarkedNewParagraph(write: () => void): void {
        this._inHtmlBlockTag = false;
        this._isMarkedNewParagraph = true;
        write();
        this._isMarkedNewParagraph = false;
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

    public get inParagraphNode(): boolean {
        return this._inParagraphNode;
    }

    public get inListNode(): boolean {
        return this._inListNode;
    }

    public ensureNewParagraph(): void {
        if (this._isMarkedNewParagraph) {
            this._isMarkedNewParagraph = false;
            return;
        }
        this._inHtmlBlockTag = false;
        super.ensureSkippedLine();
    }

    protected _write(str: string): void {
        if (this.constrainedToSingleLine && /[\n\r]/.test(str)) {
            throw new Error('Newline when constrained to single line.');
        }
        if (this._isMarkedNewParagraph && /\S/.test(str)) {
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

            if (output.inTable) {
                text = text.replace(/\|/g, '&#124;');
                if (!output.inSingleLineCodeBlock) {
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

            if (output.inSingleLineCodeBlock) {
                text = text.split(newlineRegexp).join('</code><br><code>');
            } else if (output.inHtmlBlockTag && !output.inTable) {
                const before = text;
                text = text.replace(/(\r?\n){2}/, '<br><br>');
                if (output.constrainedToSingleLine && before !== text) {
                    throw new Error(
                        "Can't have multiline text when constrained to single line.",
                    );
                }
            }
        }

        output.write(text);
    }
}

export function writePlainText(output: MarkdownOutput, text: string): void {
    new PlainText(text).writeAsMarkdown(output);
}

const remark = unified().use(remarkParse);

export function parseMarkdown(text: string): Container {
    const rootNode = remark.parse(text);

    // https://github.com/syntax-tree/mdast
    function traverseNode(container: Container, node: unist.Node): void {
        /* eslint-disable @typescript-eslint/no-unsafe-member-access */
        /* eslint-disable @typescript-eslint/no-unsafe-assignment */
        /* eslint-disable @typescript-eslint/no-unsafe-call */
        /* eslint-disable @typescript-eslint/no-explicit-any */
        switch (node.type) {
            case 'root': {
                traverseChildren(container, node as unist.Parent);
                break;
            }
            case 'paragraph': {
                const paragraph = new Paragraph();
                container.addChild(paragraph);
                traverseChildren(paragraph, node as unist.Parent);
                break;
            }
            case 'heading': {
                const depth = (node as any).depth;
                let heading: Container;
                switch (depth) {
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
                        throw new Error('Unsupported heading depth.');
                    }
                }
                container.addChild(heading);
                traverseChildren(heading, node as unist.Parent);
                break;
            }
            case 'thematicBreak': {
                container.addChild(new HorizontalRule());
                break;
            }
            case 'blockquote': {
                const blockQuote = new BlockQuote();
                container.addChild(blockQuote);
                traverseChildren(blockQuote, node as unist.Parent);
                break;
            }
            case 'listItem': {
                throw new Error('Unexpected list item node.');
            }
            case 'list': {
                const list = new List(
                    (node as any).ordered ?? undefined,
                    (node as any).start ?? undefined,
                );
                container.addChild(list);
                for (const childNode of (node as unist.Parent).children) {
                    const container = new Container();
                    list.addChild(container);
                    if (childNode.type === 'listItem') {
                        if ((childNode as any).checked !== null) {
                            throw new Error(
                                `Unsupported list item type. ${JSON.stringify(
                                    node,
                                    null,
                                    2,
                                )}`,
                            );
                        }
                        traverseChildren(container, childNode as unist.Parent);
                        continue;
                    }
                    traverseNode(container, childNode);
                }
                break;
            }
            case 'table': {
                if ((node as any).align.some((item) => item !== null)) {
                    throw new Error('Unsupported table align.');
                }
                const tableNode = node as unist.Parent;
                if (tableNode.children.length === 0) {
                    throw new Error('Table has no rows.');
                }
                const heading = parseTableRow(
                    tableNode.children[0] as unist.Parent,
                );
                const table = new Table(heading);
                for (const child of tableNode.children) {
                    table.addChild(parseTableRow(child as unist.Parent));
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
                // HTML tags should be stripped out into their own nodes by the
                // TSDoc parser. HTML comments are used as metadata when parsing
                // TSDoc nodes, therefore preserve them.
                let value = (node as unist.Literal).value as string;
                while (!/^\s*$/.test(value)) {
                    value = value.trimLeft();
                    if (!/^<!--/.test(value)) {
                        throw new Error('HTML content must be a comment.');
                    }
                    const lastIndex = value.indexOf('-->');
                    if (lastIndex === -1) {
                        throw new Error('Unclosed HTML comment.');
                    }
                    container.addChild(
                        new HtmlComment(value.slice(4, lastIndex)),
                    );
                    value = value.slice(lastIndex + 3);
                }
                break;
            }
            case 'code': {
                if ((node as any).meta !== null) {
                    throw new Error('Invalid code block.');
                }
                const codeBlock = new CodeBlock(
                    (node as any).lang,
                    (node as unist.Literal).value as string,
                );
                container.addChild(codeBlock);
                break;
            }
            case 'definition': {
                throw new Error('Markdown definitions are not supported.');
            }
            case 'footnoteDefinition': {
                throw new Error('Footnote definitions are not supported.');
            }
            case 'text': {
                container.addChild(
                    new PlainText((node as unist.Literal).value as string),
                );
                break;
            }
            case 'emphasis': {
                const italics = new Italics();
                container.addChild(italics);
                traverseChildren(italics, node as unist.Parent);
                break;
            }
            case 'strong': {
                const bold = new Bold();
                container.addChild(bold);
                traverseChildren(bold, node as unist.Parent);
                break;
            }
            case 'delete': {
                const strikethrough = new Strikethrough();
                container.addChild(strikethrough);
                traverseChildren(strikethrough, node as unist.Parent);
                break;
            }
            case 'inlineCode': {
                const inlineCode = new CodeSpan().addChild(
                    new PlainText((node as unist.Literal).value as string),
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
                const link = new Link((node as any).url, (node as any).title);
                container.addChild(link);
                traverseChildren(link, node as unist.Parent);
                break;
            }
            case 'image': {
                const image = new Image(
                    (node as any).url,
                    (node as any).title,
                    (node as any).alt,
                );
                container.addChild(image);
                break;
            }
            case 'linkReference': {
                throw new Error('Link references are not supported.');
            }
            case 'imageReference': {
                throw new Error('Image references are not supported.');
            }
            case 'footnote': {
                throw new Error('Footnotes are not supported.');
            }
            default: {
                console.error(`Unknown node type ${node.type}`);
                console.dir(node);
            }
        }
        /* eslint-enable @typescript-eslint/no-unsafe-member-access */
        /* eslint-disable @typescript-eslint/no-unsafe-assignment */
        /* eslint-disable @typescript-eslint/no-unsafe-call */
        /* eslint-enable @typescript-eslint/no-explicit-any */
    }

    function parseTableRow(node: unist.Parent): TableRow {
        const row = new TableRow();
        // Loop over cells.
        for (const childNode of node.children) {
            const container = new Container();
            row.addChild(container);
            traverseChildren(container, childNode as unist.Parent);
        }
        return row;
    }

    function traverseChildren(
        container: Container,
        parent: unist.Parent,
    ): void {
        for (const node of parent.children) {
            traverseNode(container, node);
        }
    }

    const container = new Container();
    traverseNode(container, rootNode);
    return container;
}

export class HorizontalRule extends Node {
    public writeAsMarkdown(output: MarkdownOutput): void {
        if (output.constrainedToSingleLine) {
            output.write('<hr>');
            return;
        }
        output.ensureNewLine();
        output.write('---');
    }
}

export class HtmlComment extends Node {
    constructor(public comment: string) {
        super();
    }

    public writeAsMarkdown(): void {
        throw new Error(
            'Attempted to write a HtmlComment node to output. HtmlComment nodes are only used for metadata when parsing TSDoc comments.',
        );
    }
}

export class PersistentHtmlComment extends Node {
    constructor(private _comment: string) {
        super();
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        output.write('<!--');
        output.write(this._comment);
        output.write('-->');
    }
}

export class BlockQuote extends Container {
    public writeAsMarkdown(output: MarkdownOutput): void {
        output.increaseIndent('> ');
        super.writeAsMarkdown(output);
        output.decreaseIndent();
    }
}

export class HtmlElement extends Container {
    constructor(public tagName: string) {
        super();
    }

    private _writeTagAsMarkdown(output: MarkdownOutput): void {
        output.write('<');
        writePlainText(output, this.tagName);
        output.write('>');
        super.writeAsMarkdown(output);
        output.write('</');
        writePlainText(output, this.tagName);
        output.write('>');
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        if (htmlBlockElements.has(this.tagName)) {
            if (!output.constrainedToSingleLine && !output.inHtmlBlockTag) {
                output.ensureNewParagraph();
            }
            output.withInHtmlBlockTag(() => {
                this._writeTagAsMarkdown(output);
            });
            return;
        }
        this._writeTagAsMarkdown(output);
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

export class CodeBlock extends Container {
    constructor(private _language: string, private _code: string) {
        super();
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        if (output.constrainedToSingleLine) {
            output.withInSingleLineCodeBlock(() => {
                new HtmlElement('code')
                    .addChildren(...this._children)
                    .writeAsMarkdown(output);
            });
            return;
        }

        output.ensureNewParagraph();
        output.withInMarkdownCode(() => {
            output.write('```');
            writePlainText(output, this._language);
            output.writeLine();
            output.write(this._code);
            output.ensureNewLine();
        });
        output.write('```');
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
                    .addChildren(...this._children)
                    .writeAsMarkdown(output);
            });
            return;
        }

        new HtmlElement('pre')
            .addChildren(...this._children)
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
                output.write('<a href="');
                writePlainText(output, this._destination);
                if (this._title) {
                    output.write('" title="');
                    writePlainText(output, this._title);
                }
                output.write('">');
                super.writeAsMarkdown(output);
                output.write('</a>');
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
            .addChildren(...this._children)
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
                output.write('<img src="');
                writePlainText(output, this._src);
                if (this._title) {
                    output.write('" title="');
                    writePlainText(output, this._title);
                }
                if (this._alt) {
                    output.write('" alt="');
                    writePlainText(output, this._alt);
                }
                output.write('">');
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
        if (this._children.length === 0) {
            return;
        }
        if (output.inParagraphNode) {
            super.writeAsMarkdown(output);
            return;
        }
        output.withInParagraphNode(() => {
            if (output.constrainedToSingleLine) {
                new HtmlElement('p')
                    .addChildren(...this._children)
                    .writeAsMarkdown(output);
                return;
            }
            output.ensureNewParagraph();
            super.writeAsMarkdown(output);
        });
    }
}

export class Heading extends Container {
    constructor(private _alternateId?: string) {
        super();
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        output.ensureNewParagraph();
        output.withInSingleLine(() => {
            output.write('## ');
            if (this._alternateId) {
                output.write('<a name="');
                writePlainText(output, this._alternateId);
                output.write('"></a>');
            }
            super.writeAsMarkdown(output);
        });
    }
}

export class Subheading extends Container {
    constructor(private _alternateId?: string) {
        super();
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        output.ensureNewParagraph();
        output.withInSingleLine(() => {
            output.write('### ');
            if (this._alternateId) {
                output.write('<a name="');
                writePlainText(output, this._alternateId);
                output.write('"></a>');
            }
            super.writeAsMarkdown(output);
        });
    }
}

export class Title extends HtmlElement {
    constructor() {
        // At the time of writing Github styles regular text and h4 elements
        // with the same font size. Therefore rendering the titles and bold
        // spans will ensure that a anchor is not generated for this node in the
        // rendered html.
        super('b');
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        output.ensureNewParagraph();
        output.withInSingleLine(() => {
            super.writeAsMarkdown(output);
        });
    }
}

export class List extends Container {
    constructor(private _ordered?: boolean, private _start = 1) {
        super();
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        if (output.inListNode) {
            output.ensureNewLine();
        } else {
            output.ensureNewParagraph();
        }
        for (const [i, child] of this._children.entries()) {
            if (i !== 0) {
                output.ensureNewLine();
            }
            const listMarker = this._ordered ? `${this._start + i}. ` : '- ';
            output.write(listMarker);
            output.increaseIndent(' '.repeat(listMarker.length));
            output.withMarkedNewParagraph(() => {
                output.withInListNode(() => {
                    child.writeAsMarkdown(output);
                });
            });
            output.decreaseIndent();
        }
    }
}

export class TableRow extends Container {
    public writeAsMarkdown(
        output: MarkdownOutput,
        columnCount = this.getChildCount(),
        isNotHeader = false,
    ): void {
        if (isNotHeader) {
            output.ensureNewLine();
        }
        output.write('|');
        for (const cell of this._children) {
            output.write(' ');
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

    public writeAsMarkdown(output: MarkdownOutput): void {
        output.ensureNewParagraph();

        const columnCount = this._getColumnCount();

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
            child.writeAsMarkdown(output, columnCount, true);
        }
    }
}

export class CollapsableSection extends HtmlElement {
    constructor(summaryNode: Node) {
        super('details');
        this.addChild(new HtmlElement('summary').addChild(summaryNode));
    }
}

export class PageTitle extends Container {
    public writeAsMarkdown(output: MarkdownOutput): void {
        output.ensureNewParagraph();
        output.withInSingleLine(() => {
            output.write('# ');
            super.writeAsMarkdown(output);
        });
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

export class TableOfContents extends CollapsableSection {
    constructor(toc: TableOfContents_, relativePagePath?: string) {
        super(new Bold().addChild(new PlainText('Table of Contents')));
        this.addChild(new TableOfContentsList(toc, relativePagePath));
    }
}

export class DoNotEditComment extends PersistentHtmlComment {
    constructor() {
        super(
            ' Do not edit this file. It is automatically generated by a build script. ',
        );
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

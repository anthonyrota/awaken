/* eslint-disable max-len */
/**
 * Thanks to the api-documenter team for some ideas used in this script:
 *
 * https://github.com/microsoft/rushstack/blob/e7e9429/apps/api-documenter/src/nodes/DocTable.ts
 *
 * The api-documenter project is licensed under MIT, and its license can be found at <rootDir>/vendor/licenses/@microsoft/api-documenter/LICENSE
 */
/* eslint-enable max-len */

import * as yaml from 'yaml';
import * as unist from 'unist';
import * as unified from 'unified';
import * as remarkParse from 'remark-parse';
import { IndentedWriter } from './util';
import { PageMetadata } from '../pageMetadata';

export class MarkdownOutput extends IndentedWriter {
    private _inSingleLineCodeBlock = false;
    private _inTable = false;
    private _writeSingleLine = false;
    private _inBlockHtmlTag = false;
    private _inMarkdownCode = false;
    private _inParagraph = false;

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

    public withInBlockHtmlTag(write: () => void): void {
        const before = this._inBlockHtmlTag;
        this._inBlockHtmlTag = true;
        write();
        this._inBlockHtmlTag = before;
    }

    public withInMarkdownCode(write: () => void): void {
        const before = this._inMarkdownCode;
        this._inMarkdownCode = true;
        write();
        this._inMarkdownCode = before;
    }

    public withInParagraph(write: () => void): void {
        const before = this._inParagraph;
        this._inParagraph = true;
        write();
        this._inParagraph = before;
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

    public get inBlockHtmlTag(): boolean {
        return this._inBlockHtmlTag;
    }

    public get inMarkdownCode(): boolean {
        return this._inMarkdownCode;
    }

    public get inParagraph(): boolean {
        return this._inParagraph;
    }

    protected _write(str: string): void {
        if (this.constrainedToSingleLine && /[\n\r]/.test(str)) {
            throw new Error('Newline when constrained to single line.');
        }
        super._write(str);
    }
}

export interface Node {
    writeAsMarkdown(output: MarkdownOutput): void;
}

export class Container<T extends Node = Node> implements Node {
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

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

const newlineRegexp = /\r?\n/g;

function escapeTable(text: string): string {
    return text.replace(/\|/g, '&#124;');
}

function escapeMarkdown(text: string): string {
    return text.replace(/\\/, '\\\\').replace(/[*#/()[\]<>_]/g, '\\$&');
}

export class RawText implements Node {
    constructor(public text: string) {}

    public append(text: string) {
        this.text += text;
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        output.write(this.text);
    }
}

export class PlainText extends RawText implements Node {
    public writeAsMarkdown(output: MarkdownOutput): void {
        let { text } = this;

        if (!output.inMarkdownCode) {
            text = escapeHtml(text);

            if (output.inTable) {
                text = escapeTable(text);
                if (!output.inSingleLineCodeBlock) {
                    text = text.replace(newlineRegexp, '<br>');
                }
            }

            if (!output.inBlockHtmlTag) {
                text = escapeMarkdown(text);
            }

            if (output.inSingleLineCodeBlock) {
                text = text.split(newlineRegexp).join('</code><br><code>');
            } else if (output.inBlockHtmlTag && !output.inTable) {
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
                if (
                    (node as any).ordered !== false ||
                    (node as any).start !== null
                ) {
                    throw new Error(
                        `Unsupported list type. ${JSON.stringify(
                            node,
                            null,
                            2,
                        )}`,
                    );
                }
                const list = new List();
                container.addChild(list);
                for (const listItem of (node as unist.Parent).children) {
                    if (
                        listItem.type !== 'list' &&
                        listItem.type !== 'listItem'
                    ) {
                        throw new Error('Unsupported type in list');
                    }
                    if (listItem.type === 'list') {
                        throw new Error('Nested lists are not supported');
                    }
                    if ((listItem as any).checked !== null) {
                        throw new Error(
                            `Unsupported list item type. ${JSON.stringify(
                                node,
                                null,
                                2,
                            )}`,
                        );
                    }
                    const container = new Container();
                    list.addChild(container);
                    traverseChildren(container, listItem as unist.Parent);
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
                for (let i = 1; i < tableNode.children.length; i++) {
                    table.addChild(
                        parseTableRow(tableNode.children[i] as unist.Parent),
                    );
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

export class HorizontalRule implements Node {
    public writeAsMarkdown(output: MarkdownOutput): void {
        if (output.constrainedToSingleLine) {
            output.write('<hr>');
            return;
        }
        output.ensureNewLine();
        output.write('---');
    }
}

export class HtmlComment implements Node {
    constructor(public comment: string) {}

    public writeAsMarkdown(): void {
        throw new Error(
            'Attempted to write a HtmlComment node to output. HtmlComment nodes are only used for metadata when parsing TSDoc comments.',
        );
    }
}

export class BlockQuote extends Container implements Node {
    public writeAsMarkdown(output: MarkdownOutput): void {
        output.increaseIndent('> ');
        super.writeAsMarkdown(output);
        output.decreaseIndent();
    }
}

export class HtmlElement extends Container implements Node {
    constructor(public tagName: string) {
        super();
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        output.write('<');
        output.write(this.tagName);
        output.write('>');
        super.writeAsMarkdown(output);
        output.write('</');
        output.write(this.tagName);
        output.write('>');
    }
}

export class Italics extends HtmlElement implements Node {
    constructor() {
        super('i');
    }
}

export class Bold extends HtmlElement implements Node {
    constructor() {
        super('b');
    }
}

export class Strikethrough extends HtmlElement implements Node {
    constructor() {
        super('s');
    }
}

export class HtmlBlockElement extends HtmlElement implements Node {
    public writeAsMarkdown(output: MarkdownOutput): void {
        if (!output.constrainedToSingleLine) {
            output.ensureSkippedLine();
        }
        output.withInBlockHtmlTag(() => {
            super.writeAsMarkdown(output);
        });
    }
}

export class CodeSpan extends HtmlElement implements Node {
    constructor() {
        super('code');
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        output.withInSingleLine(() => {
            super.writeAsMarkdown(output);
        });
    }
}

export class CodeBlock extends Container implements Node {
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

        output.ensureSkippedLine();
        output.withInMarkdownCode(() => {
            output.write('```');
            output.writeLine(this._language);
            output.write(this._code);
            output.ensureNewLine();
        });
        output.write('```');
    }
}

export class RichCodeBlock extends Container implements Node {
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

        new HtmlBlockElement('pre')
            .addChildren(...this._children)
            .writeAsMarkdown(output);
    }
}

export class Link extends Container implements Node {
    constructor(private _destination: string, private _title?: string) {
        super();
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        output.withInSingleLine(() => {
            if (output.inBlockHtmlTag && !output.inTable) {
                output.write('<a href="');
                output.write(this._destination);
                if (this._title) {
                    output.write('" title="');
                    output.write(this._title);
                }
                output.write('">');
                super.writeAsMarkdown(output);
                output.write('</a>');
                return;
            }
            output.write('[');
            super.writeAsMarkdown(output);
            output.write('](');
            output.write(this._destination);
            if (this._title) {
                output.write(' "');
                output.write(this._title);
                output.write('"');
            }
            output.write(')');
        });
    }
}

export class Image implements Node {
    constructor(
        private _src: string,
        private _title?: string,
        private _alt?: string,
    ) {}

    public writeAsMarkdown(output: MarkdownOutput): void {
        output.withInSingleLine(() => {
            if (output.inBlockHtmlTag && !output.inTable) {
                output.write('<img src="');
                output.write(this._src);
                if (this._title) {
                    output.write('" title="');
                    output.write(this._title);
                }
                if (this._alt) {
                    output.write('" alt="');
                    output.write(this._alt);
                }
                output.write('">');
            }
            output.write('![');
            if (this._alt) output.write(this._alt);
            output.write('](');
            output.write(this._src);
            if (this._title) {
                output.write(' "');
                output.write(this._title);
                output.write('"');
            }
            output.write(')');
        });
    }
}

export class Paragraph extends Container implements Node {
    public writeAsMarkdown(output: MarkdownOutput): void {
        if (this._children.length === 0) {
            return;
        }
        if (output.inParagraph) {
            super.writeAsMarkdown(output);
            return;
        }
        output.withInParagraph(() => {
            if (output.constrainedToSingleLine) {
                new HtmlBlockElement('p')
                    .addChildren(...this._children)
                    .writeAsMarkdown(output);
                return;
            }
            output.ensureSkippedLine();
            super.writeAsMarkdown(output);
        });
    }
}

export class Heading extends Container implements Node {
    constructor(private _alternateId?: string) {
        super();
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        output.ensureSkippedLine();
        output.withInSingleLine(() => {
            output.write('## ');
            if (this._alternateId) {
                output.write('<a name="');
                output.write(this._alternateId);
                output.write('"></a>');
            }
            super.writeAsMarkdown(output);
        });
    }
}

export class Subheading extends Container implements Node {
    constructor(private _alternateId?: string) {
        super();
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        output.ensureSkippedLine();
        output.withInSingleLine(() => {
            output.write('### ');
            if (this._alternateId) {
                output.write('<a name="');
                output.write(this._alternateId);
                output.write('"></a>');
            }
            super.writeAsMarkdown(output);
        });
    }
}

export class Title extends Container implements Node {
    public writeAsMarkdown(output: MarkdownOutput): void {
        output.ensureSkippedLine();
        output.withInSingleLine(() => {
            output.write('#### ');
            super.writeAsMarkdown(output);
        });
    }
}

export class List extends Container implements Node {
    public writeAsMarkdown(output: MarkdownOutput): void {
        output.ensureSkippedLine();
        for (const child of this._children) {
            output.ensureNewLine();
            output.withInSingleLine(() => {
                output.write('- ');
                child.writeAsMarkdown(output);
            });
        }
    }
}

export class TableRow extends Container implements Node {
    public writeAsMarkdown(
        output: MarkdownOutput,
        columnCount = this.getChildCount(),
    ): void {
        output.ensureNewLine();
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

export class Table extends Container<TableRow> implements Node {
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
        output.ensureSkippedLine();

        const columnCount = this._getColumnCount();

        if (this._header) {
            this._header.writeAsMarkdown(output);
        } else {
            output.write('|  '.repeat(columnCount));
            output.write('|');
        }

        // Divider.
        output.writeLine();
        output.write('| --- '.repeat(this._getColumnCount()));
        output.write('|');

        for (const child of this._children) {
            child.writeAsMarkdown(output, columnCount);
        }
    }
}

export class Page extends Container implements Node {
    constructor(private _metadata: PageMetadata) {
        super();
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        output.writeLine('---');
        output.write(yaml.stringify({ title: this._metadata.title }));
        output.writeLine('---');
        output.writeLine();
        output.write(
            '<!-- Do not edit this file. It is automatically generated by a build script. -->',
        );
        super.writeAsMarkdown(output);
        output.ensureNewLine();
    }
}

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
import { IndentedWriter } from './util';
import { PageMetadata } from '../pageMetadata';

export class MarkdownOutput extends IndentedWriter {
    private _inSingleLineCodeBlock = false;
    private _inTable = false;
    private _writeSingleLine = false;
    private _inBlockHtmlTag = false;
    private _inMarkdownCode = false;

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

function escapeTable(text: string, replaceNewLines: boolean): string {
    const escaped = text.replace(/\|/g, '&#124;');
    if (replaceNewLines) {
        return escaped.replace(/\r?\n/g, '<br/>');
    }
    return escaped;
}

function escapeMarkdown(text: string): string {
    return text.replace(/\\/, '\\\\').replace(/[*#/()[\]<>_]/g, '\\$&');
}

export class Text {
    constructor(public text: string) {}

    public append(text: string) {
        this.text += text;
    }
}

export class PlainText extends Text implements Node {
    public writeAsMarkdown(output: MarkdownOutput): void {
        let { text } = this;

        if (!output.inMarkdownCode) {
            text = escapeHtml(text);

            if (output.inTable) {
                text = escapeTable(text, !output.inSingleLineCodeBlock);
            }

            if (!output.inBlockHtmlTag) {
                text = escapeMarkdown(text);
            }

            if (output.inSingleLineCodeBlock) {
                text = text.split(/\r?\n/g).join('</code><br/><code>');
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

export class MarkdownText extends Text implements Node {
    public writeAsMarkdown(output: MarkdownOutput): void {
        // todo: parse
        let { text } = this;

        if (!output.inMarkdownCode) {
            if (output.inTable) {
                text = escapeTable(text, !output.inSingleLineCodeBlock);
            }

            if (output.inSingleLineCodeBlock) {
                text = text.split(/\r?\n/g).join('</code><br/><code>');
            }
        }

        output.write(text);
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

export class CodeSpan extends Container implements Node {
    public writeAsMarkdown(output: MarkdownOutput): void {
        output.write('`');
        output.withInMarkdownCode(() => {
            output.withInSingleLine(() => {
                super.writeAsMarkdown(output);
            });
        });
        output.write('`');
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
    constructor(private _destination: string) {
        super();
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        if (output.inBlockHtmlTag && !output.inTable) {
            output.write('<a href="');
            output.write(this._destination);
            output.write('">');
            super.writeAsMarkdown(output);
            output.write('</a>');
            return;
        }
        output.write('[');
        super.writeAsMarkdown(output);
        output.write('](');
        output.write(this._destination);
        output.write(')');
    }
}

// TODO: parse markdown and output (eg. diff in html block as in Link above).

export class Paragraph extends Container implements Node {
    public writeAsMarkdown(output: MarkdownOutput): void {
        if (this._children.length === 0) {
            return;
        }
        if (output.constrainedToSingleLine) {
            new HtmlBlockElement('p')
                .addChildren(...this._children)
                .writeAsMarkdown(output);
            return;
        }
        output.ensureSkippedLine();
        super.writeAsMarkdown(output);
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
                output.write('* ');
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

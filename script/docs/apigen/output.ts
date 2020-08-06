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

    protected _write(str: string): void {
        if (this.constrainedToSingleLine && /[\n\r]/.test(str)) {
            throw new Error('Newline when constrained to single line.');
        }
        super._write(str);
    }
}

export interface Serializable {
    writeAsMarkdown(output: MarkdownOutput): void;
}

export class Container<T extends Serializable = Serializable>
    implements Serializable {
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

    public writeAsMarkdown(output: MarkdownOutput): void {
        for (const child of this._children) {
            child.writeAsMarkdown(output);
        }
    }
}

function escapeTable(text: string): string {
    return text.replace(/\|/g, '&#124;');
}

function escapeMarkdown(text: string): string {
    return text.replace(/\\/, '\\\\').replace(/[*_{}()#+\-.!|]/g, '\\$&');
}

export class Text {
    constructor(public text: string) {}

    public append(text: string) {
        this.text += text;
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        let { text } = this;

        if (output.inTable) {
            text = escapeTable(text);
        }

        if (output.inSingleLineCodeBlock && output.constrainedToSingleLine) {
            // This might break stuff like multiline html tags.
            text = escapeMarkdown(text)
                .split(/\r?\n/g)
                .join('</code><br/><code>');
        }

        output.write(text);
    }
}

export class HtmlElement extends Container implements Serializable {
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

export class HtmlBlockElement extends HtmlElement implements Serializable {
    public writeAsMarkdown(output: MarkdownOutput): void {
        if (!output.constrainedToSingleLine) {
            output.ensureSkippedLine();
        }
        output.withInBlockHtmlTag(() => {
            super.writeAsMarkdown(output);
        });
    }
}

export class CodeSpan extends Container implements Serializable {
    public writeAsMarkdown(output: MarkdownOutput): void {
        output.write('`');
        output.withInSingleLine(() => {
            super.writeAsMarkdown(output);
        });
        output.write('`');
    }
}

export class CodeBlock extends Container implements Serializable {
    constructor(private _langauge: string, private _code: string) {
        super();
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        if (output.constrainedToSingleLine) {
            output.write('<code>');
            output.withInSingleLineCodeBlock(() => {
                new Text(this._code).writeAsMarkdown(output);
            });
            output.write('</code>');
            return;
        }

        output.ensureSkippedLine();
        output.write('```');
        output.writeLine(this._langauge);
        output.write(this._code);
        output.ensureNewLine();
        output.write('```');
    }
}

export class RichCodeBlock extends Container implements Serializable {
    constructor(private _language: string) {
        super();
        this._language;
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        if (output.constrainedToSingleLine) {
            output.write('<code>');
            output.withInSingleLineCodeBlock(() => {
                super.writeAsMarkdown(output);
            });
            output.write('</code>');
            return;
        }

        new HtmlBlockElement('pre')
            .addChildren(...this._children)
            .writeAsMarkdown(output);
    }
}

export class Link implements Serializable {
    constructor(private _destination: string, private _linkText: string) {}

    public writeAsMarkdown(output: MarkdownOutput): void {
        if (output.inBlockHtmlTag && !output.inTable) {
            output.write('<a href="');
            output.write(this._destination);
            output.write('">');
            output.write(this._linkText);
            output.write('</a>');
            return;
        }
        output.write('[');
        output.write(this._linkText);
        output.write('](');
        output.write(this._destination);
        output.write(')');
    }
}

// TODO: parse markdown and output (eg. diff in html block as in Link above).

export class Paragraph extends Container implements Serializable {
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

export class Heading extends Container implements Serializable {
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

export class Subheading extends Container implements Serializable {
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

export class Title extends Container implements Serializable {
    public writeAsMarkdown(output: MarkdownOutput): void {
        output.ensureSkippedLine();
        output.withInSingleLine(() => {
            output.write('#### ');
            super.writeAsMarkdown(output);
        });
    }
}

export class List extends Container implements Serializable {
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

export class TableRow extends Container implements Serializable {
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

export class Table extends Container<TableRow> implements Serializable {
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

export class Page extends Container implements Serializable {
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

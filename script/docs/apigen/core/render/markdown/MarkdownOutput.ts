import { IndentedWriter } from '../../../util/IndentedWriter';

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

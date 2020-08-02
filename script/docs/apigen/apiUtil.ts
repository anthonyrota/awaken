/* eslint-disable max-len */
/**
 * Thanks to the api-documenter team for some ideas used in this script:
 *
 * https://github.com/microsoft/rushstack/blob/8b2edd9/apps/api-documenter/src/markdown/MarkdownEmitter.ts
 * https://github.com/microsoft/rushstack/blob/e7e9429/apps/api-documenter/src/nodes/DocTable.ts
 * https://github.com/microsoft/rushstack/blob/a30cdf5/apps/api-extractor-model/src/model/ApiModel.ts
 *
 * The api-documenter project is licensed under MIT, and it's license can be found at <rootDir>/vendor/licenses/@microsoft/api-documenter/LICENSE
 * The api-extractor-model project is licensed under MIT, and it's license can be found at <rootDir>/vendor/licenses/@microsoft/api-extractor-model/LICENSE
 */
/* eslint-enable max-len */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as colors from 'colors';
import * as tsdoc from '@microsoft/tsdoc';
import { DeclarationReference } from '@microsoft/tsdoc/lib/beta/DeclarationReference';
import * as aeModel from '@microsoft/api-extractor-model';
import * as yaml from 'yaml';
import {
    TableOfContentsInlineReference,
    TableOfContentsNestedReference,
    TableOfContentsMainReference,
    TableOfContents,
    PageMetadata,
} from '../pageMetadata';
import { SourceExportMappings } from './sourceExportMappings';
import { IndentedWriter } from './util';
import {
    APIPageData,
    getMainPathOfApiItemName,
    assertMappedApiItemNames,
    forEachPage,
} from './paths';

interface Context {
    sourceExportMappings: SourceExportMappings;
    apiModel: aeModel.ApiModel;
    apiItemsByMemberName: Map<string, aeModel.ApiItem[]>;
    apiItemsByCanonicalReference?: Map<string, aeModel.ApiItem>;
}

const seeTag = new tsdoc.TSDocTagDefinition({
    tagName: '@see',
    syntaxKind: tsdoc.TSDocTagSyntaxKind.BlockTag,
});

const globalTSDocConfiguration = aeModel.AedocDefinitions.tsdocConfiguration;
globalTSDocConfiguration.addTagDefinition(seeTag);

class UnsupportedApiItemError extends Error {
    constructor(apiItem: aeModel.ApiItem, reason: string) {
        super();
        this.name = 'UnsupportedApiItemError';
        this.message = `The following api item ${
            apiItem.displayName
        } with package scoped name ${apiItem.getScopedNameWithinPackage()} and kind ${
            apiItem.kind
        } is not supported: ${reason}`;
    }
}

function getDocComment(apiItem: aeModel.ApiItem): tsdoc.DocComment {
    if (!(apiItem instanceof aeModel.ApiDocumentedItem)) {
        throw new UnsupportedApiItemError(apiItem, 'Not documented.');
    }

    if (!apiItem.tsdocComment) {
        throw new UnsupportedApiItemError(apiItem, 'No docComment property.');
    }

    return apiItem.tsdocComment;
}

function getBlocksOfTag(
    blocks: readonly tsdoc.DocBlock[],
    tag: tsdoc.TSDocTagDefinition,
): tsdoc.DocBlock[] {
    return blocks.filter(
        (block) =>
            block.blockTag.tagNameWithUpperCase === tag.tagNameWithUpperCase,
    );
}

interface ExtractedCustomBlocks {
    exampleBlocks: tsdoc.DocBlock[];
    seeBlocks: tsdoc.DocBlock[];
}

function extractCustomBlocks(apiItem: aeModel.ApiItem): ExtractedCustomBlocks {
    const docComment = getDocComment(apiItem);
    const exampleBlocks = getBlocksOfTag(
        docComment.customBlocks,
        tsdoc.StandardTags.example,
    );
    const seeBlocks = getBlocksOfTag(docComment.customBlocks, seeTag);

    return {
        exampleBlocks,
        seeBlocks,
    };
}

function getApiItemName(
    apiItem: import('@microsoft/api-extractor-model').ApiItem,
): string {
    const match = /^(.+)_\d+$/.exec(apiItem.displayName);
    if (match) {
        return match[1];
    }
    return apiItem.displayName;
}

class MarkdownOutput extends IndentedWriter {}

/* eslint-disable no-inner-declarations */
// eslint-disable-next-line @typescript-eslint/no-namespace
namespace MarkdownRenderUtil {
    function escapeHTML(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function escapeMarkdown(text: string): string {
        // For now leave markdown in there.
        return escapeHTML(text);
    }

    interface EmitMarkdownContext {
        context: Context;
        output: MarkdownOutput;
        apiItem: aeModel.ApiItem;
        writeSingleLine: boolean;
    }

    function writeApiItemDocNode(
        output: MarkdownOutput,
        apiItem: aeModel.ApiItem,
        docNode: tsdoc.DocNode,
        context: Context,
        writeSingleLine = false,
    ): void {
        writeNode(docNode, { context, output, apiItem, writeSingleLine });
    }

    function writeNode(
        docNode: tsdoc.DocNode,
        context: EmitMarkdownContext,
    ): void {
        const output = context.output;

        switch (docNode.kind) {
            case tsdoc.DocNodeKind.PlainText: {
                const docPlainText = docNode as tsdoc.DocPlainText;
                writePlainText(docPlainText.text, context);
                break;
            }
            case tsdoc.DocNodeKind.HtmlStartTag:
            case tsdoc.DocNodeKind.HtmlEndTag: {
                const docHtmlTag = docNode as
                    | tsdoc.DocHtmlStartTag
                    | tsdoc.DocHtmlEndTag;
                // Write the HTML element verbatim into the output.
                output.write(docHtmlTag.emitAsHtml());
                break;
            }
            case tsdoc.DocNodeKind.CodeSpan: {
                const docCodeSpan = docNode as tsdoc.DocCodeSpan;
                if (context.writeSingleLine) {
                    output.write('<code>');
                } else {
                    output.write('`');
                }
                if (context.writeSingleLine) {
                    const code = escapeHTML(
                        docCodeSpan.code.replace(/\|/g, '&#124;'),
                    );
                    const parts: string[] = code.split(/\r?\n/g);
                    output.write(parts.join('</code><br/><code>'));
                } else {
                    output.write(docCodeSpan.code);
                }
                if (context.writeSingleLine) {
                    output.write('</code>');
                } else {
                    output.write('`');
                }
                break;
            }
            case tsdoc.DocNodeKind.LinkTag: {
                const docLinkTag = docNode as tsdoc.DocLinkTag;
                if (docLinkTag.codeDestination) {
                    writeLinkTagWithCodeDestination(docLinkTag, context);
                } else if (docLinkTag.urlDestination) {
                    writeLinkTagWithUrlDestination(docLinkTag, context);
                } else if (docLinkTag.linkText) {
                    writePlainText(docLinkTag.linkText, context);
                }
                break;
            }
            case tsdoc.DocNodeKind.Paragraph: {
                const docParagraph = docNode as tsdoc.DocParagraph;
                // eslint-disable-next-line max-len
                const trimmedParagraph = tsdoc.DocNodeTransforms.trimSpacesInParagraph(
                    docParagraph,
                );
                if (context.writeSingleLine) {
                    output.write('<p>');
                    writeNodes(trimmedParagraph.nodes, context);
                    output.write('</p>');
                } else {
                    output.ensureSkippedLine();
                    writeNodes(trimmedParagraph.nodes, context);
                }
                break;
            }
            case tsdoc.DocNodeKind.FencedCode: {
                if (context.writeSingleLine) {
                    throw new Error(
                        'Cannot have FencedCode when option writeSingleLine is true.',
                    );
                }
                const docFencedCode = docNode as tsdoc.DocFencedCode;
                output.ensureSkippedLine();
                output.write('```');
                output.write(docFencedCode.language);
                output.writeLine();
                output.write(docFencedCode.code.replace(/[\n\r]+$/, ''));
                output.writeLine();
                output.writeLine('```');
                break;
            }
            case tsdoc.DocNodeKind.Section: {
                const docSection = docNode as tsdoc.DocSection;
                writeNodes(docSection.nodes, context);
                break;
            }
            case tsdoc.DocNodeKind.SoftBreak: {
                if (!/^\s?$/.test(output.peekLastCharacter())) {
                    output.write(' ');
                }
                break;
            }
            case tsdoc.DocNodeKind.EscapedText: {
                const docEscapedText = docNode as tsdoc.DocEscapedText;
                writePlainText(docEscapedText.decodedText, context);
                break;
            }
            case tsdoc.DocNodeKind.ErrorText: {
                const docErrorText = docNode as tsdoc.DocErrorText;
                writePlainText(docErrorText.text, context);
                break;
            }
            case tsdoc.DocNodeKind.InlineTag: {
                break;
            }
            case tsdoc.DocNodeKind.BlockTag: {
                const tagNode = docNode as tsdoc.DocBlockTag;
                if (
                    tagNode.tagName !== '@see' &&
                    tagNode.tagName !== '@example'
                ) {
                    console.warn('Unsupported block tag: ' + tagNode.tagName);
                }
                break;
            }
            default:
                throw new Error(
                    'Unsupported DocNodeKind kind: ' + docNode.kind,
                );
        }
    }

    function writeLinkTagWithCodeDestination(
        docLinkTag: tsdoc.DocLinkTag,
        context: EmitMarkdownContext,
    ): void {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const codeDestination = docLinkTag.codeDestination!;
        const childNodes = codeDestination.getChildNodes();
        if (childNodes.length !== 1) {
            throw new Error('No.');
        }
        const childNode = childNodes[0] as tsdoc.DocMemberReference;
        if (childNode.kind !== tsdoc.DocNodeKind.MemberReference) {
            throw new Error('No.');
        }
        const identifier = childNode.memberIdentifier?.identifier;
        if (!identifier) {
            throw new Error('No.');
        }
        writeLinkToApiItemName(
            (context.output as unknown) as MarkdownOutput,
            getApiItemName(context.apiItem),
            identifier,
            docLinkTag.linkText,
        );
    }

    function writeLinkTagWithUrlDestination(
        docLinkTag: tsdoc.DocLinkTag,
        context: EmitMarkdownContext,
    ): void {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const urlDestination = docLinkTag.urlDestination!;
        const linkText: string =
            docLinkTag.linkText !== undefined
                ? docLinkTag.linkText
                : urlDestination;

        const encodedLinkText: string = escapeMarkdown(
            linkText.replace(/\s+/g, ' '),
        );

        context.output.write('[');
        context.output.write(encodedLinkText);
        context.output.write(`](${urlDestination})`);
    }

    function writePlainText(text: string, context: EmitMarkdownContext): void {
        const output = context.output;

        // Split out the [ leading whitespace, content, trailing whitespace ].
        // eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
        const parts: string[] = text.match(/^(\s*)(.*?)(\s*)$/) || [];

        output.write(parts[1]); // Write leading whitespace.

        const middle: string = parts[2];

        if (middle !== '') {
            switch (output.peekLastCharacter()) {
                case '':
                case '\n':
                case ' ':
                case '[':
                case '>':
                    // Okay to put a symbol.
                    break;
                default:
                    // This is no problem:
                    //     "**one** *two* **three**"
                    // But this is trouble:
                    //     "**one***two***three**"
                    // The most general solution:
                    //     "**one**<!---->*two*<!---->**three**"
                    output.write('<!---->');
                    break;
            }

            output.write(escapeMarkdown(middle));
        }

        output.write(parts[3]); // Write trailing whitespace.
    }

    function writeNodes(
        docNodes: ReadonlyArray<tsdoc.DocNode>,
        context: EmitMarkdownContext,
    ): void {
        for (const docNode of docNodes) {
            writeNode(docNode, context);
        }
    }

    function unwrapText(text: string): string {
        return text.replace(/[\n\r]+ */g, ' ');
    }

    function getRelativePath(from: string, to: string): string {
        if (from === to) {
            return '';
        }
        const fromSplit = from.split(/[/\\]/g);
        fromSplit.pop();
        const toSplit = to.split(/[/\\]/g);
        const name = toSplit.pop();
        if (!name) {
            throw new Error('No.');
        }
        let i = 0;
        for (; i < fromSplit.length && i < toSplit.length; i++) {
            if (fromSplit[i] !== toSplit[i]) {
                break;
            }
        }
        const start =
            '../'.repeat(fromSplit.length - i) + toSplit.slice(i).join('/');
        return start === ''
            ? name
            : start + (start.endsWith('/') ? '' : '/') + name;
    }

    function getLinkToApiItemName(
        currentApiItemName: string,
        apiItemName: string,
    ): string {
        const currentApiItemPath = getMainPathOfApiItemName(currentApiItemName);
        const apiItemPath = getMainPathOfApiItemName(apiItemName);
        if (!currentApiItemPath || !apiItemPath) {
            throw new Error('No more coding today.');
        }
        const relativePath = getRelativePath(currentApiItemPath, apiItemPath);
        const titleHash = apiItemName.toLowerCase();

        return relativePath
            ? `${relativePath}.md#${titleHash}`
            : `#${titleHash}`;
    }

    function getLinkToApiItem(
        currentApiItemName: string,
        apiItem: aeModel.ApiItem,
        context: Context,
    ): string {
        const currentApiItemPath = getMainPathOfApiItemName(currentApiItemName);
        const apiItemPath = getMainPathOfApiItemName(getApiItemName(apiItem));
        if (!currentApiItemPath || !apiItemPath) {
            throw new Error('No more coding today.');
        }
        const relativePath = getRelativePath(currentApiItemPath, apiItemPath);
        const titleHash = getApiItemAnchorName(apiItem, context);

        return relativePath
            ? `${relativePath}.md#${titleHash}`
            : `#${titleHash}`;
    }

    function writeLinkToApiItemName(
        output: MarkdownOutput,
        currentApiItemName: string,
        apiItemName: string,
        linkText = apiItemName,
    ): void {
        const destination = getLinkToApiItemName(
            currentApiItemName,
            apiItemName,
        );

        output.write(`<a href="${destination}">${linkText}</a>`);
    }

    function writeLinkToApiItem(
        output: MarkdownOutput,
        currentApiItemName: string,
        apiItem: aeModel.ApiItem,
        context: Context,
        linkText = getApiItemName(apiItem),
    ) {
        const destination = getLinkToApiItem(
            currentApiItemName,
            apiItem,
            context,
        );

        output.write(`<a href="${destination}">${linkText}</a>`);
    }

    export function writeSummary(
        output: MarkdownOutput,
        apiItem: aeModel.ApiItem,
        context: Context,
    ): void {
        const summarySection = getDocComment(apiItem).summarySection;
        writeApiItemDocNode(output, apiItem, summarySection, context);
    }

    export function writeExamples(
        output: MarkdownOutput,
        apiItem: aeModel.ApiItem,
        context: Context,
    ): void {
        const customBlocks = extractCustomBlocks(apiItem);
        for (const exampleBlock of customBlocks.exampleBlocks) {
            output.ensureSkippedLine();
            output.write('#### Example');
            for (const block of exampleBlock.getChildNodes()) {
                writeApiItemDocNode(output, apiItem, block, context);
            }
        }
    }

    function areMultipleKindsInApiItemList(
        apiItems: aeModel.ApiItem[],
    ): boolean {
        const kind = apiItems[0].kind;
        return apiItems.some((apiItem_) => apiItem_.kind !== kind);
    }

    function hasMultipleKinds(
        apiItem: aeModel.ApiItem,
        context: Context,
    ): boolean {
        return areMultipleKindsInApiItemList(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            context.apiItemsByMemberName.get(getApiItemName(apiItem))!,
        );
    }

    export function getMultiKindApiItemAnchorNameFromNameAndKind(
        name: string,
        kind: string,
    ): string {
        return `${name}-${kind}`.toLowerCase().replace(/ /g, '');
    }

    function getMultiKindApiItemAnchorName(apiItem: aeModel.ApiItem): string {
        return getMultiKindApiItemAnchorNameFromNameAndKind(
            getApiItemName(apiItem),
            apiItem.kind,
        );
    }

    function getApiItemAnchorName(
        apiItem: aeModel.ApiItem,
        context: Context,
    ): string {
        if (hasMultipleKinds(apiItem, context)) {
            return getMultiKindApiItemAnchorName(apiItem);
        }
        return getApiItemName(apiItem).toLowerCase();
    }

    export function writeApiItemAnchor(
        output: MarkdownOutput,
        apiItem: aeModel.ApiItem,
        context: Context,
        textKind: string,
    ): void {
        if (hasMultipleKinds(apiItem, context)) {
            output.ensureSkippedLine();
            output.writeLine(
                `<a name="${getMultiKindApiItemAnchorName(apiItem)}"></a>`,
            );
            output.writeLine();
            output.write(`### \`${getApiItemName(apiItem)} - ${textKind}\``);
        }
    }

    export function writeSignature(
        output: MarkdownOutput,
        apiItem:
            | aeModel.ApiFunction
            | aeModel.ApiInterface
            | aeModel.ApiVariable
            | aeModel.ApiTypeAlias,
        context: Context,
    ): void {
        output.ensureSkippedLine();
        output.writeLine('#### Signature');
        writeApiItemExcerpt(output, apiItem, apiItem.excerpt, context);
    }

    export function writeSeeBlocks(
        output: MarkdownOutput,
        apiItem: aeModel.ApiItem,
        context: Context,
    ): void {
        const customBlocks = extractCustomBlocks(apiItem);
        let hasReachedSeeBlock = false;
        for (const seeBlock of customBlocks.seeBlocks) {
            if (!hasReachedSeeBlock) {
                hasReachedSeeBlock = true;
                output.ensureSkippedLine();
                output.write('#### See Also');
                output.increaseIndent('* ');
            }
            for (const block of seeBlock.getChildNodes()) {
                output.ensureNewLine();
                writeApiItemDocNode(output, apiItem, block, context, true);
            }
        }
        if (hasReachedSeeBlock) {
            output.decreaseIndent();
        }
    }

    class TableCell {
        readonly content = new tsdoc.DocSection({
            configuration: globalTSDocConfiguration,
        });

        public appendNode(docNode: tsdoc.DocNode): this {
            this.content.appendNode(docNode);
            return this;
        }

        public appendNodes(docNodes: readonly tsdoc.DocNode[]): this {
            for (const node of docNodes) {
                this.content.appendNode(node);
            }
            return this;
        }
    }

    class TableRow {
        public readonly cells: TableCell[] = [];

        public addCell(cell: TableCell): this {
            this.cells.push(cell);
            return this;
        }

        public createAndAddCell(): TableCell {
            const newCell: TableCell = new TableCell();
            this.addCell(newCell);
            return newCell;
        }

        public addPlainTextCell(cellContent: string): TableCell {
            const cell: TableCell = this.createAndAddCell();
            cell.content.appendNodeInParagraph(
                new tsdoc.DocPlainText({
                    configuration: globalTSDocConfiguration,
                    text: cellContent,
                }),
            );
            return cell;
        }
    }

    export type TableParameters =
        | {
              headerCells?: readonly TableCell[];
              headerTitles?: undefined;
          }
        | {
              headerCells?: undefined;
              headerTitles?: readonly string[];
          };

    export class Table {
        public readonly header = new TableRow();
        public readonly rows: TableRow[] = [];

        public constructor(parameters?: TableParameters) {
            if (parameters) {
                if (parameters.headerTitles) {
                    for (const cellText of parameters.headerTitles) {
                        this.header.addPlainTextCell(cellText);
                    }
                } else if (parameters.headerCells) {
                    for (const cell of parameters.headerCells) {
                        this.header.addCell(cell);
                    }
                }
            }
        }

        public addRow(row: TableRow): this {
            this.rows.push(row);
            return this;
        }

        public createAndAddRow(): TableRow {
            const row = new TableRow();
            this.addRow(row);
            return row;
        }

        public writeAsMarkdown(
            output: MarkdownOutput,
            apiItem: aeModel.ApiItem,
            context: Context,
        ): void {
            output.ensureSkippedLine();

            // Markdown table rows can have inconsistent cell counts. Size the
            // Table based on the longest row.
            let columnCount = 0;
            if (this.header) {
                columnCount = this.header.cells.length;
            }
            for (const row of this.rows) {
                if (row.cells.length > columnCount) {
                    columnCount = row.cells.length;
                }
            }

            // Write the table header (which is required by Markdown).
            output.write('|');
            for (let i = 0; i < columnCount; ++i) {
                output.write(' ');
                if (this.header) {
                    const cell = this.header.cells[i];
                    if (cell) {
                        writeApiItemDocNode(
                            output,
                            apiItem,
                            cell.content,
                            context,
                            true,
                        );
                    }
                }
                output.write(' |');
            }
            output.writeLine();

            // Write the divider.
            output.write('|');
            for (let i = 0; i < columnCount; ++i) {
                output.write(' --- |');
            }

            for (const row of this.rows) {
                output.ensureNewLine();
                output.write('|');
                for (const cell of row.cells) {
                    output.write(' ');
                    writeApiItemDocNode(
                        output,
                        apiItem,
                        cell.content,
                        context,
                        true,
                    );
                    output.write(' |');
                }
            }
        }
    }

    function appendExcerptWithHyperlinks(
        container: tsdoc.DocNodeContainer,
        excerpt: aeModel.Excerpt,
        apiItem: aeModel.ApiItem,
        context: Context,
    ): void {
        container.appendNode(
            new tsdoc.DocHtmlStartTag({
                configuration: globalTSDocConfiguration,
                name: 'code',
            }),
        );

        for (const token of excerpt.spannedTokens) {
            const tokenText = unwrapText(token.text);
            const reference = getExcerptTokenReference(
                token,
                tokenText,
                excerpt.text,
                context,
            );

            if (reference) {
                container.appendNode(
                    new tsdoc.DocLinkTag({
                        configuration: globalTSDocConfiguration,
                        tagName: '@link',
                        linkText: tokenText,
                        urlDestination: getLinkToApiItem(
                            getApiItemName(apiItem),
                            reference,
                            context,
                        ),
                    }),
                );
            } else {
                container.appendNode(
                    new tsdoc.DocPlainText({
                        configuration: globalTSDocConfiguration,
                        text: tokenText,
                    }),
                );
            }
        }

        container.appendNode(
            new tsdoc.DocHtmlEndTag({
                configuration: globalTSDocConfiguration,
                name: 'code',
            }),
        );
    }

    function createParagraphForTypeExcerpt(
        excerpt: aeModel.Excerpt,
        apiItem: aeModel.ApiItem,
        context: Context,
    ): tsdoc.DocParagraph {
        const paragraph = new tsdoc.DocParagraph({
            configuration: globalTSDocConfiguration,
        });

        if (!excerpt.text.trim()) {
            paragraph.appendNode(
                new tsdoc.DocPlainText({
                    configuration: globalTSDocConfiguration,
                    text: '(not declared)',
                }),
            );
        } else {
            appendExcerptWithHyperlinks(paragraph, excerpt, apiItem, context);
        }

        return paragraph;
    }

    export function writeParameters(
        output: MarkdownOutput,
        apiItem: aeModel.ApiFunction,
        context: Context,
    ): void {
        const parametersTable = new Table({
            headerTitles: ['Parameter', 'Type', 'Description'],
        });

        if (apiItem.parameters.some((param) => param.tsdocParamBlock)) {
            for (const apiParameter of apiItem.parameters) {
                const parameterRow = new TableRow()
                    .addCell(
                        new TableCell().appendNode(
                            new tsdoc.DocParagraph(
                                { configuration: globalTSDocConfiguration },
                                [
                                    new tsdoc.DocPlainText({
                                        configuration: globalTSDocConfiguration,
                                        text: `\`${apiParameter.name}\``,
                                    }),
                                ],
                            ),
                        ),
                    )
                    .addCell(
                        new TableCell().appendNode(
                            createParagraphForTypeExcerpt(
                                apiParameter.parameterTypeExcerpt,
                                apiItem,
                                context,
                            ),
                        ),
                    );

                if (apiParameter.tsdocParamBlock) {
                    parameterRow.addCell(
                        new TableCell().appendNodes(
                            apiParameter.tsdocParamBlock.content.nodes,
                        ),
                    );
                }

                parametersTable.addRow(parameterRow);
            }
        }

        if (parametersTable.rows.length > 0) {
            output.ensureSkippedLine();
            output.write('#### Parameters');
            parametersTable.writeAsMarkdown(output, apiItem, context);
        }

        const docComment = getDocComment(apiItem);
        if (
            aeModel.ApiReturnTypeMixin.isBaseClassOf(apiItem) &&
            docComment.returnsBlock
        ) {
            const returnsRow = new TableRow().addCell(
                new TableCell().appendNode(
                    createParagraphForTypeExcerpt(
                        apiItem.returnTypeExcerpt,
                        apiItem,
                        context,
                    ),
                ),
            );

            returnsRow.addCell(
                new TableCell().appendNodes(
                    docComment.returnsBlock.content.nodes,
                ),
            );

            output.ensureSkippedLine();
            output.write('#### Returns');
            new Table({
                headerTitles: ['Type', 'Description'],
            })
                .addRow(returnsRow)
                .writeAsMarkdown(output, apiItem, context);
        }
    }

    // This is needed because api-extractor-model ships with its own tsdoc
    // version in its node_modules folder, so the instanceof check doesn't work.
    // Therefore we have to re-implement it here.
    function resolveDeclarationReference(
        declarationReference:
            | tsdoc.DocDeclarationReference
            | DeclarationReference,
        contextApiItem: aeModel.ApiItem | undefined,
        context: Context,
    ): aeModel.IResolveDeclarationReferenceResult {
        if (declarationReference instanceof DeclarationReference) {
            // Build the lookup on demand
            if (!context.apiItemsByCanonicalReference) {
                context.apiItemsByCanonicalReference = new Map<
                    string,
                    aeModel.ApiItem
                >();

                for (const apiPackage of context.apiModel.packages) {
                    initApiItemsRecursive(apiPackage, context);
                }
            }

            const result: aeModel.IResolveDeclarationReferenceResult = {
                resolvedApiItem: undefined,
                errorMessage: undefined,
            };

            const apiItem:
                | aeModel.ApiItem
                | undefined = context.apiItemsByCanonicalReference.get(
                declarationReference.toString(),
            );

            if (!apiItem) {
                result.errorMessage = `${declarationReference.toString()} can not be located`;
            } else {
                result.resolvedApiItem = apiItem;
            }

            return result;
        }

        return context.apiModel.resolveDeclarationReference(
            declarationReference,
            contextApiItem,
        );
    }

    function initApiItemsRecursive(
        apiItem: aeModel.ApiItem,
        context: Context,
    ): void {
        if (apiItem.canonicalReference && !apiItem.canonicalReference.isEmpty) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            context.apiItemsByCanonicalReference!.set(
                apiItem.canonicalReference.toString(),
                apiItem,
            );
        }

        // Recurse container members
        if (aeModel.ApiItemContainerMixin.isBaseClassOf(apiItem)) {
            for (const apiMember of apiItem.members) {
                initApiItemsRecursive(apiMember, context);
            }
        }
    }

    function getExcerptTokenReference(
        token: aeModel.ExcerptToken,
        debugTokenText: string,
        debugExcerptText: string,
        context: Context,
    ): aeModel.ApiItem | null {
        if (
            token.kind !== aeModel.ExcerptTokenKind.Reference ||
            !token.canonicalReference ||
            // Local reference.
            token.canonicalReference.toString().includes('!~') ||
            // Non-module reference.
            token.canonicalReference.toString().startsWith('!')
        ) {
            return null;
        }
        let canonicalReference = token.canonicalReference;
        if (canonicalReference.toString().endsWith(':function')) {
            // Requires (overloadIndex) at the end if a function.
            canonicalReference = canonicalReference.withOverloadIndex(1);
        }
        if (canonicalReference.toString().includes('!Event')) {
            // Event type shadows the global type so api-extractor replaces it
            // with Event_2, but doesn't bother changing the references to
            // the updated name.
            canonicalReference = DeclarationReference.parse(
                canonicalReference.toString().replace('!Event', '!Event_2'),
            );
        }
        let result = resolveDeclarationReference(
            canonicalReference,
            undefined,
            context,
        );
        if (!result.resolvedApiItem) {
            // Hack: for some reason the generated api model links not to
            // the imported package but under it's own package. Therefore go
            // through each package and test if the import actually comes
            // from there.
            // This code is terrible but I can't be bothered.
            const packages = context.apiModel.packages;
            let containedPackage: aeModel.ApiPackage | undefined;
            for (const package_ of packages) {
                if (
                    canonicalReference
                        .toString()
                        .startsWith(package_.canonicalReference.toString())
                ) {
                    containedPackage = package_;
                }
            }
            if (containedPackage) {
                const canonicalReferenceWithoutStart = canonicalReference
                    .toString()
                    .slice(
                        containedPackage.canonicalReference.toString().length,
                    );
                for (const package_ of packages) {
                    if (package_ === containedPackage) {
                        continue;
                    }
                    const newReference = DeclarationReference.parse(
                        package_.canonicalReference.toString() +
                            canonicalReferenceWithoutStart,
                    );
                    result = resolveDeclarationReference(
                        newReference,
                        undefined,
                        context,
                    );
                    if (result.resolvedApiItem) {
                        break;
                    }
                }
            }
        }

        if (result.errorMessage) {
            console.log(
                `Error resolving excerpt token ${colors.underline.bold(
                    debugTokenText,
                )} reference: ${colors.red(
                    result.errorMessage,
                )}. The original signature is ${colors.underline.bold(
                    unwrapText(debugExcerptText),
                )}`,
            );
        }

        if (result.resolvedApiItem) {
            return result.resolvedApiItem;
        }

        return null;
    }

    function writeApiItemExcerpt(
        output: MarkdownOutput,
        apiItem: aeModel.ApiItem,
        excerpt: aeModel.Excerpt,
        context: Context,
    ): void {
        if (!excerpt.text.trim()) {
            throw new Error(`Received excerpt with no declaration.`);
        }

        output.write('<pre>');
        if (apiItem.kind === aeModel.ApiItemKind.Variable) {
            output.write('var ');
        }
        for (const token of excerpt.spannedTokens) {
            let tokenText = unwrapText(token.text);
            if (token === excerpt.spannedTokens[0]) {
                tokenText = tokenText.replace(/^export (declare )?/, '');
            }
            const reference = getExcerptTokenReference(
                token,
                tokenText,
                excerpt.text,
                context,
            );
            if (reference !== null) {
                writeLinkToApiItem(
                    output,
                    getApiItemName(apiItem),
                    reference,
                    context,
                );
            } else {
                output.write(escapeHTML(tokenText));
            }
        }
        output.write('</pre>');
    }
}
/* eslint-enable no-inner-declarations */

interface ExportImplementation<T extends aeModel.ApiItem> {
    readonly actualKind: aeModel.ApiItemKind;
    readonly simplifiedKind: string;
    addImplementation(apiItem: T): void;
    hasImplementation(): boolean;
    writeAsMarkdown(output: MarkdownOutput): void;
}

class ExportFunctionImplementation
    implements ExportImplementation<aeModel.ApiFunction> {
    public readonly actualKind = aeModel.ApiItemKind.Function;
    public readonly simplifiedKind = 'Function';
    private _displayName?: string;
    private _overloads: aeModel.ApiFunction[] = [];

    constructor(private _context: Context) {}

    public addImplementation(apiFunction: aeModel.ApiFunction): void {
        const apiFunctionName = getApiItemName(apiFunction);
        if (this._displayName === undefined) {
            this._displayName = apiFunctionName;
        } else if (this._displayName !== apiFunctionName) {
            throw new UnsupportedApiItemError(
                apiFunction,
                `Expected displayName property equal to ${this._displayName}.`,
            );
        }
        this._overloads.push(apiFunction);
    }

    public hasImplementation(): boolean {
        return this._displayName !== undefined;
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        if (this._displayName === undefined) {
            throw new Error('Not implemented.');
        }

        this._overloads.sort((a, b) => a.overloadIndex - b.overloadIndex);
        this._overloads.forEach((overload, i) => {
            if (overload.overloadIndex !== i + 1) {
                throw new UnsupportedApiItemError(
                    overload,
                    `Invalid overload index ${
                        overload.overloadIndex
                    } expected ${i + 1}. Total overloads: ${
                        this._overloads.length
                    }.`,
                );
            }
        });

        const context = this._context;

        MarkdownRenderUtil.writeApiItemAnchor(
            output,
            this._overloads[0],
            context,
            this.simplifiedKind,
        );

        for (const fn of this._overloads) {
            MarkdownRenderUtil.writeSignature(output, fn, context);
            MarkdownRenderUtil.writeSummary(output, fn, context);
            MarkdownRenderUtil.writeParameters(output, fn, context);
            MarkdownRenderUtil.writeExamples(output, fn, context);
            MarkdownRenderUtil.writeSeeBlocks(output, fn, context);
        }
    }

    // `
    // [summary]
    // [examples]
    // ...
    // [overloads]
    // [overload 1]
    // [signature]
    // [description]
    // [params]
    // [returns]
    // ...
    // [see]
    // `;
}

class ExportInterfaceImplementation
    implements ExportImplementation<aeModel.ApiInterface> {
    public readonly actualKind = aeModel.ApiItemKind.Interface;
    public readonly simplifiedKind = 'Interface';
    private _apiInterface?: aeModel.ApiInterface;

    constructor(private _context: Context) {}

    public addImplementation(apiInterface: aeModel.ApiInterface) {
        if (this._apiInterface) {
            throw new UnsupportedApiItemError(
                apiInterface,
                'Duplicate api interface.',
            );
        }
        this._apiInterface = apiInterface;
    }

    public hasImplementation(): boolean {
        return !!this._apiInterface;
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        const interface_ = this._apiInterface;

        if (!interface_) {
            throw new Error('Not implemented.');
        }

        const context = this._context;

        MarkdownRenderUtil.writeApiItemAnchor(
            output,
            interface_,
            context,
            this.simplifiedKind,
        );
        MarkdownRenderUtil.writeSignature(output, interface_, context);
        MarkdownRenderUtil.writeSummary(output, interface_, context);
        MarkdownRenderUtil.writeExamples(output, interface_, context);
        MarkdownRenderUtil.writeSeeBlocks(output, interface_, context);
    }
}

class ExportTypeAliasImplementation
    implements ExportImplementation<aeModel.ApiTypeAlias> {
    public readonly actualKind = aeModel.ApiItemKind.TypeAlias;
    public readonly simplifiedKind = 'Type Alias';
    private _apiTypeAlias?: aeModel.ApiTypeAlias;

    constructor(private _context: Context) {}

    public addImplementation(apiTypeAlias: aeModel.ApiTypeAlias) {
        if (this._apiTypeAlias) {
            throw new UnsupportedApiItemError(
                apiTypeAlias,
                'Duplicate api type alias.',
            );
        }
        this._apiTypeAlias = apiTypeAlias;
    }

    public hasImplementation(): boolean {
        return !!this._apiTypeAlias;
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        const typeAlias = this._apiTypeAlias;

        if (!typeAlias) {
            throw new Error('Not implemented.');
        }

        const context = this._context;

        MarkdownRenderUtil.writeApiItemAnchor(
            output,
            typeAlias,
            context,
            this.simplifiedKind,
        );
        MarkdownRenderUtil.writeSignature(output, typeAlias, context);
        MarkdownRenderUtil.writeSummary(output, typeAlias, context);
        MarkdownRenderUtil.writeExamples(output, typeAlias, context);
        MarkdownRenderUtil.writeSeeBlocks(output, typeAlias, context);
    }
}

class ExportVariableImplementation
    implements ExportImplementation<aeModel.ApiVariable> {
    public readonly actualKind = aeModel.ApiItemKind.Variable;
    public readonly simplifiedKind = 'Variable';
    private _apiVariable?: aeModel.ApiVariable;

    constructor(private _context: Context) {}

    public addImplementation(apiVariable: aeModel.ApiVariable) {
        if (this._apiVariable) {
            throw new UnsupportedApiItemError(
                apiVariable,
                'Duplicate api variable.',
            );
        }
        this._apiVariable = apiVariable;
    }

    public hasImplementation(): boolean {
        return !!this._apiVariable;
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        const variable = this._apiVariable;

        if (!variable) {
            throw new Error('Not implemented.');
        }

        const context = this._context;

        MarkdownRenderUtil.writeApiItemAnchor(
            output,
            variable,
            context,
            'Variable',
        );
        MarkdownRenderUtil.writeSignature(output, variable, context);
        MarkdownRenderUtil.writeSummary(output, variable, context);
        MarkdownRenderUtil.writeExamples(output, variable, context);
        MarkdownRenderUtil.writeSeeBlocks(output, variable, context);
    }
}

class ExportImplementationGroup {
    private _displayName?: string;
    private _implementations = new Map<
        aeModel.ApiItemKind,
        ExportImplementation<aeModel.ApiItem>
    >([
        [
            aeModel.ApiItemKind.Function,
            new ExportFunctionImplementation(this._context),
        ],
        [
            aeModel.ApiItemKind.Interface,
            new ExportInterfaceImplementation(this._context),
        ],
        [
            aeModel.ApiItemKind.TypeAlias,
            new ExportTypeAliasImplementation(this._context),
        ],
        [
            aeModel.ApiItemKind.Variable,
            new ExportVariableImplementation(this._context),
        ],
    ]);

    constructor(private _context: Context) {}

    public addImplementation(apiItem: aeModel.ApiItem): void {
        const impl = this._implementations.get(apiItem.kind);

        if (!impl) {
            throw new UnsupportedApiItemError(
                apiItem,
                `Invalid kind ${apiItem.kind}`,
            );
        }

        if (this._displayName === undefined) {
            this._displayName = getApiItemName(apiItem);
        } else if (this._displayName !== getApiItemName(apiItem)) {
            throw new UnsupportedApiItemError(
                apiItem,
                `Expected displayName property equal to ${this._displayName}.`,
            );
        }

        impl.addImplementation(apiItem);
    }

    public hasMultipleImplementations(): boolean {
        let num = 0;
        for (const [, impl] of this._implementations) {
            if (impl.hasImplementation()) {
                if (num === 1) {
                    return true;
                }
                num++;
            }
        }
        return false;
    }

    public *getImplementations(): IterableIterator<
        ExportImplementation<aeModel.ApiItem>
    > {
        for (const impl of this._implementations.values()) {
            if (impl.hasImplementation()) {
                yield impl;
            }
        }
    }

    public writeAsMarkdown(output: MarkdownOutput): void {
        if (
            this._displayName === undefined ||
            Array.from(this._implementations).every(
                ([, impl]) => !impl.hasImplementation(),
            )
        ) {
            throw new Error('No implementations.');
        }
        output.ensureSkippedLine();
        output.write(`## \`${this._displayName}\``);
        for (const [, impl] of this._implementations) {
            if (impl.hasImplementation()) {
                impl.writeAsMarkdown(output);
            }
        }
    }
}

function getReleaseTag(apiItem: aeModel.ApiItem): aeModel.ReleaseTag {
    if (!aeModel.ApiReleaseTagMixin.isBaseClassOf(apiItem)) {
        throw new UnsupportedApiItemError(apiItem, 'No release tag.');
    }

    return apiItem.releaseTag;
}

class ApiPage {
    private _nameToImplGroup = new Map<string, ExportImplementationGroup>();

    constructor(private _context: Context, private _pageData: APIPageData) {
        for (const item of _pageData.items) {
            this._addApiItemName(item.main);
            if (item.nested) {
                for (const name of item.nested) {
                    this._addApiItemName(name);
                }
            }
        }
    }

    private _addApiItemName(name: string): void {
        const implGroup = new ExportImplementationGroup(this._context);
        this._nameToImplGroup.set(name, implGroup);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        for (const apiItem of this._context.apiItemsByMemberName.get(name)!) {
            if (getReleaseTag(apiItem) !== aeModel.ReleaseTag.Public) {
                throw new UnsupportedApiItemError(
                    apiItem,
                    'Non public api items are not supported.',
                );
            }

            implGroup.addImplementation(apiItem);
        }
    }

    private _getApiItemNameInlineReferences(
        name: string,
    ): TableOfContentsInlineReference[] | undefined {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const implGroup = this._nameToImplGroup.get(name)!;
        if (!implGroup.hasMultipleImplementations()) {
            return;
        }
        const references: TableOfContentsInlineReference[] = [];
        for (const impl of implGroup.getImplementations()) {
            references.push({
                text: impl.simplifiedKind,
                // eslint-disable-next-line max-len
                url_hash_text: MarkdownRenderUtil.getMultiKindApiItemAnchorNameFromNameAndKind(
                    name,
                    impl.actualKind,
                ),
            });
        }
        return references;
    }

    public renderAsMarkdown(): string {
        const output = new MarkdownOutput();

        const tableOfContents: TableOfContents = [];
        for (const item of this._pageData.items) {
            const reference: TableOfContentsMainReference = {
                text: item.main,
                url_hash_text: item.main.toLowerCase(),
            };
            const inlineReferences = this._getApiItemNameInlineReferences(
                item.main,
            );
            if (inlineReferences) {
                reference.inline_references = inlineReferences;
            }
            if (item.nested) {
                reference.nested_references = [];
                for (const name of item.nested) {
                    const nestedReference: TableOfContentsNestedReference = {
                        text: name,
                        url_hash_text: name.toLowerCase(),
                    };
                    // eslint-disable-next-line max-len
                    const inlineReferences = this._getApiItemNameInlineReferences(
                        name,
                    );
                    if (inlineReferences) {
                        nestedReference.inline_references = inlineReferences;
                    }
                    reference.nested_references.push(nestedReference);
                }
            }
            tableOfContents.push(reference);
        }

        const pageMetadata: PageMetadata = {
            title: this._pageData.title,
            table_of_contents: tableOfContents,
        };

        output.writeLine('---');
        output.write(yaml.stringify(pageMetadata, { indent: 2 }));
        output.writeLine('---');
        output.writeLine();
        output.write(
            '<!-- Do not edit this file. It is automatically generated by a build script. -->',
        );

        for (const [, implGroup] of this._nameToImplGroup) {
            implGroup.writeAsMarkdown(output);
        }

        output.ensureNewLine();

        return output.toString();
    }
}

export class ApiPageMap {
    private _pathToPage = new Map<string, ApiPage>();
    private _context: Context;

    constructor(
        apiModel: aeModel.ApiModel,
        sourceExportMappings: SourceExportMappings,
    ) {
        const apiItemsByMemberName = new Map<string, aeModel.ApiItem[]>();

        this._context = {
            sourceExportMappings,
            apiModel,
            apiItemsByMemberName,
        };

        for (const package_ of apiModel.members) {
            if (package_.kind !== aeModel.ApiItemKind.Package) {
                throw new UnsupportedApiItemError(
                    package_,
                    'Expected to be a package.',
                );
            }

            const members = (package_ as aeModel.ApiPackage).entryPoints[0]
                .members;
            const apiItemsByMemberName_ = new Map<string, aeModel.ApiItem[]>();

            for (const apiItem of members) {
                const memberName = getApiItemName(apiItem);

                if (apiItemsByMemberName.has(memberName)) {
                    throw new UnsupportedApiItemError(
                        apiItem,
                        `Duplicate api item name ${memberName} between packages.`,
                    );
                }

                let apiItems = apiItemsByMemberName_.get(memberName);
                if (!apiItems) {
                    apiItems = [];
                    apiItemsByMemberName_.set(memberName, apiItems);
                }
                apiItems.push(apiItem);
            }

            for (const [k, v] of apiItemsByMemberName_) {
                apiItemsByMemberName.set(k, v);
            }
        }

        assertMappedApiItemNames(apiItemsByMemberName.keys());

        forEachPage((pathName, pageData) => {
            const page = new ApiPage(this._context, pageData);
            this._pathToPage.set(pathName, page);
        });
    }

    public renderAsMarkdownToDirectoryMap(): RenderedDirectoryMap {
        const renderedDirectoryMap = new RenderedDirectoryMap();

        for (const [path, page] of this._pathToPage) {
            renderedDirectoryMap.addContentAtPath(
                path + '.md',
                page.renderAsMarkdown(),
            );
        }

        return renderedDirectoryMap;
    }
}

class Folder {
    public files = new Map<string, string>();
    public folders = new Map<string, Folder>();
}

class RenderedDirectoryMap {
    private _rootFolder = new Folder();

    public addContentAtPath(path: string, content: string): void {
        const splitPath = path.split('/');
        const fileName = splitPath.pop();

        if (!fileName) {
            throw new Error(`Empty path.`);
        }

        let folder = this._rootFolder;
        for (const dirName of splitPath) {
            let nestedFolder = folder.folders.get(dirName);

            if (!nestedFolder) {
                nestedFolder = new Folder();
                folder.folders.set(dirName, nestedFolder);
            }

            folder = nestedFolder;
        }

        if (folder.files.has(fileName)) {
            throw new Error(`Duplicate path ${path}`);
        }

        folder.files.set(fileName, content);
    }

    public writeToDirectory(dirName: string): Promise<unknown> {
        return this._writeFolderToPath(dirName, this._rootFolder);
    }

    private async _writeFolderToPath(
        dirName: string,
        folder: Folder,
    ): Promise<unknown> {
        await fs.ensureDir(dirName);

        const promises: Promise<unknown>[] = [];

        for (const [fileName, fileContent] of folder.files) {
            promises.push(
                fs.writeFile(
                    path.join(dirName, fileName),
                    fileContent,
                    'utf-8',
                ),
            );
        }

        for (const [folderName, nestedFolder] of folder.folders) {
            promises.push(
                this._writeFolderToPath(
                    path.join(dirName, folderName),
                    nestedFolder,
                ),
            );
        }

        return Promise.all(promises);
    }
}

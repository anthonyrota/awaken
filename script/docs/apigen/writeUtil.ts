/* eslint-disable max-len */
/**
 * Thanks to the api-documenter team for some ideas used in this script:
 *
 * https://github.com/microsoft/rushstack/blob/8b2edd9/apps/api-documenter/src/markdown/MarkdownEmitter.ts
 * https://github.com/microsoft/rushstack/blob/a30cdf5/apps/api-extractor-model/src/model/ApiModel.ts
 *
 * The api-documenter project is licensed under MIT, and its license can be found at <rootDir>/vendor/licenses/@microsoft/api-documenter/LICENSE
 * The api-extractor-model project is licensed under MIT, and its license can be found at <rootDir>/vendor/licenses/@microsoft/api-extractor-model/LICENSE
 */
/* eslint-enable max-len */

import * as colors from 'colors';
import * as ts from 'typescript';
import * as tsdoc from '@microsoft/tsdoc';
import { DeclarationReference } from '@microsoft/tsdoc/lib/beta/DeclarationReference';
import * as aeModel from '@microsoft/api-extractor-model';
import * as output from './output';
import { getMainPathOfApiItemName } from './paths';
import { SourceMetadata } from './sourceMetadata';

export interface Context {
    sourceMetadata: SourceMetadata;
    apiModel: aeModel.ApiModel;
    apiItemsByMemberName: Map<string, aeModel.ApiItem[]>;
    apiItemsByCanonicalReference?: Map<string, aeModel.ApiItem>;
}

const seeTag = new tsdoc.TSDocTagDefinition({
    tagName: '@see',
    syntaxKind: tsdoc.TSDocTagSyntaxKind.BlockTag,
});

aeModel.AedocDefinitions.tsdocConfiguration.addTagDefinition(seeTag);

export class UnsupportedApiItemError extends Error {
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

function getExampleBlocks(docComment: tsdoc.DocComment): tsdoc.DocBlock[] {
    return getBlocksOfTag(docComment.customBlocks, tsdoc.StandardTags.example);
}

function getSeeBlocks(docComment: tsdoc.DocComment): tsdoc.DocBlock[] {
    return getBlocksOfTag(docComment.customBlocks, seeTag);
}

export function getApiItemName(
    apiItem: import('@microsoft/api-extractor-model').ApiItem,
): string {
    const match = /^(.+)_\d+$/.exec(apiItem.displayName);
    if (match) {
        return match[1];
    }
    return apiItem.displayName;
}

interface TSDocNodeWriteContext {
    context: Context;
    container: output.Container;
    embeddedNodeContext: EmbeddedNodeContext;
    nodeIter: TSDocNodeIter;
    htmlTagStack: output.HtmlElement[];
    apiItem: aeModel.ApiItem;
}

interface TSDocNodeIter {
    next(): tsdoc.DocNode | undefined;
    forEach(cb: (node: tsdoc.DocNode) => void): void;
}

function TSDocNodeIter(nodes: readonly tsdoc.DocNode[]): TSDocNodeIter {
    let idx = 0;
    const iter = {
        next(): tsdoc.DocNode | undefined {
            return nodes[idx++];
        },
        forEach(cb: (node: tsdoc.DocNode) => void): void {
            let node: tsdoc.DocNode | undefined;
            while ((node = iter.next())) {
                cb(node);
            }
        },
    };
    return iter;
}

function writeApiItemDocNode(
    container: output.Container,
    apiItem: aeModel.ApiItem,
    docNode: tsdoc.DocNode,
    context: Context,
): void {
    const nodeIter = TSDocNodeIter([docNode]);
    nodeIter.next();
    const container_ = new output.Container();
    const embeddedNodeContext = new EmbeddedNodeContext();
    const context_ = {
        context,
        container: container_,
        nodeIter,
        htmlTagStack: [],
        embeddedNodeContext,
        apiItem,
    };
    writeNode(docNode, context_);
    if (container_.getChildCount() > 0) {
        new EmbeddedNode(
            container_,
            embeddedNodeContext,
        ).substituteEmbeddedNodes();
        container.addChild(container_);
    }
}

class EmbeddedNodeContext {
    private _n = 0;
    private _idMap = new Map<number, EmbeddedNode>();

    public generateMarker(node: EmbeddedNode): string {
        const id = this._n++;
        this._idMap.set(id, node);
        return `<!--__EmbeddedNode__:${id}-->`;
    }

    public getNodeForId(id: number): EmbeddedNode {
        const node = this._idMap.get(id);
        if (!node) {
            throw new Error('No node defined for given id.');
        }
        return node;
    }
}

class EmbeddedNode extends output.Node {
    private _marker: string;

    constructor(
        public node: output.Node,
        protected _context: EmbeddedNodeContext,
    ) {
        super();
        if (node instanceof EmbeddedNode) {
            throw new Error(
                'EmbeddedNode node argument cannot be an EmbeddedNode.',
            );
        }
        this._marker = _context.generateMarker(this);
    }

    public writeAsMarkdown(out: output.MarkdownOutput): void {
        out.write(this._marker);
    }

    public substituteEmbeddedNodes(): void {
        if (!(this.node instanceof output.Container)) {
            return;
        }
        const markdown = new output.Container()
            .addChildren(...this.node.getChildren())
            .renderAsMarkdown();
        const markdownContainer = output.parseMarkdown(markdown, {
            unwrapFirstLineParagraph: true,
        });

        this._substituteEmbeddedNodes(markdownContainer);
        this.node.setChildren(markdownContainer.getChildren());
    }

    private _substituteEmbeddedNodes(node: output.Container): void {
        const children = node.getChildren();
        for (const [i, child] of children.entries()) {
            if (child instanceof output.Container) {
                this._substituteEmbeddedNodes(child);
            } else if (child instanceof output.HtmlComment) {
                const match = /^__EmbeddedNode__:(\d+)$/.exec(child.comment);
                if (match) {
                    const id = Number.parseInt(match[1]);
                    const embedded = this._context.getNodeForId(id);
                    embedded.substituteEmbeddedNodes();
                    children[i] = embedded.node;
                }
            }
        }
    }
}

function writeNode(
    docNode: tsdoc.DocNode,
    context: TSDocNodeWriteContext,
): void {
    const { container } = context;

    switch (docNode.kind) {
        case tsdoc.DocNodeKind.PlainText: {
            const docPlainText = docNode as tsdoc.DocPlainText;
            container.addChild(new output.RawText(docPlainText.text));
            break;
        }
        case tsdoc.DocNodeKind.HtmlStartTag: {
            const docStartTag = docNode as tsdoc.DocHtmlStartTag;
            const oldContainer = container;
            const htmlElement = new output.HtmlElement(docStartTag.name);
            oldContainer.addChild(
                new EmbeddedNode(htmlElement, context.embeddedNodeContext),
            );
            context.container = htmlElement;
            context.htmlTagStack.push(htmlElement);
            let node: tsdoc.DocNode | undefined;
            let didFindEndTag = false;
            while ((node = context.nodeIter.next())) {
                if (node.kind === tsdoc.DocNodeKind.HtmlEndTag) {
                    const docEndTag = node as tsdoc.DocHtmlEndTag;
                    if (
                        context.htmlTagStack[
                            context.htmlTagStack.length - 1
                        ] !== htmlElement
                    ) {
                        throw new Error('Unclosed tag.');
                    }
                    if (docEndTag.kind !== htmlElement.tagName) {
                        throw new Error(
                            'End html tag name not equal to start tag name.',
                        );
                    }
                    context.container = oldContainer;
                    didFindEndTag = true;
                    break;
                }
                writeNode(docNode, context);
            }
            if (!didFindEndTag) {
                throw new Error('Did not find corresponding end tag.');
            }
            break;
        }
        case tsdoc.DocNodeKind.HtmlEndTag: {
            throw new Error('Unexpected end tag.');
        }
        case tsdoc.DocNodeKind.CodeSpan: {
            const docCodeSpan = docNode as tsdoc.DocCodeSpan;
            container.addChild(
                new EmbeddedNode(
                    new output.CodeSpan().addChild(
                        new output.PlainText(docCodeSpan.code),
                    ),
                    context.embeddedNodeContext,
                ),
            );
            break;
        }
        case tsdoc.DocNodeKind.LinkTag: {
            const docLinkTag = docNode as tsdoc.DocLinkTag;
            if (docLinkTag.codeDestination) {
                writeLinkTagWithCodeDestination(docLinkTag, context);
            } else if (docLinkTag.urlDestination) {
                writeLinkTagWithUrlDestination(docLinkTag, context);
            } else if (docLinkTag.linkText) {
                container.addChild(
                    new EmbeddedNode(
                        new output.PlainText(docLinkTag.linkText),
                        context.embeddedNodeContext,
                    ),
                );
            }
            break;
        }
        case tsdoc.DocNodeKind.Paragraph: {
            const docParagraph = docNode as tsdoc.DocParagraph;
            // eslint-disable-next-line max-len
            const trimmedParagraph = tsdoc.DocNodeTransforms.trimSpacesInParagraph(
                docParagraph,
            );
            const oldContainer = container;
            const paragraph = new output.Paragraph();
            context.container = paragraph;
            for (const node of trimmedParagraph.nodes) {
                writeNode(node, context);
            }
            if (paragraph.getChildCount() > 0) {
                oldContainer.addChild(
                    new EmbeddedNode(paragraph, context.embeddedNodeContext),
                );
            }
            context.container = oldContainer;
            break;
        }
        case tsdoc.DocNodeKind.FencedCode: {
            const docFencedCode = docNode as tsdoc.DocFencedCode;
            container.addChild(
                new EmbeddedNode(
                    new output.CodeBlock(
                        docFencedCode.language,
                        docFencedCode.code,
                    ),
                    context.embeddedNodeContext,
                ),
            );
            break;
        }
        case tsdoc.DocNodeKind.Section: {
            const docSection = docNode as tsdoc.DocSection;
            for (const node of docSection.nodes) {
                writeNode(node, context);
            }
            break;
        }
        case tsdoc.DocNodeKind.SoftBreak: {
            const lastChild = container.getLastNestedChild();
            if (lastChild && lastChild instanceof output.RawText) {
                if (lastChild.text && !/\s$/.test(lastChild.text)) {
                    lastChild.append(' ');
                }
            } else {
                container.addChild(
                    new EmbeddedNode(
                        new output.PlainText(' '),
                        context.embeddedNodeContext,
                    ),
                );
            }
            break;
        }
        case tsdoc.DocNodeKind.EscapedText: {
            const docEscapedText = docNode as tsdoc.DocEscapedText;
            container.addChild(
                new EmbeddedNode(
                    new output.PlainText(docEscapedText.decodedText),
                    context.embeddedNodeContext,
                ),
            );
            break;
        }
        case tsdoc.DocNodeKind.ErrorText: {
            const docErrorText = docNode as tsdoc.DocErrorText;
            container.addChild(
                new EmbeddedNode(
                    new output.PlainText(docErrorText.text),
                    context.embeddedNodeContext,
                ),
            );
            break;
        }
        case tsdoc.DocNodeKind.InlineTag: {
            break;
        }
        case tsdoc.DocNodeKind.BlockTag: {
            const tagNode = docNode as tsdoc.DocBlockTag;
            if (tagNode.tagName !== '@see' && tagNode.tagName !== '@example') {
                console.warn(`Unsupported block tag: ${tagNode.tagName}`);
            }
            break;
        }
        default:
            throw new Error(`Unsupported DocNodeKind kind: ${docNode.kind}`);
    }
}

function writeLinkTagWithCodeDestination(
    docLinkTag: tsdoc.DocLinkTag,
    context: TSDocNodeWriteContext,
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
    const codeSpan = new output.HtmlElement('code');
    context.container.addChild(
        new EmbeddedNode(codeSpan, context.embeddedNodeContext),
    );
    const destination = getLinkToApiItemName(
        getApiItemName(context.apiItem),
        identifier,
    );
    codeSpan.addChild(
        new output.LocalPageLink(destination).addChild(
            new output.PlainText(
                docLinkTag.linkText !== undefined
                    ? docLinkTag.linkText
                    : identifier,
            ),
        ),
    );
}

function writeLinkTagWithUrlDestination(
    docLinkTag: tsdoc.DocLinkTag,
    context: TSDocNodeWriteContext,
): void {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const urlDestination = docLinkTag.urlDestination!;
    const linkText =
        docLinkTag.linkText !== undefined
            ? docLinkTag.linkText
            : urlDestination;

    context.container.addChild(
        new EmbeddedNode(
            new output.Link(urlDestination).addChild(
                new output.PlainText(linkText.replace(/\s+/g, ' ')),
            ),
            context.embeddedNodeContext,
        ),
    );
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

    return relativePath ? `${relativePath}#${titleHash}` : `#${titleHash}`;
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

    return relativePath ? `${relativePath}#${titleHash}` : `#${titleHash}`;
}

function isDocSectionEmpty(docComment: tsdoc.DocNode): boolean {
    if (docComment.getChildNodes().length === 0) {
        return true;
    }
    if (docComment.getChildNodes().length > 1) {
        return false;
    }
    const firstNode = docComment.getChildNodes()[0];
    if (firstNode.kind !== tsdoc.DocNodeKind.Paragraph) {
        return false;
    }
    const paragraphChildren = firstNode.getChildNodes();
    if (paragraphChildren.length > 1) {
        return false;
    }
    return (
        paragraphChildren.length === 1 &&
        paragraphChildren[0].kind === tsdoc.DocNodeKind.SoftBreak
    );
}

export function writeSummary(
    output: output.Container,
    apiItem: aeModel.ApiItem,
    context: Context,
    docComment = getDocComment(apiItem),
): boolean {
    const summarySection = docComment.summarySection;
    const isEmpty = isDocSectionEmpty(summarySection);
    if (isEmpty) {
        return false;
    }
    writeApiItemDocNode(output, apiItem, summarySection, context);
    return true;
}

export function writeExamples(
    container: output.Container,
    apiItem: aeModel.ApiItem,
    context: Context,
    docComment = getDocComment(apiItem),
): boolean {
    let didWrite = false;
    for (const exampleBlock of getExampleBlocks(docComment)) {
        container.addChild(
            new output.Title().addChild(new output.PlainText('Example Usage')),
        );
        for (const block of exampleBlock.getChildNodes()) {
            writeApiItemDocNode(container, apiItem, block, context);
        }
        didWrite = true;
    }
    return didWrite;
}

function areMultipleKindsInApiItemList(apiItems: aeModel.ApiItem[]): boolean {
    const kind = apiItems[0].kind;
    return apiItems.some((apiItem_) => apiItem_.kind !== kind);
}

function hasMultipleKinds(apiItem: aeModel.ApiItem, context: Context): boolean {
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
    container: output.Container,
    apiItem: aeModel.ApiItem,
    context: Context,
    textKind: string,
): void {
    if (hasMultipleKinds(apiItem, context)) {
        container.addChild(
            new output.Subheading(
                getMultiKindApiItemAnchorName(apiItem),
            ).addChild(
                new output.CodeSpan().addChild(
                    new output.PlainText(
                        `${getApiItemName(apiItem)} - ${textKind}`,
                    ),
                ),
            ),
        );
    }
}

export function writeBaseDoc(
    container: output.Container,
    apiItem: aeModel.ApiItem,
    context: Context,
    kind: ts.SyntaxKind,
): void {
    // eslint-disable-next-line max-len
    const exportNameMetadata = context.sourceMetadata.syntaxKindToExportNameMetadata.get(
        kind,
    );
    if (!exportNameMetadata) {
        throw new Error(`No export name metadata for kind ${kind}.`);
    }

    const baseDocComment = exportNameMetadata.exportNameToBaseDocComment.get(
        getApiItemName(apiItem),
    );
    if (!baseDocComment) {
        return;
    }

    const tsdocParser = new tsdoc.TSDocParser(
        aeModel.AedocDefinitions.tsdocConfiguration,
    );
    const parserContext = tsdocParser.parseRange(baseDocComment.textRange);
    const docComment = parserContext.docComment;

    const errorMessages = parserContext.log.messages.filter(
        (message) => !message.toString().includes('@see'),
    );

    if (errorMessages.length !== 0) {
        console.log(colors.red('Errors parsing TSDoc comment.'));
        console.log(
            colors.red(
                baseDocComment.textRange.buffer.slice(
                    baseDocComment.textRange.pos,
                    baseDocComment.textRange.end,
                ),
            ),
        );
        for (const message of errorMessages) {
            console.log(colors.red(message.toString()));
        }
    }

    writeSummary(container, apiItem, context, docComment);
    writeReturnsBlockWithoutType(container, apiItem, context, docComment);
    writeExamples(container, apiItem, context, docComment);
    writeSeeBlocks(container, apiItem, context, docComment);
}

function writeReturnsBlockWithoutType(
    container: output.Container,
    apiItem: aeModel.ApiItem,
    context: Context,
    docComment: tsdoc.DocComment,
): void {
    if (!docComment.returnsBlock) {
        return;
    }

    container.addChild(
        new output.Title().addChild(new output.PlainText('Returns')),
    );
    for (const node of docComment.returnsBlock.content.nodes) {
        writeApiItemDocNode(container, apiItem, node, context);
    }
}

export function writeSignatureExcerpt(
    container: output.Container,
    apiItem:
        | aeModel.ApiFunction
        | aeModel.ApiInterface
        | aeModel.ApiVariable
        | aeModel.ApiTypeAlias,
    context: Context,
) {
    writeApiItemExcerpt(container, apiItem, apiItem.excerpt, context);
}

export function writeSignature(
    container: output.Container,
    apiItem:
        | aeModel.ApiFunction
        | aeModel.ApiInterface
        | aeModel.ApiVariable
        | aeModel.ApiTypeAlias,
    context: Context,
): void {
    container.addChild(
        new output.Title().addChild(new output.PlainText('Signature')),
    );
    writeSignatureExcerpt(container, apiItem, context);
}

export function writeSeeBlocks(
    container: output.Container,
    apiItem: aeModel.ApiItem,
    context: Context,
    docComment = getDocComment(apiItem),
): boolean {
    const list = new output.List();
    for (const seeBlock of getSeeBlocks(docComment)) {
        const listItem = new output.Container();
        list.addChild(listItem);
        for (const block of seeBlock.getChildNodes()) {
            writeApiItemDocNode(listItem, apiItem, block, context);
        }
    }
    if (list.getChildCount() > 0) {
        container.addChild(
            new output.Title().addChild(new output.PlainText('See Also')),
        );
        container.addChild(list);
        return true;
    }
    return false;
}

function appendExcerptWithHyperlinks(
    container: output.Container,
    excerpt: aeModel.Excerpt,
    apiItem: aeModel.ApiItem,
    context: Context,
): void {
    const codeBlock = new output.RichCodeBlock('ts');
    container.addChild(codeBlock);

    const spannedTokens = excerpt.spannedTokens.slice();
    let token: aeModel.ExcerptToken | undefined;
    while ((token = spannedTokens.shift())) {
        const tokenText = token.text;
        const result = getExcerptTokenReference(
            token,
            tokenText,
            excerpt.text,
            context,
        );

        if (result === null) {
            codeBlock.addChild(new output.PlainText(tokenText));
        } else if (
            result.type === FoundExcerptTokenReferenceResultType.Export
        ) {
            codeBlock.addChild(
                new output.LocalPageLink(
                    getLinkToApiItem(
                        getApiItemName(apiItem),
                        result.apiItem,
                        context,
                    ),
                ).addChild(new output.PlainText(tokenText)),
            );
        } else {
            spannedTokens.unshift(...result.tokens);
        }
    }
}

function createNodeForTypeExcerpt(
    excerpt: aeModel.Excerpt,
    apiItem: aeModel.ApiItem,
    context: Context,
): output.Node {
    if (!excerpt.text.trim()) {
        return new output.PlainText('(not declared)');
    }

    const container = new output.Container();

    appendExcerptWithHyperlinks(container, excerpt, apiItem, context);

    return container;
}

export function writeParameters(
    container: output.Container,
    apiItem: aeModel.ApiFunction,
    context: Context,
): boolean {
    let didWrite = false;
    const parametersTable = new output.Table(
        new output.TableRow()
            .addChild(new output.PlainText('Parameter'))
            .addChild(new output.PlainText('Type'))
            .addChild(new output.PlainText('Description')),
    );

    if (apiItem.parameters.some((param) => param.tsdocParamBlock)) {
        for (const apiParameter of apiItem.parameters) {
            const parameterRow = new output.TableRow()
                .addChild(new output.PlainText(apiParameter.name))
                .addChild(
                    createNodeForTypeExcerpt(
                        apiParameter.parameterTypeExcerpt,
                        apiItem,
                        context,
                    ),
                );

            const cell = new output.Container();
            parameterRow.addChild(cell);
            if (apiParameter.tsdocParamBlock) {
                for (const node of apiParameter.tsdocParamBlock.content.nodes) {
                    writeApiItemDocNode(cell, apiItem, node, context);
                }
            }

            parametersTable.addChild(parameterRow);
        }
    }

    if (parametersTable.getChildCount() > 0) {
        container.addChild(
            new output.Title().addChild(new output.PlainText('Parameters')),
        );
        container.addChild(parametersTable);
        didWrite = true;
    }

    const docComment = getDocComment(apiItem);
    if (
        aeModel.ApiReturnTypeMixin.isBaseClassOf(apiItem) &&
        docComment.returnsBlock
    ) {
        const returnsRow = new output.TableRow().addChild(
            createNodeForTypeExcerpt(
                apiItem.returnTypeExcerpt,
                apiItem,
                context,
            ),
        );

        const cell = new output.Container();
        returnsRow.addChild(cell);
        for (const node of docComment.returnsBlock.content.nodes) {
            writeApiItemDocNode(cell, apiItem, node, context);
        }

        container.addChild(
            new output.Title().addChild(new output.PlainText('Returns')),
        );
        container.addChild(
            new output.Table(
                new output.TableRow()
                    .addChild(new output.PlainText('Type'))
                    .addChild(new output.PlainText('Description')),
            ).addChild(returnsRow),
        );
        didWrite = true;
    }

    return didWrite;
}

// This is needed because api-extractor-model ships with its own tsdoc
// version in its node_modules folder, so the instanceof check doesn't work.
// Therefore we have to re-implement it here.
function resolveDeclarationReference(
    declarationReference: tsdoc.DocDeclarationReference | DeclarationReference,
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

const enum FoundExcerptTokenReferenceResultType {
    Export,
    LocalSignatureTokens,
}

interface FoundApiItemReference {
    type: FoundExcerptTokenReferenceResultType.Export;
    apiItem: aeModel.ApiItem;
}

interface FoundLocalSignatureReference {
    type: FoundExcerptTokenReferenceResultType.LocalSignatureTokens;
    tokens: aeModel.ExcerptToken[];
}

function findLocalReferenceTokens(
    canonicalReference: DeclarationReference,
    context: Context,
): FoundLocalSignatureReference {
    context;
    console.log(canonicalReference.toString());
    return (null as unknown) as FoundLocalSignatureReference;
}

function getExcerptTokenReference(
    token: aeModel.ExcerptToken,
    debugTokenText: string,
    debugExcerptText: string,
    context: Context,
): FoundApiItemReference | FoundLocalSignatureReference | null {
    if (
        token.kind !== aeModel.ExcerptTokenKind.Reference ||
        !token.canonicalReference ||
        // Non-module reference.
        token.canonicalReference.toString().startsWith('!')
    ) {
        return null;
    }
    if (token.canonicalReference.toString().includes('!~')) {
        if (token.canonicalReference.toString().endsWith('!~value')) {
            // I don't know why this is a thing.
            return null;
        }
        // Local reference.
        return findLocalReferenceTokens(token.canonicalReference, context);
    }
    // Should be a exported reference now.
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
        // the imported package but under its own package. Therefore go
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
                .slice(containedPackage.canonicalReference.toString().length);
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
                debugExcerptText,
            )}`,
        );
    }

    if (result.resolvedApiItem) {
        return {
            type: FoundExcerptTokenReferenceResultType.Export,
            apiItem: result.resolvedApiItem,
        };
    }

    return null;
}

function writeApiItemExcerpt(
    container: output.Container,
    apiItem: aeModel.ApiItem,
    excerpt: aeModel.Excerpt,
    context: Context,
): void {
    if (!excerpt.text.trim()) {
        throw new Error(`Received excerpt with no declaration.`);
    }

    const codeBlock = new output.RichCodeBlock('ts');
    container.addChild(codeBlock);

    if (apiItem.kind === aeModel.ApiItemKind.Variable) {
        codeBlock.addChild(new output.PlainText('var '));
    }

    const spannedTokens = excerpt.spannedTokens.slice();
    let token: aeModel.ExcerptToken | undefined;
    while ((token = spannedTokens.shift())) {
        let tokenText = token.text;
        if (token === excerpt.spannedTokens[0]) {
            tokenText = tokenText.replace(/^export (declare )?/, '');
        }
        const result = getExcerptTokenReference(
            token,
            tokenText,
            excerpt.text,
            context,
        );
        if (result === null) {
            codeBlock.addChild(new output.PlainText(tokenText));
        } else if (
            result.type === FoundExcerptTokenReferenceResultType.Export
        ) {
            const destination = getLinkToApiItem(
                getApiItemName(apiItem),
                result.apiItem,
                context,
            );
            codeBlock.addChild(
                new output.LocalPageLink(destination).addChild(
                    new output.PlainText(tokenText),
                ),
            );
        } else {
            // Local signature reference.
            spannedTokens.unshift(...result.tokens);
        }
    }
}

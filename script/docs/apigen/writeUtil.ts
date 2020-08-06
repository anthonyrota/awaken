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
import * as tsdoc from '@microsoft/tsdoc';
import { DeclarationReference } from '@microsoft/tsdoc/lib/beta/DeclarationReference';
import * as aeModel from '@microsoft/api-extractor-model';
import * as output from './output';
import { getMainPathOfApiItemName } from './paths';
import { SourceExportMappings } from './sourceExportMappings';

export interface Context {
    sourceExportMappings: SourceExportMappings;
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

export function getApiItemName(
    apiItem: import('@microsoft/api-extractor-model').ApiItem,
): string {
    const match = /^(.+)_\d+$/.exec(apiItem.displayName);
    if (match) {
        return match[1];
    }
    return apiItem.displayName;
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

interface TSDocNodeWriteContext {
    context: Context;
    container: output.Container;
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
    writeNode(docNode, {
        context,
        container,
        nodeIter,
        htmlTagStack: [],
        apiItem,
    });
}

function writeNode(
    docNode: tsdoc.DocNode,
    context: TSDocNodeWriteContext,
): void {
    const { container } = context;

    switch (docNode.kind) {
        case tsdoc.DocNodeKind.PlainText: {
            const docPlainText = docNode as tsdoc.DocPlainText;
            container.addChild(new output.Text(docPlainText.text));
            break;
        }
        case tsdoc.DocNodeKind.HtmlStartTag: {
            const docStartTag = docNode as tsdoc.DocHtmlStartTag;
            const oldContainer = container;
            const htmlElement = new output.HtmlElement(docStartTag.name);
            oldContainer.addChild(htmlElement);
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
                new output.CodeSpan().addChild(
                    new output.Text(docCodeSpan.code),
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
                container.addChild(new output.Text(docLinkTag.linkText));
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
            oldContainer.addChild(paragraph);
            context.container = paragraph;
            for (const node of trimmedParagraph.nodes) {
                writeNode(node, context);
            }
            context.container = oldContainer;
            break;
        }
        case tsdoc.DocNodeKind.FencedCode: {
            const docFencedCode = docNode as tsdoc.DocFencedCode;
            container.addChild(
                new output.CodeBlock(
                    docFencedCode.language,
                    docFencedCode.code,
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
            const children = container.getChildren();
            const lastChild = children[children.length - 1];
            if (lastChild && lastChild instanceof output.Text) {
                if (
                    !/^\s?$/.test(
                        lastChild.text[lastChild.text.length - 1] || '',
                    )
                ) {
                    lastChild.append(' ');
                }
            } else {
                container.addChild(new output.Text(' '));
            }
            break;
        }
        case tsdoc.DocNodeKind.EscapedText: {
            const docEscapedText = docNode as tsdoc.DocEscapedText;
            container.addChild(new output.Text(docEscapedText.decodedText));
            break;
        }
        case tsdoc.DocNodeKind.ErrorText: {
            const docErrorText = docNode as tsdoc.DocErrorText;
            container.addChild(new output.Text(docErrorText.text));
            break;
        }
        case tsdoc.DocNodeKind.InlineTag: {
            break;
        }
        case tsdoc.DocNodeKind.BlockTag: {
            const tagNode = docNode as tsdoc.DocBlockTag;
            if (tagNode.tagName !== '@see' && tagNode.tagName !== '@example') {
                console.warn('Unsupported block tag: ' + tagNode.tagName);
            }
            break;
        }
        default:
            throw new Error('Unsupported DocNodeKind kind: ' + docNode.kind);
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
    context.container.addChild(codeSpan);
    writeLinkToApiItemName(
        codeSpan,
        getApiItemName(context.apiItem),
        identifier,
        docLinkTag.linkText,
    );
}

function writeLinkTagWithUrlDestination(
    docLinkTag: tsdoc.DocLinkTag,
    context: TSDocNodeWriteContext,
): void {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const urlDestination = docLinkTag.urlDestination!;
    const linkText: string =
        docLinkTag.linkText !== undefined
            ? docLinkTag.linkText
            : urlDestination;

    const encodedLinkText: string = escapeHtml(linkText.replace(/\s+/g, ' '));

    context.container.addChild(
        new output.Link(urlDestination, encodedLinkText),
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

    return relativePath ? `${relativePath}.md#${titleHash}` : `#${titleHash}`;
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

    return relativePath ? `${relativePath}.md#${titleHash}` : `#${titleHash}`;
}

function writeLinkToApiItemName(
    container: output.Container,
    currentApiItemName: string,
    apiItemName: string,
    linkText = apiItemName,
): void {
    const destination = getLinkToApiItemName(currentApiItemName, apiItemName);

    container.addChild(new output.Link(destination, linkText));
}

function writeLinkToApiItem(
    container: output.Container,
    currentApiItemName: string,
    apiItem: aeModel.ApiItem,
    context: Context,
    linkText = getApiItemName(apiItem),
) {
    const destination = getLinkToApiItem(currentApiItemName, apiItem, context);

    container.addChild(new output.Link(destination, linkText));
}

export function writeSummary(
    output: output.Container,
    apiItem: aeModel.ApiItem,
    context: Context,
): void {
    const summarySection = getDocComment(apiItem).summarySection;
    writeApiItemDocNode(output, apiItem, summarySection, context);
}

export function writeExamples(
    container: output.Container,
    apiItem: aeModel.ApiItem,
    context: Context,
): void {
    const customBlocks = extractCustomBlocks(apiItem);
    for (const exampleBlock of customBlocks.exampleBlocks) {
        container.addChild(
            new output.Title().addChild(new output.Text('Example')),
        );
        for (const block of exampleBlock.getChildNodes()) {
            writeApiItemDocNode(container, apiItem, block, context);
        }
    }
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
                    new output.Text(`${getApiItemName(apiItem)} - ${textKind}`),
                ),
            ),
        );
    }
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
        new output.Title().addChild(new output.Text('Signature')),
    );
    writeApiItemExcerpt(container, apiItem, apiItem.excerpt, context);
}

export function writeSeeBlocks(
    container: output.Container,
    apiItem: aeModel.ApiItem,
    context: Context,
): void {
    const customBlocks = extractCustomBlocks(apiItem);
    const list = new output.List();
    for (const seeBlock of customBlocks.seeBlocks) {
        const listItem = new output.Container();
        list.addChild(listItem);
        for (const block of seeBlock.getChildNodes()) {
            writeApiItemDocNode(listItem, apiItem, block, context);
        }
    }
    if (list.getChildCount() > 0) {
        container.addChild(
            new output.Title().addChild(new output.Text('See Also')),
        );
        container.addChild(list);
    }
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
            codeBlock.addChild(new output.Text(escapeHtml(tokenText)));
        } else if (
            result.type === FoundExcerptTokenReferenceResultType.Export
        ) {
            codeBlock.addChild(
                new output.Link(
                    getLinkToApiItem(
                        getApiItemName(apiItem),
                        result.apiItem,
                        context,
                    ),
                    escapeHtml(tokenText),
                ),
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
): output.Serializable {
    if (!excerpt.text.trim()) {
        return new output.Text('(not declared)');
    }

    const container = new output.Container();

    appendExcerptWithHyperlinks(container, excerpt, apiItem, context);

    return container;
}

export function writeParameters(
    container: output.Container,
    apiItem: aeModel.ApiFunction,
    context: Context,
): void {
    const parametersTable = new output.Table(
        new output.TableRow()
            .addChild(new output.Text('Parameter'))
            .addChild(new output.Text('Type'))
            .addChild(new output.Text('Description')),
    );

    if (apiItem.parameters.some((param) => param.tsdocParamBlock)) {
        for (const apiParameter of apiItem.parameters) {
            const parameterRow = new output.TableRow()
                .addChild(new output.Text(apiParameter.name))
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
            new output.Title().addChild(new output.Text('Parameters')),
        );
        container.addChild(parametersTable);
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
            new output.Title().addChild(new output.Text('Returns')),
        );
        container.addChild(
            new output.Table(
                new output.TableRow()
                    .addChild(new output.Text('Type'))
                    .addChild(new output.Text('Description')),
            ).addChild(returnsRow),
        );
    }
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
        codeBlock.addChild(new output.Text('var '));
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
            codeBlock.addChild(new output.Text(escapeHtml(tokenText)));
        } else if (
            result.type === FoundExcerptTokenReferenceResultType.Export
        ) {
            writeLinkToApiItem(
                codeBlock,
                getApiItemName(apiItem),
                result.apiItem,
                context,
            );
        } else {
            // Local signature reference.
            spannedTokens.unshift(...result.tokens);
        }
    }
}

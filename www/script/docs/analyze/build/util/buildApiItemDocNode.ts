/* eslint-disable max-len */
/**
 * Thanks to the api-documenter team for some ideas used in this script:
 *
 * https://github.com/microsoft/rushstack/blob/8b2edd9/apps/api-documenter/src/markdown/MarkdownEmitter.ts
 *
 * The api-documenter project is licensed under MIT, and its license can be found at <rootDir>/vendor/licenses/@microsoft/api-documenter/LICENSE
 */
/* eslint-enable max-len */

import { ApiItem } from '@microsoft/api-extractor-model';
import * as tsdoc from '@microsoft/tsdoc';
import * as uuid from 'uuid';
import { Node, CoreNode, DeepCoreNode } from '../../../core/nodes';
import { CodeBlockNode } from '../../../core/nodes/CodeBlock';
import { CodeSpanNode } from '../../../core/nodes/CodeSpan';
import { ContainerBase, ContainerNode } from '../../../core/nodes/Container';
import { HtmlElementNode } from '../../../core/nodes/HtmlElement';
import { LinkNode } from '../../../core/nodes/Link';
import { LocalPageLinkNode } from '../../../core/nodes/LocalPageLink';
import { ParagraphNode } from '../../../core/nodes/Paragraph';
import { PlainTextNode } from '../../../core/nodes/PlainText';
import { simplifyDeepCoreNode } from '../../../core/nodes/util/simplify';
import { substituteDynamicTextValues } from '../../../core/nodes/util/substituteDynamicTextValues';
import { RenderMarkdownNodeType } from '../../../core/render/markdown/nodes';
import { HtmlCommentNode } from '../../../core/render/markdown/nodes/HtmlComment';
import { Iter } from '../../../util/Iter';
import { StringBuilder } from '../../../util/StringBuilder';
import { AnalyzeContext } from '../../Context';
import { parseMarkdown } from '../../util/parseMarkdown';

interface TSDocNodeWriteContext {
    context: AnalyzeContext;
    container: ContainerBase<MarkdownParsingNode>;
    embeddedNodeContext: EmbeddedNodeContext;
    nodeIter: Iter<tsdoc.DocNode>;
    htmlTagStack: HtmlElementNode<MarkdownParsingNode>[];
    apiItem: ApiItem;
}

export interface BuildApiItemDocNodeParameters {
    apiItem: ApiItem;
    docNode: tsdoc.DocNode;
    context: AnalyzeContext;
}

export function buildApiItemDocNode(
    parameters: BuildApiItemDocNodeParameters,
): DeepCoreNode | undefined {
    const { apiItem, docNode, context } = parameters;
    const nodeIter = Iter([docNode]);
    nodeIter.next();
    const container_ = ContainerNode<MarkdownParsingNode>({});
    const embeddedNodeContext = new EmbeddedNodeContext();
    const context_ = {
        context,
        container: container_,
        nodeIter,
        htmlTagStack: [],
        embeddedNodeContext,
        apiItem,
    };
    addNode(docNode, context_);
    if (container_.children.length > 0) {
        const embeddedNode = EmbeddedNode({
            originalNode: container_,
            context: embeddedNodeContext,
        });
        substituteEmbeddedNodes(embeddedNode, embeddedNodeContext);
        // All of the embedded nodes have been substituted.
        const container = (container_ as unknown) as ContainerNode<
            DeepCoreNode
        >;
        simplifyDeepCoreNode(container);
        substituteDynamicTextValues(
            container,
            context.getDynamicTextVariableReplacement,
        );
        return (container_ as unknown) as ContainerNode<DeepCoreNode>;
    }
    return;
}

class EmbeddedNodeContext {
    private _n = 0;
    private _idMap = new Map<number, () => EmbeddedNode>();
    private _baseId = uuid.v4();
    private _embeddedNodeRegexp = RegExp(
        `^__EmbeddedNode-${this._baseId}__:(\\d+)$`,
    );

    public generateMarker(getNode: () => EmbeddedNode): string {
        const id = this._n++;
        this._idMap.set(id, getNode);
        return `<!--__EmbeddedNode-${this._baseId}__:${id}-->`;
    }

    public extractNodeFromComment(comment: string): EmbeddedNode | undefined {
        const match = this._embeddedNodeRegexp.exec(comment);
        if (match) {
            const id = Number.parseInt(match[1]);
            return this._getNodeForId(id);
        }
        return;
    }

    private _getNodeForId(id: number): EmbeddedNode {
        const getNode = this._idMap.get(id);
        if (!getNode) {
            throw new Error('No node defined for given id.');
        }
        return getNode();
    }
}

enum MarkdownParsingNodeType {
    EmbeddedNode = 'EmbeddedNode',
    RawText = 'RawText',
}

interface EmbeddedNode extends Node {
    type: MarkdownParsingNodeType.EmbeddedNode;
    originalNode: CoreNode<MarkdownParsingNode>;
    marker: string;
}

interface EmbeddedNodeParameters {
    originalNode: CoreNode<MarkdownParsingNode>;
    context: EmbeddedNodeContext;
}

function EmbeddedNode(parameters: EmbeddedNodeParameters): EmbeddedNode {
    if (parameters.originalNode instanceof EmbeddedNode) {
        throw new Error(
            'EmbeddedNode node argument cannot be an EmbeddedNode.',
        );
    }
    const embeddedNode: EmbeddedNode = {
        type: MarkdownParsingNodeType.EmbeddedNode,
        originalNode: parameters.originalNode,
        marker: parameters.context.generateMarker(() => embeddedNode),
    };
    return embeddedNode;
}

interface RawTextNode extends Node {
    type: MarkdownParsingNodeType.RawText;
    text: string;
}

interface RawTextParameters {
    text: string;
}

function RawTextNode(parameters: RawTextParameters): RawTextNode {
    return {
        type: MarkdownParsingNodeType.RawText,
        text: parameters.text,
    };
}

type MarkdownParsingNode = EmbeddedNode | RawTextNode;

function writeMarkdownParsingNode(
    node: EmbeddedNode | RawTextNode,
    output: StringBuilder,
): void {
    if (node.type === MarkdownParsingNodeType.EmbeddedNode) {
        output.write(node.marker);
    } else {
        output.write(node.text);
    }
}

function substituteEmbeddedNodes(
    embeddedNode: EmbeddedNode,
    context: EmbeddedNodeContext,
): void {
    if (!('children' in embeddedNode.originalNode)) {
        return;
    }

    const output = new StringBuilder();
    for (const node of embeddedNode.originalNode.children) {
        writeMarkdownParsingNode(node, output);
    }
    const markdown = output.toString();

    const markdownContainer = parseMarkdown(markdown, {
        unwrapFirstLineParagraph: true,
        handleHtmlComment(context, comment): void {
            context.container.children.push(
                (HtmlCommentNode({ comment }) as unknown) as DeepCoreNode,
            );
        },
    });

    _substituteEmbeddedNodes(embeddedNode, context, markdownContainer);
    // TODO: fix.
    ((embeddedNode.originalNode as unknown) as ContainerBase<
        DeepCoreNode
    >).children = markdownContainer.children;
}

function _substituteEmbeddedNodes(
    embeddedNode: EmbeddedNode,
    context: EmbeddedNodeContext,
    node: ContainerBase<DeepCoreNode>,
): void {
    for (const [i, child] of node.children.entries()) {
        if ('children' in child) {
            _substituteEmbeddedNodes(embeddedNode, context, child);
        } else if (
            ((child.type as unknown) as RenderMarkdownNodeType) ===
            RenderMarkdownNodeType.HtmlComment
        ) {
            const embeddedNode = context.extractNodeFromComment(
                ((child as unknown) as HtmlCommentNode).comment,
            );
            if (embeddedNode) {
                substituteEmbeddedNodes(embeddedNode, context);
                node.children[
                    i
                ] = (embeddedNode.originalNode as unknown) as DeepCoreNode;
            }
        }
    }
}

function addNode(docNode: tsdoc.DocNode, context: TSDocNodeWriteContext): void {
    const { container } = context;

    switch (docNode.kind) {
        case tsdoc.DocNodeKind.PlainText: {
            const docPlainText = docNode as tsdoc.DocPlainText;
            const textNode = RawTextNode({ text: docPlainText.text });
            container.children.push(textNode);
            let node: tsdoc.DocNode | undefined;
            let foundSoftBreak = false;
            while ((node = context.nodeIter.peekNext())) {
                if (node.kind === tsdoc.DocNodeKind.SoftBreak) {
                    foundSoftBreak = true;
                    context.nodeIter.next();
                } else {
                    break;
                }
            }
            if (foundSoftBreak) {
                textNode.text += ' ';
            }
            break;
        }
        case tsdoc.DocNodeKind.HtmlStartTag: {
            const docStartTag = docNode as tsdoc.DocHtmlStartTag;
            const attributes: Record<string, string> = {};
            for (const attribute of docStartTag.htmlAttributes) {
                attributes[attribute.name] = attribute.value;
            }
            if (docStartTag.selfClosingTag) {
                container.children.push(
                    EmbeddedNode({
                        originalNode: HtmlElementNode({
                            tagName: docStartTag.name,
                            attributes,
                        }),
                        context: context.embeddedNodeContext,
                    }),
                );
                return;
            }
            const htmlElement = HtmlElementNode<MarkdownParsingNode>({
                tagName: docStartTag.name,
                attributes,
            });
            const oldContainer = container;
            oldContainer.children.push(
                EmbeddedNode({
                    originalNode: htmlElement,
                    context: context.embeddedNodeContext,
                }),
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
                    context.htmlTagStack.pop();
                    didFindEndTag = true;
                    break;
                }
                addNode(docNode, context);
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
            container.children.push(
                EmbeddedNode({
                    originalNode: CodeSpanNode<MarkdownParsingNode>({
                        children: [
                            EmbeddedNode({
                                originalNode: PlainTextNode({
                                    text: docCodeSpan.code,
                                }),
                                context: context.embeddedNodeContext,
                            }),
                        ],
                    }),
                    context: context.embeddedNodeContext,
                }),
            );
            break;
        }
        case tsdoc.DocNodeKind.LinkTag: {
            const docLinkTag = docNode as tsdoc.DocLinkTag;
            if (docLinkTag.codeDestination) {
                addLinkTagWithCodeDestination(docLinkTag, context);
            } else if (docLinkTag.urlDestination) {
                addLinkTagWithUrlDestination(docLinkTag, context);
            } else if (docLinkTag.linkText) {
                container.children.push(
                    EmbeddedNode({
                        originalNode: PlainTextNode({
                            text: docLinkTag.linkText,
                        }),
                        context: context.embeddedNodeContext,
                    }),
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
            const oldNodeIter = context.nodeIter;
            const paragraph = ParagraphNode<MarkdownParsingNode>({});
            context.container = paragraph;
            context.nodeIter = Iter(trimmedParagraph.nodes);
            let node: tsdoc.DocNode | undefined;
            while ((node = context.nodeIter.next())) {
                addNode(node, context);
            }
            if (paragraph.children.length > 0) {
                oldContainer.children.push(
                    EmbeddedNode({
                        originalNode: paragraph,
                        context: context.embeddedNodeContext,
                    }),
                );
            }
            context.container = oldContainer;
            context.nodeIter = oldNodeIter;
            break;
        }
        case tsdoc.DocNodeKind.FencedCode: {
            const docFencedCode = docNode as tsdoc.DocFencedCode;
            container.children.push(
                EmbeddedNode({
                    originalNode: CodeBlockNode({
                        language: docFencedCode.language,
                        code: docFencedCode.code,
                    }),
                    context: context.embeddedNodeContext,
                }),
            );
            break;
        }
        case tsdoc.DocNodeKind.Section: {
            const docSection = docNode as tsdoc.DocSection;
            const oldContainer = context.container;
            const container = ContainerNode<MarkdownParsingNode>({});
            const oldNodeIter = context.nodeIter;
            context.container = container;
            context.nodeIter = Iter(docSection.nodes);
            let node: tsdoc.DocNode | undefined;
            while ((node = context.nodeIter.next())) {
                addNode(node, context);
            }
            oldContainer.children.push(...container.children);
            context.container = oldContainer;
            context.nodeIter = oldNodeIter;
            break;
        }
        case tsdoc.DocNodeKind.SoftBreak: {
            container.children.push(RawTextNode({ text: ' ' }));
            break;
        }
        case tsdoc.DocNodeKind.EscapedText: {
            const docEscapedText = docNode as tsdoc.DocEscapedText;
            container.children.push(
                EmbeddedNode({
                    originalNode: PlainTextNode({
                        text: docEscapedText.decodedText,
                    }),
                    context: context.embeddedNodeContext,
                }),
            );
            break;
        }
        case tsdoc.DocNodeKind.ErrorText: {
            const docErrorText = docNode as tsdoc.DocErrorText;
            container.children.push(
                EmbeddedNode({
                    originalNode: PlainTextNode({ text: docErrorText.text }),
                    context: context.embeddedNodeContext,
                }),
            );
            break;
        }
        case tsdoc.DocNodeKind.InlineTag: {
            break;
        }
        case tsdoc.DocNodeKind.BlockTag: {
            const docBlockTag = docNode as tsdoc.DocBlockTag;
            if (
                docBlockTag.tagName !== '@see' &&
                docBlockTag.tagName !== '@example'
            ) {
                console.warn(`Unsupported block tag: ${docBlockTag.tagName}`);
            }
            break;
        }
        default:
            throw new Error(`Unsupported DocNodeKind kind: ${docNode.kind}`);
    }
}

function addLinkTagWithCodeDestination(
    docLinkTag: tsdoc.DocLinkTag,
    context: TSDocNodeWriteContext,
): void {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const codeDestination = docLinkTag.codeDestination!;
    if (!codeDestination.packageName) {
        throw new Error('No package name specified for code destination.');
    }
    if (!codeDestination.importPath) {
        throw new Error(`No import path specified for code destination.`);
    }
    if (!codeDestination.importPath.startsWith('/')) {
        throw new Error('No.');
    }
    const codeSpan = CodeSpanNode<MarkdownParsingNode>({});
    context.container.children.push(
        EmbeddedNode({
            originalNode: codeSpan,
            context: context.embeddedNodeContext,
        }),
    );
    const memberIdentifier =
        codeDestination.packageName + codeDestination.importPath;
    const packageParts = [
        // TODO: fix this.
        '@awaken',
        ...memberIdentifier.split('/'),
    ];
    if (packageParts.length !== 3) {
        throw new Error(`Invalid code destination ${memberIdentifier}`);
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const exportName = packageParts.pop()!;
    const packageName = packageParts.join('/');
    const identifier = { packageName, exportName };
    const pageId = context.context.getPageIdFromExportIdentifier(identifier);
    codeSpan.children.push(
        EmbeddedNode({
            originalNode: LocalPageLinkNode({
                pageId,
                hash: exportName,
                children: [
                    EmbeddedNode({
                        originalNode: PlainTextNode({
                            text:
                                docLinkTag.linkText !== undefined
                                    ? docLinkTag.linkText
                                    : codeDestination.importPath.slice(1),
                        }),
                        context: context.embeddedNodeContext,
                    }),
                ],
            }),
            context: context.embeddedNodeContext,
        }),
    );
}

function addLinkTagWithUrlDestination(
    docLinkTag: tsdoc.DocLinkTag,
    context: TSDocNodeWriteContext,
): void {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const urlDestination = docLinkTag.urlDestination!;
    const linkText =
        docLinkTag.linkText !== undefined
            ? docLinkTag.linkText
            : urlDestination;

    context.container.children.push(
        EmbeddedNode({
            originalNode: LinkNode({
                destination: urlDestination,
                children: [
                    EmbeddedNode({
                        originalNode: PlainTextNode({
                            text: linkText.replace(/\s+/g, ' '),
                        }),
                        context: context.embeddedNodeContext,
                    }),
                ],
            }),
            context: context.embeddedNodeContext,
        }),
    );
}

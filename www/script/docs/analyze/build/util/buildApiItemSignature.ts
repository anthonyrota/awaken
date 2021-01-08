import * as path from 'path';
import {
    ApiCallSignature,
    ApiConstructSignature,
    ApiFunction,
    ApiInterface,
    ApiItem,
    ApiItemKind,
    ApiMethodSignature,
    ApiPropertySignature,
    ApiTypeAlias,
    ApiVariable,
    Excerpt,
} from '@microsoft/api-extractor-model';
import * as ts from 'typescript';
import { DeepCoreNode } from '../../../core/nodes';
import {
    CodeBlockNode,
    CodeLink,
    CodeLinkType,
} from '../../../core/nodes/CodeBlock';
import { ContainerNode } from '../../../core/nodes/Container';
import { GithubSourceLinkNode } from '../../../core/nodes/GithubSourceLink';
import { PlainTextNode } from '../../../core/nodes/PlainText';
import { TitleNode } from '../../../core/nodes/Title';
import { format, formatWithCursor, Language } from '../../../util/prettier';
import { AnalyzeContext } from '../../Context';
import { getApiItemIdentifier } from '../../util/getApiItemIdentifier';
import { getApiItemSourceGithubPathFromRoot } from '../../util/getApiItemSourceLocation';
import { getExcerptTokenReference } from '../../util/getExcerptTokenReference';
import { hideDocTag } from '../../util/tsdocUtil';
import { UnsupportedApiItemError } from '../../util/UnsupportedApiItemError';
import { getApiItemAnchorName } from './buildApiItemAnchor';

export interface BuildApiItemSignatureParameters {
    apiItem: ApiFunction | ApiInterface | ApiVariable | ApiTypeAlias;
    context: AnalyzeContext;
    syntaxKind: ts.SyntaxKind;
}

export function buildApiItemSignature(
    parameters: BuildApiItemSignatureParameters,
): DeepCoreNode {
    const { apiItem, context, syntaxKind } = parameters;
    return ContainerNode<DeepCoreNode>({
        children: [
            buildApiItemSignatureTitle({
                apiItem,
                context,
                syntaxKind,
            }),
            buildApiItemSignatureExcerpt({
                apiItem,
                context,
            }),
        ],
    });
}

export interface BuildApiItemSignatureTitleParameters {
    apiItem: ApiFunction | ApiInterface | ApiVariable | ApiTypeAlias;
    context: AnalyzeContext;
    syntaxKind: ts.SyntaxKind;
}

export function buildApiItemSignatureTitle(
    parameters: BuildApiItemSignatureTitleParameters,
): DeepCoreNode {
    const { apiItem, context, syntaxKind } = parameters;
    const pathFromRoot = getApiItemSourceGithubPathFromRoot({
        apiItem,
        context,
        syntaxKind,
    });
    return TitleNode({
        children: [
            PlainTextNode({ text: 'Signature - ' }),
            GithubSourceLinkNode({
                pathFromRoot,
                children: [
                    PlainTextNode({
                        text: path.basename(pathFromRoot),
                    }),
                ],
            }),
        ],
    });
}

export interface BuildApiItemSignatureExcerptParameters {
    apiItem: ApiFunction | ApiInterface | ApiVariable | ApiTypeAlias;
    context: AnalyzeContext;
}

export function buildApiItemSignatureExcerpt(
    parameters: BuildApiItemSignatureExcerptParameters,
): DeepCoreNode {
    const { apiItem, context } = parameters;
    return buildApiItemExcerpt({
        apiItem,
        excerpt: apiItem.excerpt,
        context,
    });
}

function buildExcerpt(
    excerpt: Excerpt,
    context: AnalyzeContext,
    codeLinks: CodeLink[],
    startIndex: number,
): string {
    let text = '';

    for (const token of excerpt.spannedTokens) {
        let tokenText = token.text;
        if (token === excerpt.spannedTokens[0]) {
            tokenText = removeExportDeclare(tokenText);
        }
        const result = getExcerptTokenReference(
            token,
            tokenText,
            excerpt.text,
            context,
        );

        if (result !== null) {
            const { apiItem } = result;
            const identifier = getApiItemIdentifier(apiItem);
            const pageId = context.getPageIdFromExportIdentifier(identifier);
            codeLinks.push({
                type: CodeLinkType.DocPage,
                pageId,
                hash: getApiItemAnchorName({ apiItem, context }),
                startIndex: startIndex + text.length,
                endIndex: startIndex + text.length + tokenText.length,
            });
        }

        text += tokenText;
    }

    return text;
}

export interface BuildApiItemExcerptParameters {
    apiItem: ApiItem;
    excerpt: Excerpt;
    context: AnalyzeContext;
}

function buildApiItemExcerpt(
    parameters: BuildApiItemExcerptParameters,
): DeepCoreNode {
    const { apiItem, excerpt, context } = parameters;
    if (!excerpt.text.trim()) {
        throw new Error(`Received excerpt with no declaration.`);
    }

    let text = '';
    const codeLinks: CodeLink[] = [];

    if (apiItem.kind === ApiItemKind.Variable) {
        text += 'var ';
    }

    text += buildExcerpt(excerpt, context, codeLinks, text.length);

    if (apiItem.kind === ApiItemKind.Interface) {
        const interface_ = apiItem as ApiInterface;
        // const memberSignatures: DeepCoreNode[][] = [];
        text += '{';
        for (const member of interface_.members) {
            switch (member.kind) {
                case ApiItemKind.PropertySignature:
                case ApiItemKind.MethodSignature:
                case ApiItemKind.ConstructSignature:
                case ApiItemKind.CallSignature: {
                    if (
                        (member as
                            | ApiPropertySignature
                            | ApiMethodSignature
                            | ApiConstructSignature
                            // eslint-disable-next-line max-len
                            | ApiCallSignature).tsdocComment?.modifierTagSet.hasTag(
                            hideDocTag,
                        )
                    ) {
                        continue;
                    }
                    text += buildExcerpt(
                        (member as
                            | ApiPropertySignature
                            | ApiMethodSignature
                            | ApiConstructSignature
                            | ApiCallSignature).excerpt,
                        context,
                        codeLinks,
                        text.length,
                    );
                    break;
                }
                default: {
                    throw new UnsupportedApiItemError(
                        member,
                        'Unknown member kind.',
                    );
                }
            }
            if (!text.trimEnd().endsWith(';')) {
                text += ';';
            }
        }
        text += '}';
    }

    for (const codeLink of codeLinks) {
        codeLink.startIndex = formatWithCursor(
            text,
            codeLink.startIndex,
            Language.TypeScript,
            {
                semi: false,
            },
        ).cursorOffset;
        codeLink.endIndex = formatWithCursor(
            text,
            codeLink.endIndex,
            Language.TypeScript,
            {
                semi: false,
            },
        ).cursorOffset;
    }

    return CodeBlockNode({
        language: 'ts',
        code: format(text, Language.TypeScript, {
            semi: false,
        }).trimEnd(),
        codeLinks,
    });
}

function removeExportDeclare(tokenText: string): string {
    return tokenText.replace(/^export (declare )?/, '');
}

import {
    ApiFunction,
    ApiInterface,
    ApiItem,
    ApiItemKind,
    ApiTypeAlias,
    ApiVariable,
    Excerpt,
    ExcerptToken,
} from '@microsoft/api-extractor-model';
import { simplifyDeepCoreNode } from '../../..//core/simplify';
import { CoreNodeType, DeepCoreNode } from '../../../core/nodes';
import { CodeBlockNode } from '../../../core/nodes/CodeBlock';
import { ContainerNode } from '../../../core/nodes/Container';
import { LocalPageLinkNode } from '../../../core/nodes/LocalPageLink';
import { PlainTextNode } from '../../../core/nodes/PlainText';
import { RichCodeBlockNode } from '../../../core/nodes/RichCodeBlock';
import { TitleNode } from '../../../core/nodes/Title';
import { formatCodeContainer } from '../../../core/nodes/util/formatCodeContainer';
import { AnalyzeContext } from '../../Context';
import { getApiItemIdentifier } from '../../util/getApiItemIdentifier';
import {
    FoundExcerptTokenReferenceResultType,
    getExcerptTokenReference,
} from '../../util/getExcerptTokenReference';
import { getLinkToApiItem } from '../../util/getExportLinks';

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

export interface BuildApiItemSignatureParameters
    extends BuildApiItemSignatureExcerptParameters {}

export function buildApiItemSignature(
    parameters: BuildApiItemSignatureParameters,
): DeepCoreNode {
    const { apiItem, context } = parameters;
    return ContainerNode<DeepCoreNode>({
        children: [
            TitleNode({
                children: [PlainTextNode({ text: 'Signature' })],
            }),
            buildApiItemSignatureExcerpt({
                apiItem,
                context,
            }),
        ],
    });
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

    const richCodeBlock = RichCodeBlockNode<DeepCoreNode>({ language: 'ts' });

    if (apiItem.kind === ApiItemKind.Variable) {
        richCodeBlock.children.push(PlainTextNode({ text: 'var ' }));
    }

    const spannedTokens = excerpt.spannedTokens.slice();
    let token: ExcerptToken | undefined;

    while ((token = spannedTokens.shift())) {
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
        if (result === null) {
            richCodeBlock.children.push(PlainTextNode({ text: tokenText }));
        } else if (
            result.type === FoundExcerptTokenReferenceResultType.Export
        ) {
            const destination = getLinkToApiItem(
                getApiItemIdentifier(apiItem),
                result.apiItem,
                context,
            );
            richCodeBlock.children.push(
                LocalPageLinkNode({
                    destination,
                    children: [PlainTextNode({ text: tokenText })],
                }),
            );
        } else {
            // Local signature reference.
            spannedTokens.unshift(...result.tokens);
        }
    }

    if (apiItem.kind !== ApiItemKind.Interface) {
        formatCodeContainer(richCodeBlock);
    }

    simplifyDeepCoreNode(richCodeBlock);
    if (richCodeBlock.children.length === 1) {
        const onlyChild = richCodeBlock.children[0];
        if (onlyChild.type === CoreNodeType.PlainText) {
            return CodeBlockNode({
                language: 'ts',
                code: onlyChild.text,
            });
        }
    }

    return richCodeBlock;
}

function removeExportDeclare(tokenText: string): string {
    return tokenText.replace(/^export (declare )?/, '');
}

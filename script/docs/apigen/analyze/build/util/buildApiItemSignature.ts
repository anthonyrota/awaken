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
import { CodeBlockNode } from '../../../core/nodes/CodeBlock';
import { ContainerNode } from '../../../core/nodes/Container';
import { DeepCoreNode } from '../../../core/nodes/index';
import { LocalPageLinkNode } from '../../../core/nodes/LocalPageLink';
import { PlainTextNode } from '../../../core/nodes/PlainText';
import { RichCodeBlockNode } from '../../../core/nodes/RichCodeBlock';
import { TitleNode } from '../../../core/nodes/Title';
import { format, Language } from '../../../util/prettier';
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
    let isOnlyText = true;

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
            isOnlyText = false;
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

    if (isOnlyText) {
        let formattedText = removeExportDeclare(excerpt.text);
        if (apiItem.kind !== ApiItemKind.Interface) {
            try {
                formattedText = format(
                    removeExportDeclare(excerpt.text),
                    Language.TypeScript,
                ).trim();
            } catch (error) {
                console.error(error);
                formattedText = excerpt.text;
            }
        }
        return CodeBlockNode({
            language: 'ts',
            code: formattedText,
        });
    }

    return richCodeBlock;
}

function removeExportDeclare(tokenText: string): string {
    return tokenText.replace(/^export (declare )?/, '');
}

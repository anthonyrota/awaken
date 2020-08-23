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
import { CodeBlockNode } from '../../nodes/CodeBlock';
import { LocalPageLinkNode } from '../../nodes/LocalPageLink';
import { PlainTextNode } from '../../nodes/PlainText';
import { RichCodeBlockNode } from '../../nodes/RichCodeBlock';
import { TitleNode } from '../../nodes/Title';
import { format, Language } from '../../util/prettier';
import { getApiItemIdentifier } from '../util/getApiItemIdentifier';
import {
    FoundExcerptTokenReferenceResultType,
    getExcerptTokenReference,
} from '../util/getExcerptTokenReference';
import { getLinkToApiItem } from '../util/getExportLinks';
import { ContainerNode } from './../../nodes/Container';
import { DeepCoreNode } from './../../nodes/index';
import { AnalyzeContext } from './../Context';

export function buildApiItemSignatureExcerpt(
    apiItem: ApiFunction | ApiInterface | ApiVariable | ApiTypeAlias,
    context: AnalyzeContext,
): DeepCoreNode {
    return buildApiItemExcerpt(apiItem, apiItem.excerpt, context);
}

export function buildApiItemSignature(
    apiItem: ApiFunction | ApiInterface | ApiVariable | ApiTypeAlias,
    context: AnalyzeContext,
): DeepCoreNode {
    return ContainerNode<DeepCoreNode>({
        children: [
            TitleNode({
                children: [PlainTextNode({ text: 'Signature' })],
            }),
            buildApiItemSignatureExcerpt(apiItem, context),
        ],
    });
}

function buildApiItemExcerpt(
    apiItem: ApiItem,
    excerpt: Excerpt,
    context: AnalyzeContext,
): DeepCoreNode {
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

import {
    ApiFunction,
    ApiItem,
    ApiReturnTypeMixin,
    Excerpt,
    ExcerptToken,
} from '@microsoft/api-extractor-model';
import { CodeBlockNode } from '../../nodes/CodeBlock';
import { ContainerNode } from '../../nodes/Container';
import { LocalPageLinkNode } from '../../nodes/LocalPageLink';
import { PlainTextNode } from '../../nodes/PlainText';
import { RichCodeBlockNode } from '../../nodes/RichCodeBlock';
import { TableNode, TableRow } from '../../nodes/Table';
import { TitleNode } from '../../nodes/Title';
import { format, Language } from '../../util/prettier';
import { getApiItemIdentifier } from '../util/getApiItemIdentifier';
import {
    FoundExcerptTokenReferenceResultType,
    getExcerptTokenReference,
} from '../util/getExcerptTokenReference';
import { getLinkToApiItem } from '../util/getExportLinks';
import { getDocComment } from '../util/tsdocConfiguration';
import { DeepCoreNode } from './../../nodes/index';
import { AnalyzeContext } from './../Context';
import { buildApiItemDocNode } from './buildApiItemDocNode';

export function buildApiItemParameters(
    apiItem: ApiFunction,
    context: AnalyzeContext,
): DeepCoreNode | undefined {
    const parametersTable = TableNode<DeepCoreNode, DeepCoreNode>({
        header: TableRow({
            children: [
                PlainTextNode({ text: 'Parameter' }),
                PlainTextNode({ text: 'Type' }),
                PlainTextNode({ text: 'Description' }),
            ],
        }),
    });

    if (apiItem.parameters.some((param) => param.tsdocParamBlock)) {
        for (const apiParameter of apiItem.parameters) {
            const parameterRow = TableRow<DeepCoreNode>({
                children: [
                    PlainTextNode({ text: apiParameter.name }),
                    createNodeForTypeExcerpt(
                        apiParameter.parameterTypeExcerpt,
                        apiItem,
                        context,
                    ),
                ],
            });

            const cell = ContainerNode<DeepCoreNode>({});
            parameterRow.children.push(cell);
            if (apiParameter.tsdocParamBlock) {
                for (const node of apiParameter.tsdocParamBlock.content.nodes) {
                    const built = buildApiItemDocNode(apiItem, node, context);
                    if (built) {
                        cell.children.push(built);
                    }
                }
            }

            parametersTable.rows.push(parameterRow);
        }
    }

    const container = ContainerNode<DeepCoreNode>({});

    if (parametersTable.rows.length > 0) {
        container.children.push(
            TitleNode({
                children: [PlainTextNode({ text: 'Parameters' })],
            }),
        );
        container.children.push(parametersTable);
    }

    const docComment = getDocComment(apiItem);
    if (ApiReturnTypeMixin.isBaseClassOf(apiItem) && docComment.returnsBlock) {
        const returnsRow = TableRow<DeepCoreNode>({
            children: [
                createNodeForTypeExcerpt(
                    apiItem.returnTypeExcerpt,
                    apiItem,
                    context,
                ),
            ],
        });

        const cell = ContainerNode<DeepCoreNode>({});
        returnsRow.children.push(cell);
        for (const node of docComment.returnsBlock.content.nodes) {
            const built = buildApiItemDocNode(apiItem, node, context);
            if (built) {
                cell.children.push(built);
            }
        }

        container.children.push(
            TitleNode({
                children: [PlainTextNode({ text: 'Returns' })],
            }),
            TableNode<DeepCoreNode, DeepCoreNode>({
                header: TableRow({
                    children: [
                        PlainTextNode({ text: 'Type' }),
                        PlainTextNode({ text: 'Description' }),
                    ],
                }),
                rows: [returnsRow],
            }),
        );
    }

    if (container.children.length > 0) {
        return container;
    }

    return;
}

function createNodeForTypeExcerpt(
    excerpt: Excerpt,
    apiItem: ApiItem,
    context: AnalyzeContext,
): DeepCoreNode {
    if (!excerpt.text.trim()) {
        return PlainTextNode({ text: '(not declared)' });
    }

    const richCodeBlock = RichCodeBlockNode<DeepCoreNode>({
        language: 'ts',
    });

    const spannedTokens = excerpt.spannedTokens.slice();
    let token: ExcerptToken | undefined;
    let isOnlyText = true;

    while ((token = spannedTokens.shift())) {
        const tokenText = token.text;
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
            isOnlyText = false;
            richCodeBlock.children.push(
                LocalPageLinkNode({
                    destination: getLinkToApiItem(
                        getApiItemIdentifier(apiItem),
                        result.apiItem,
                        context,
                    ),
                    children: [PlainTextNode({ text: tokenText })],
                }),
            );
        } else {
            // Local signature reference.
            spannedTokens.unshift(...result.tokens);
        }
    }

    if (isOnlyText) {
        let formattedText: string;
        try {
            formattedText = format(
                `type X = ${excerpt.text}`,
                Language.TypeScript,
            )
                .replace(/^type X =/, '')
                .trim();
        } catch (error) {
            console.error(error);
            formattedText = excerpt.text;
        }
        return CodeBlockNode({
            language: 'ts',
            code: formattedText,
        });
    }

    return richCodeBlock;
}

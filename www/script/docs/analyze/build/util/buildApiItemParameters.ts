import {
    ApiFunction,
    ApiReturnTypeMixin,
    Excerpt,
    ExcerptToken,
} from '@microsoft/api-extractor-model';
import { CoreNodeType, DeepCoreNode } from '../../../core/nodes';
import { CodeBlockNode } from '../../../core/nodes/CodeBlock';
import { ContainerNode } from '../../../core/nodes/Container';
import { LocalPageLinkNode } from '../../../core/nodes/LocalPageLink';
import { PlainTextNode } from '../../../core/nodes/PlainText';
import { RichCodeBlockNode } from '../../../core/nodes/RichCodeBlock';
import { TableNode, TableRow } from '../../../core/nodes/Table';
import { TitleNode } from '../../../core/nodes/Title';
import { formatCodeContainer } from '../../../core/nodes/util/formatCodeContainer';
import { simplifyDeepCoreNode } from '../../../core/nodes/util/simplify';
import { AnalyzeContext } from '../../Context';
import { getApiItemIdentifier } from '../../util/getApiItemIdentifier';
import {
    FoundExcerptTokenReferenceResultType,
    getExcerptTokenReference,
} from '../../util/getExcerptTokenReference';
import { getDocComment } from '../../util/tsdocUtil';
import { getApiItemAnchorName } from './buildApiItemAnchor';
import { buildApiItemDocNode } from './buildApiItemDocNode';

export interface BuildApiItemParametersParameters {
    apiItem: ApiFunction;
    context: AnalyzeContext;
}

export function buildApiItemParameters(
    parameters: BuildApiItemParametersParameters,
): DeepCoreNode | undefined {
    const { apiItem, context } = parameters;
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
                        'type X=',
                        '',
                        context,
                    ),
                ],
            });

            const cell = ContainerNode<DeepCoreNode>({});
            parameterRow.children.push(cell);
            if (apiParameter.tsdocParamBlock) {
                for (const node of apiParameter.tsdocParamBlock.content.nodes) {
                    const built = buildApiItemDocNode({
                        apiItem,
                        docNode: node,
                        context,
                    });
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
                    'function _():',
                    ' {}',
                    context,
                ),
            ],
        });

        const cell = ContainerNode<DeepCoreNode>({});
        returnsRow.children.push(cell);
        for (const node of docComment.returnsBlock.content.nodes) {
            const built = buildApiItemDocNode({
                apiItem,
                docNode: node,
                context,
            });
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
    prefixText: string,
    suffixText: string,
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
            const { apiItem } = result;
            const identifier = getApiItemIdentifier(apiItem);
            const pageId = context.getPageIdFromExportIdentifier(identifier);
            richCodeBlock.children.push(
                LocalPageLinkNode({
                    pageId,
                    hash: getApiItemAnchorName({ apiItem, context }),
                    children: [PlainTextNode({ text: tokenText })],
                }),
            );
        } else {
            // Local signature reference.
            spannedTokens.unshift(...result.tokens);
        }
    }

    richCodeBlock.children.unshift(PlainTextNode({ text: prefixText }));
    richCodeBlock.children.push(PlainTextNode({ text: suffixText }));
    formatCodeContainer(richCodeBlock);
    richCodeBlock.children.shift();
    richCodeBlock.children.pop();

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

import {
    ApiFunction,
    ApiReturnTypeMixin,
    Excerpt,
} from '@microsoft/api-extractor-model';
import { DeepCoreNode } from '../../../core/nodes';
import {
    CodeBlockNode,
    CodeLink,
    CodeLinkType,
    $HACK_SYMBOL,
} from '../../../core/nodes/CodeBlock';
import { ContainerNode } from '../../../core/nodes/Container';
import { PlainTextNode } from '../../../core/nodes/PlainText';
import { TableNode, TableRow } from '../../../core/nodes/Table';
import { TitleNode } from '../../../core/nodes/Title';
import { format, formatWithCursor, Language } from '../../../util/prettier';
import { AnalyzeContext } from '../../Context';
import { getApiItemIdentifier } from '../../util/getApiItemIdentifier';
import { getExcerptTokenReference } from '../../util/getExcerptTokenReference';
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
                        'type X = ',
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
                    'function _(): ',
                    '{}',
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

    let text = '';
    const codeLinks: CodeLink[] = [];

    for (const token of excerpt.spannedTokens) {
        const tokenText = token.text;
        const result = getExcerptTokenReference(
            token,
            tokenText,
            excerpt.text,
            context,
        );

        if (result) {
            const { apiItem } = result;
            const identifier = getApiItemIdentifier(apiItem);
            const pageId = context.getPageIdFromExportIdentifier(identifier);
            codeLinks.push({
                type: CodeLinkType.DocPage,
                pageId,
                hash: getApiItemAnchorName({ apiItem, context }),
                startIndex: text.length,
                endIndex: text.length + tokenText.length,
            });
        }

        text += tokenText;
    }

    for (const codeLink of codeLinks) {
        codeLink.startIndex =
            formatWithCursor(
                prefixText + text + suffixText,
                codeLink.startIndex + prefixText.length,
                Language.TypeScript,
                {
                    semi: false,
                },
            ).cursorOffset - prefixText.length;
        codeLink.endIndex =
            formatWithCursor(
                prefixText + text + suffixText,
                codeLink.endIndex + prefixText.length,
                Language.TypeScript,
                {
                    semi: false,
                },
            ).cursorOffset - prefixText.length;
    }

    let code = format(prefixText + text + suffixText, Language.TypeScript, {
        semi: false,
    })
        .trimEnd()
        .replace(prefixText, '');

    if (suffixText) {
        code = code.slice(0, -suffixText.length);
    }

    code = code.trimEnd();

    return CodeBlockNode({
        language: 'ts',
        code,
        codeLinks,
        [$HACK_SYMBOL]: {
            syntaxHighlightingPrefix: prefixText,
            syntaxHighlightingSuffix: suffixText,
        },
    });
}

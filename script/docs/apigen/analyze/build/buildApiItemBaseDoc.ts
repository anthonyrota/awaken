import { AedocDefinitions, ApiItem } from '@microsoft/api-extractor-model';
import { DocComment, TSDocParser } from '@microsoft/tsdoc';
import * as colors from 'colors';
import * as ts from 'typescript';
import { ContainerNode } from '../../nodes/Container';
import { DeepCoreNode } from '../../nodes/index';
import { PlainTextNode } from '../../nodes/PlainText';
import { TitleNode } from '../../nodes/Title';
import { AnalyzeContext } from '../Context';
import { getUniqueExportIdentifierKey } from '../Identifier';
import { getApiItemIdentifier } from '../util/getApiItemIdentifier';
import { UnsupportedApiItemError } from '../util/UnsupportedApiItemError';
import { buildApiItemDocNode } from './buildApiItemDocNode';
import { buildApiItemExamples } from './buildApiItemExamples';
import { buildApiItemSeeBlocks } from './buildApiItemSeeBlocks';
import { buildApiItemSummary } from './buildApiItemSummary';

export function buildApiItemBaseDoc(
    apiItem: ApiItem,
    context: AnalyzeContext,
    syntaxKind: ts.SyntaxKind,
): DeepCoreNode | undefined {
    const identifier = getApiItemIdentifier(apiItem);
    const identifierKey = getUniqueExportIdentifierKey(identifier);
    // eslint-disable-next-line max-len
    const exportIdentifierMetadata = context.sourceMetadata.exportIdentifierToExportIdentifierMetadata.get(
        identifierKey,
    );
    if (!exportIdentifierMetadata) {
        console.log(
            identifierKey,
            context.sourceMetadata.exportIdentifierToExportIdentifierMetadata,
        );
        throw new UnsupportedApiItemError(
            apiItem,
            'No export identifier metadata.',
        );
    }
    // eslint-disable-next-line max-len
    const exportMetadata = exportIdentifierMetadata.syntaxKindToExportMetadata.get(
        syntaxKind,
    );
    if (!exportMetadata) {
        throw new UnsupportedApiItemError(apiItem, 'No export metadata.');
    }

    const { baseDocComment } = exportMetadata;
    if (!baseDocComment) {
        return;
    }

    const tsdocParser = new TSDocParser(AedocDefinitions.tsdocConfiguration);
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

    return ContainerNode<DeepCoreNode>({
        children: [
            buildApiItemSummary(apiItem, context, docComment),
            buildReturnsBlockWithoutType(apiItem, context, docComment),
            buildApiItemExamples(apiItem, context, docComment),
            buildApiItemSeeBlocks(apiItem, context, docComment),
        ].filter((value): value is DeepCoreNode => value !== undefined),
    });
}

function buildReturnsBlockWithoutType(
    apiItem: ApiItem,
    context: AnalyzeContext,
    docComment: DocComment,
): DeepCoreNode | undefined {
    if (!docComment.returnsBlock) {
        return;
    }

    const container = ContainerNode<DeepCoreNode>({
        children: [
            TitleNode({
                children: [PlainTextNode({ text: 'Returns' })],
            }),
        ],
    });

    for (const node of docComment.returnsBlock.content.nodes) {
        const built = buildApiItemDocNode(apiItem, node, context);
        if (built) {
            container.children.push(built);
        }
    }

    return container;
}

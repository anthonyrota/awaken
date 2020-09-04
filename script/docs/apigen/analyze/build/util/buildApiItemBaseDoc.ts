import { AedocDefinitions, ApiItem } from '@microsoft/api-extractor-model';
import { DocComment, TSDocConfiguration, TSDocParser } from '@microsoft/tsdoc';
import * as colors from 'colors';
import * as ts from 'typescript';
import { DeepCoreNode } from '../../../core/nodes';
import { ContainerNode } from '../../../core/nodes/Container';
import { PlainTextNode } from '../../../core/nodes/PlainText';
import { TitleNode } from '../../../core/nodes/Title';
import { AnalyzeContext } from '../../Context';
import { getUniqueExportIdentifierKey } from '../../Identifier';
import { BaseDocComment } from '../../sourceMetadata';
import { getApiItemIdentifier } from '../../util/getApiItemIdentifier';
import { UnsupportedApiItemError } from '../../util/UnsupportedApiItemError';
import { buildApiItemDocNode } from './buildApiItemDocNode';
import { buildApiItemExamples } from './buildApiItemExamples';
import { buildApiItemSeeBlocks } from './buildApiItemSeeBlocks';
import { buildApiItemSummary } from './buildApiItemSummary';

export interface BuildApiItemBaseDocParameters {
    apiItem: ApiItem;
    context: AnalyzeContext;
    syntaxKind: ts.SyntaxKind;
}

export function buildApiItemBaseDoc(
    parameters: BuildApiItemBaseDocParameters,
): DeepCoreNode | undefined {
    const { apiItem, context, syntaxKind } = parameters;
    const identifier = getApiItemIdentifier(apiItem);
    const identifierKey = getUniqueExportIdentifierKey(identifier);
    // eslint-disable-next-line max-len
    const exportIdentifierMetadata = context.sourceMetadata.exportIdentifierToExportIdentifierMetadata.get(
        identifierKey,
    );
    if (!exportIdentifierMetadata) {
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

    const docComment = parseBaseDocComment({ baseDocComment });

    return ContainerNode({
        children: [
            buildApiItemSummary({ apiItem, context, docComment }),
            buildReturnsBlockWithoutType({ apiItem, context, docComment }),
            buildApiItemExamples({ apiItem, context, docComment }),
            buildApiItemSeeBlocks({ apiItem, context, docComment }),
        ].filter((value): value is DeepCoreNode => value !== undefined),
    });
}

export interface ParseBaseDocCommentParameters {
    baseDocComment: BaseDocComment;
    configuration?: TSDocConfiguration;
}

export function parseBaseDocComment(
    parameters: ParseBaseDocCommentParameters,
): DocComment {
    const { baseDocComment } = parameters;

    const tsdocParser = new TSDocParser(
        parameters.configuration || AedocDefinitions.tsdocConfiguration,
    );
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

    return docComment;
}

interface BuildReturnsBlockWithoutTypeParameters {
    apiItem: ApiItem;
    context: AnalyzeContext;
    docComment: DocComment;
}

function buildReturnsBlockWithoutType(
    parameters: BuildReturnsBlockWithoutTypeParameters,
): DeepCoreNode | undefined {
    const { apiItem, context, docComment } = parameters;
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
        const built = buildApiItemDocNode({ apiItem, docNode: node, context });
        if (built) {
            container.children.push(built);
        }
    }

    return container;
}

import {
    ApiItem,
    ApiFunction,
    ApiInterface,
    ApiVariable,
    ApiTypeAlias,
    ApiItemKind,
} from '@microsoft/api-extractor-model';
import { DeepCoreNode } from '../../core/nodes';
import { CodeSpanNode } from '../../core/nodes/CodeSpan';
import { ContainerNode } from '../../core/nodes/Container';
import { HeadingNode } from '../../core/nodes/Heading';
import { PlainTextNode } from '../../core/nodes/PlainText';
import { AnalyzeContext } from '../Context';
import { getUniqueExportIdentifierKey } from '../Identifier';
import { getApiItemIdentifier } from '../util/getApiItemIdentifier';
import {
    exportBaseDocCommentConfiguration,
    parseDocComment,
} from '../util/tsdocUtil';
import { UnsupportedApiItemError } from '../util/UnsupportedApiItemError';
import { buildApiFunction } from './buildApiFunction';
import { buildApiInterface } from './buildApiInterface';
import { buildApiTypeAlias } from './buildApiTypeAlias';
import { buildApiVariable } from './buildApiVariable';
import { buildApiItemExamples } from './util/buildApiItemExamples';
import { buildApiItemSeeBlocks } from './util/buildApiItemSeeBlocks';
import { buildApiItemSummary } from './util/buildApiItemSummary';

export interface BuildApiItemImplementationGroupParameters {
    apiItems: ApiItem[];
    context: AnalyzeContext;
}

export function buildApiItemImplementationGroup(
    parameters: BuildApiItemImplementationGroupParameters,
): DeepCoreNode {
    const { apiItems, context } = parameters;

    if (apiItems.length === 0) {
        throw new Error('No implementation.');
    }

    const functionOverloads: ApiFunction[] = [];
    let interface_: ApiInterface | undefined;
    let typeAlias: ApiTypeAlias | undefined;
    let variable: ApiVariable | undefined;

    for (const apiItem of apiItems) {
        switch (apiItem.kind) {
            case ApiItemKind.Function: {
                functionOverloads.push(apiItem as ApiFunction);
                break;
            }
            case ApiItemKind.Interface: {
                if (interface_) throw new Error('Duplicate interfaces.');
                interface_ = apiItem as ApiInterface;
                break;
            }
            case ApiItemKind.TypeAlias: {
                if (typeAlias) throw new Error('Duplicate type aliases.');
                typeAlias = apiItem as ApiTypeAlias;
                break;
            }
            case ApiItemKind.Variable: {
                if (variable) throw new Error('Duplicate variables.');
                variable = apiItem as ApiVariable;
                break;
            }
        }
    }

    const identifier = getApiItemIdentifier(apiItems[0]);

    const container = ContainerNode<DeepCoreNode>({
        children: [
            HeadingNode({
                children: [
                    CodeSpanNode({
                        children: [
                            PlainTextNode({
                                text: identifier.exportName,
                            }),
                        ],
                    }),
                ],
                alternateId: identifier.exportName,
            }),
        ],
    });

    const identifierKey = getUniqueExportIdentifierKey(identifier);
    // eslint-disable-next-line max-len
    const exportIdentifierMetadata = context.sourceMetadata.exportIdentifierToExportIdentifierMetadata.get(
        identifierKey,
    );
    if (!exportIdentifierMetadata) {
        throw new UnsupportedApiItemError(
            apiItems[0],
            'No export identifier metadata.',
        );
    }
    const { baseDocComment } = exportIdentifierMetadata;
    if (baseDocComment) {
        const docComment = parseDocComment({
            textRange: baseDocComment.textRange,
            configuration: exportBaseDocCommentConfiguration,
        });
        const apiItem = apiItems[0];
        container.children.push(
            ContainerNode({
                children: [
                    buildApiItemSummary({ apiItem, context, docComment }),
                    buildApiItemExamples({ apiItem, context, docComment }),
                    buildApiItemSeeBlocks({ apiItem, context, docComment }),
                ].filter((value): value is DeepCoreNode => value !== undefined),
            }),
        );
    }

    if (functionOverloads.length !== 0) {
        container.children.push(
            buildApiFunction({ overloads: functionOverloads, context }),
        );
    }
    if (interface_) {
        container.children.push(
            buildApiInterface({ interface: interface_, context }),
        );
    }
    if (typeAlias) {
        container.children.push(buildApiTypeAlias({ typeAlias, context }));
    }
    if (variable) {
        container.children.push(buildApiVariable({ variable, context }));
    }

    return container;
}

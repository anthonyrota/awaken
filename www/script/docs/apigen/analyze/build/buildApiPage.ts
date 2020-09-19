import {
    ApiItem,
    ApiReleaseTagMixin,
    ReleaseTag,
} from '@microsoft/api-extractor-model';
import { DeepCoreNode } from '../../core/nodes';
import { PageNode } from '../../core/nodes/Page';
import {
    TableOfContents,
    TableOfContentsInlineReference,
    TableOfContentsMainReference,
    TableOfContentsNestedReference,
} from '../../types';
import {
    AnalyzeContext,
    APIPageData,
    getApiItemsByExportIdentifier,
} from '../Context';
import { ExportIdentifier } from '../Identifier';
import { getApiItemTextKind } from '../util/getApiItemTextKind';
import { UnsupportedApiItemError } from '../util/UnsupportedApiItemError';
import { buildApiItemImplementationGroup } from './buildApiItemImplementationGroup';
import {
    areMultipleKindsInApiItemList,
    getMultiKindApiItemAnchorNameFromIdentifierAndKind,
} from './util/buildApiItemAnchor';

function getReleaseTag(apiItem: ApiItem): ReleaseTag {
    if (!ApiReleaseTagMixin.isBaseClassOf(apiItem)) {
        throw new UnsupportedApiItemError(apiItem, 'No release tag.');
    }

    return apiItem.releaseTag;
}

interface BuildApiPageParameters {
    context: AnalyzeContext;
    pageData: APIPageData;
    packageName: string;
}

export function buildApiPage(
    parameters: BuildApiPageParameters,
): PageNode<DeepCoreNode> {
    const { context, pageData, packageName } = parameters;
    const nameToApiItems = new Map<string, ApiItem[]>();

    function addExportIdentifier(identifier: ExportIdentifier): void {
        const apiItems = getApiItemsByExportIdentifier(context, identifier);

        for (const apiItem of apiItems) {
            if (getReleaseTag(apiItem) !== ReleaseTag.Public) {
                throw new UnsupportedApiItemError(
                    apiItem,
                    'Non public api items are not supported.',
                );
            }
        }

        nameToApiItems.set(identifier.exportName, apiItems);
    }

    for (const item of pageData.items) {
        addExportIdentifier({
            packageName,
            exportName: item.main,
        });
        if (item.nested) {
            for (const name of item.nested) {
                addExportIdentifier({
                    packageName,
                    exportName: name,
                });
            }
        }
    }

    function buildInlineReferences(
        name: string,
    ): TableOfContentsInlineReference[] | undefined {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const apiItems = nameToApiItems.get(name)!;
        if (!areMultipleKindsInApiItemList({ apiItems })) {
            return;
        }
        const references: TableOfContentsInlineReference[] = [];
        const uniqueKinds = new Set(apiItems.map((apiItem) => apiItem.kind));
        for (const uniqueKind of uniqueKinds) {
            const identifier: ExportIdentifier = {
                packageName,
                exportName: name,
            };
            references.push({
                text: getApiItemTextKind(uniqueKind),
                // eslint-disable-next-line max-len
                urlHashText: getMultiKindApiItemAnchorNameFromIdentifierAndKind(
                    {
                        identifier,
                        kind: uniqueKind,
                    },
                ),
            });
        }
        return references;
    }

    const tableOfContents: TableOfContents = [];
    for (const item of pageData.items) {
        const reference: TableOfContentsMainReference = {
            text: item.main,
            urlHashText: item.main.toLowerCase(),
        };
        const inlineReferences = buildInlineReferences(item.main);
        if (inlineReferences) {
            reference.inlineReferences = inlineReferences;
        }
        if (item.nested) {
            reference.nested_references = [];
            for (const name of item.nested) {
                const nestedReference: TableOfContentsNestedReference = {
                    text: name,
                    urlHashText: name.toLowerCase(),
                };
                // eslint-disable-next-line max-len
                const inlineReferences = buildInlineReferences(name);
                if (inlineReferences) {
                    nestedReference.inlineReferences = inlineReferences;
                }
                reference.nested_references.push(nestedReference);
            }
        }
        tableOfContents.push(reference);
    }

    return PageNode<DeepCoreNode>({
        metadata: {
            title: pageData.pageTitle,
            tableOfContents: tableOfContents,
        },
        pageUrl: pageData.pageUrl,
        children: Array.from(nameToApiItems, ([, apiItems]) => {
            return buildApiItemImplementationGroup({
                apiItems,
                context,
            });
        }),
    });
}

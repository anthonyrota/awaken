import {
    ApiItem,
    ApiReleaseTagMixin,
    ReleaseTag,
} from '@microsoft/api-extractor-model';
import { DeepCoreNode } from '../../core/nodes';
import { PageNode } from '../../core/nodes/Page';
import { simplifyDeepCoreNode } from '../../core/nodes/util/simplify';
import {
    TableOfContents,
    TableOfContentsInlineReference,
    TableOfContentsMainReference,
} from '../../types';
import { AnalyzeContext } from '../Context';
import { ExportIdentifier, getUniqueExportIdentifierKey } from '../Identifier';
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

export interface PageExport {
    main: ExportIdentifier;
    nested?: ExportIdentifier[];
}

export type PageExports = PageExport[];

interface BuildApiPageParameters {
    context: AnalyzeContext;
    pageId: string;
    pageTitle: string;
    pageExports: PageExports;
}

export function buildApiPage(
    parameters: BuildApiPageParameters,
): PageNode<DeepCoreNode> {
    const { context, pageId, pageTitle, pageExports } = parameters;
    const exportIdentifierKeyToApiItems = new Map<string, ApiItem[]>();

    function addExportIdentifier(identifier: ExportIdentifier): void {
        const apiItems = context.getApiItemsByExportIdentifier(identifier);

        for (const apiItem of apiItems) {
            if (getReleaseTag(apiItem) !== ReleaseTag.Public) {
                throw new UnsupportedApiItemError(
                    apiItem,
                    'Non public api items are not supported.',
                );
            }
        }

        exportIdentifierKeyToApiItems.set(
            getUniqueExportIdentifierKey(identifier),
            apiItems,
        );
    }

    for (const item of pageExports) {
        addExportIdentifier(item.main);
        if (item.nested) {
            for (const nested of item.nested) {
                addExportIdentifier(nested);
            }
        }
    }

    function buildInlineReferences(
        exportIdentifier: ExportIdentifier,
    ): TableOfContentsInlineReference[] | undefined {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const apiItems = exportIdentifierKeyToApiItems.get(
            getUniqueExportIdentifierKey(exportIdentifier),
        )!;
        if (!areMultipleKindsInApiItemList({ apiItems })) {
            return;
        }
        const references: TableOfContentsInlineReference[] = [];
        const uniqueKinds = new Set(apiItems.map((apiItem) => apiItem.kind));
        for (const uniqueKind of uniqueKinds) {
            references.push({
                text: getApiItemTextKind(uniqueKind),
                // eslint-disable-next-line max-len
                urlHashText: getMultiKindApiItemAnchorNameFromIdentifierAndKind(
                    {
                        identifier: exportIdentifier,
                        kind: uniqueKind,
                    },
                ),
            });
        }
        return references;
    }

    const tableOfContents: TableOfContents = [];
    for (const item of pageExports) {
        const reference: TableOfContentsMainReference = {
            text: item.main.exportName,
            urlHashText: item.main.exportName,
        };
        const inlineReferences = buildInlineReferences(item.main);
        if (inlineReferences) {
            reference.inlineReferences = inlineReferences;
        }
        if (item.nested) {
            reference.nestedReferences = [];
            for (const name of item.nested) {
                const nestedReference: TableOfContentsMainReference = {
                    text: name.exportName,
                    urlHashText: name.exportName,
                };
                // eslint-disable-next-line max-len
                const inlineReferences = buildInlineReferences(name);
                if (inlineReferences) {
                    nestedReference.inlineReferences = inlineReferences;
                }
                reference.nestedReferences.push(nestedReference);
            }
        }
        tableOfContents.push(reference);
    }

    const pageNode = PageNode<DeepCoreNode>({
        title: pageTitle,
        tableOfContents: tableOfContents,
        pageId,
        children: Array.from(exportIdentifierKeyToApiItems, ([, apiItems]) => {
            return buildApiItemImplementationGroup({
                apiItems,
                context,
            });
        }),
    });
    simplifyDeepCoreNode(pageNode);
    return pageNode;
}

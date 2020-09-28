import { ApiItem } from '@microsoft/api-extractor-model';
import { DeepCoreNode } from '../../../core/nodes';
import { CodeSpanNode } from '../../../core/nodes/CodeSpan';
import { PlainTextNode } from '../../../core/nodes/PlainText';
import { SubheadingNode } from '../../../core/nodes/Subheading';
import { AnalyzeContext } from '../../Context';
import { ExportIdentifier } from '../../Identifier';
import { getApiItemIdentifier } from '../../util/getApiItemIdentifier';

export interface AreMultipleKindsInApiItemListParameters {
    apiItems: ApiItem[];
}

export function areMultipleKindsInApiItemList(
    parameters: AreMultipleKindsInApiItemListParameters,
): boolean {
    const { apiItems } = parameters;
    if (apiItems.length === 0) {
        throw new Error('No.');
    }
    const kind = apiItems[0].kind;
    return apiItems.some((apiItem_) => apiItem_.kind !== kind);
}

function hasMultipleKinds(apiItem: ApiItem, context: AnalyzeContext): boolean {
    return areMultipleKindsInApiItemList({
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        apiItems: context.getApiItemsByExportIdentifier(
            getApiItemIdentifier(apiItem),
        )!,
    });
}

export interface GetMultiKindApiItemAnchorNameFromIdentifierAndKindParameters {
    identifier: ExportIdentifier;
    kind: string;
}

export function getMultiKindApiItemAnchorNameFromIdentifierAndKind(
    parameters: GetMultiKindApiItemAnchorNameFromIdentifierAndKindParameters,
): string {
    return `${parameters.identifier.exportName}-${parameters.kind}`.replace(
        / /g,
        '',
    );
}

function getMultiKindApiItemAnchorName(apiItem: ApiItem): string {
    return getMultiKindApiItemAnchorNameFromIdentifierAndKind({
        identifier: getApiItemIdentifier(apiItem),
        kind: apiItem.kind,
    });
}

export interface GetApiItemAnchorNameParameters {
    apiItem: ApiItem;
    context: AnalyzeContext;
}

export function getApiItemAnchorName(
    parameters: GetApiItemAnchorNameParameters,
): string {
    if (hasMultipleKinds(parameters.apiItem, parameters.context)) {
        return getMultiKindApiItemAnchorName(parameters.apiItem);
    }
    return getApiItemIdentifier(parameters.apiItem).exportName;
}

export interface BuildApiItemAnchorParameters {
    apiItem: ApiItem;
    context: AnalyzeContext;
    textKind: string;
}

export function buildApiItemAnchor(
    parameters: BuildApiItemAnchorParameters,
): DeepCoreNode | undefined {
    if (hasMultipleKinds(parameters.apiItem, parameters.context)) {
        return SubheadingNode({
            alternateId: getMultiKindApiItemAnchorName(parameters.apiItem),
            children: [
                CodeSpanNode({
                    children: [
                        PlainTextNode({
                            text: `${
                                getApiItemIdentifier(parameters.apiItem)
                                    .exportName
                            } - ${parameters.textKind}`,
                        }),
                    ],
                }),
            ],
        });
    }
    return;
}

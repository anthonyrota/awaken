import { ApiItem } from '@microsoft/api-extractor-model';
import { CodeSpanNode } from '../../nodes/CodeSpan';
import { AnalyzeContext } from '../Context';
import { ExportIdentifier } from '../Identifier';
import { getApiItemIdentifier } from '../util/getApiItemIdentifier';
import { DeepCoreNode } from './../../nodes/index';
import { PlainTextNode } from './../../nodes/PlainText';
import { SubheadingNode } from './../../nodes/Subheading';

function areMultipleKindsInApiItemList(apiItems: ApiItem[]): boolean {
    if (apiItems.length === 0) {
        throw new Error('No.');
    }
    const kind = apiItems[0].kind;
    return apiItems.some((apiItem_) => apiItem_.kind !== kind);
}

function hasMultipleKinds(apiItem: ApiItem, context: AnalyzeContext): boolean {
    return areMultipleKindsInApiItemList(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        context.getApiItemsByExportIdentifier(getApiItemIdentifier(apiItem))!,
    );
}

// TODO: handle lowercase collisions.
export function getMultiKindApiItemAnchorNameFromIdentifierAndKind(
    identifier: ExportIdentifier,
    kind: string,
): string {
    return `${identifier.exportName}-${kind}`.toLowerCase().replace(/ /g, '');
}

function getMultiKindApiItemAnchorName(apiItem: ApiItem): string {
    return getMultiKindApiItemAnchorNameFromIdentifierAndKind(
        getApiItemIdentifier(apiItem),
        apiItem.kind,
    );
}

export function getApiItemAnchorName(
    apiItem: ApiItem,
    context: AnalyzeContext,
): string {
    if (hasMultipleKinds(apiItem, context)) {
        return getMultiKindApiItemAnchorName(apiItem);
    }
    return getApiItemIdentifier(apiItem).exportName.toLowerCase();
}

export function buildApiItemAnchor(
    apiItem: ApiItem,
    context: AnalyzeContext,
    textKind: string,
): DeepCoreNode | undefined {
    if (hasMultipleKinds(apiItem, context)) {
        return SubheadingNode({
            alternateId: getMultiKindApiItemAnchorName(apiItem),
            children: [
                CodeSpanNode({
                    children: [
                        PlainTextNode({
                            text: `${
                                getApiItemIdentifier(apiItem).exportName
                            } - ${textKind}`,
                        }),
                    ],
                }),
            ],
        });
    }
    return;
}

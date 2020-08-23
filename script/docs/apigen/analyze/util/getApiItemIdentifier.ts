import { ApiItem } from '@microsoft/api-extractor-model';
import { ExportIdentifier } from '../Identifier';

export function getApiItemIdentifier(apiItem: ApiItem): ExportIdentifier {
    return {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        packageName: apiItem.getAssociatedPackage()!.name,
        exportName: getApiItemName(apiItem),
    };
}

function getApiItemName(apiItem: ApiItem): string {
    const match = /^(.+)_\d+$/.exec(apiItem.displayName);
    if (match) {
        return match[1];
    }
    return apiItem.displayName;
}

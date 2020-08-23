import { ApiItem, ApiModel } from '@microsoft/api-extractor-model';
import { ExportIdentifier, getUniqueExportIdentifierKey } from './Identifier';
import { SourceMetadata } from './sourceMetadata';

export class AnalyzeContext {
    private _apiItemsByExportIdentifier = new Map<string, ApiItem[]>();

    constructor(
        public sourceMetadata: SourceMetadata,
        public apiModel: ApiModel,
    ) {}

    public getApiItemsByExportIdentifier(
        identifier: ExportIdentifier,
        defaultValue?: ApiItem[],
    ): ApiItem[] {
        const identifierKey = getUniqueExportIdentifierKey(identifier);
        const apiItems = this._apiItemsByExportIdentifier.get(identifierKey);
        if (!apiItems) {
            if (defaultValue) {
                this._apiItemsByExportIdentifier.set(
                    identifierKey,
                    defaultValue,
                );
                return defaultValue;
            }
            throw new Error(
                `No api item set for export identifier ${identifierKey}`,
            );
        }
        return apiItems;
    }

    public setApiItemByExportIdentifier(
        identifier: ExportIdentifier,
        apiItems: ApiItem[],
    ): void {
        const identifierKey = getUniqueExportIdentifierKey(identifier);
        this._apiItemsByExportIdentifier.set(identifierKey, apiItems);
    }
}

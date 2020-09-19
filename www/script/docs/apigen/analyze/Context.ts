import { ApiItem, ApiModel } from '@microsoft/api-extractor-model';
import { ExportIdentifier, getUniqueExportIdentifierKey } from './Identifier';
import { SourceMetadata } from './sourceMetadata';

export interface APIPageDataItem {
    main: string;
    nested?: string[];
}

export interface APIPageData {
    pageDirectory: string;
    pageTitle: string;
    pageUrl: string;
    items: APIPageDataItem[];
}

export interface APIPackageData {
    packageDirectory: string;
    packageName: string;
    pages: APIPageData[];
}

export interface AnalyzeContextParameters {
    sourceMetadata: SourceMetadata;
    apiModel: ApiModel;
    packageScope: string;
    outDir: string;
    getPathOfExportIdentifier: (identifier: ExportIdentifier) => string;
    packageDataList: APIPackageData[];
    packageIdentifierToPathMap: Map<string, string>;
}

export interface AnalyzeContext extends AnalyzeContextParameters {
    _apiItemsByExportIdentifier: Map<string, ApiItem[]>;
}

export function AnalyzeContext(
    parameters: AnalyzeContextParameters,
): AnalyzeContext {
    return {
        ...parameters,
        _apiItemsByExportIdentifier: new Map<string, ApiItem[]>(),
    };
}

export function getApiItemsByExportIdentifier(
    context: AnalyzeContext,
    identifier: ExportIdentifier,
    defaultValue?: ApiItem[],
): ApiItem[] {
    const identifierKey = getUniqueExportIdentifierKey(identifier);
    const apiItems = context._apiItemsByExportIdentifier.get(identifierKey);
    if (!apiItems) {
        if (defaultValue) {
            context._apiItemsByExportIdentifier.set(
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

export function setApiItemByExportIdentifier(
    context: AnalyzeContext,
    identifier: ExportIdentifier,
    apiItems: ApiItem[],
): void {
    const identifierKey = getUniqueExportIdentifierKey(identifier);
    context._apiItemsByExportIdentifier.set(identifierKey, apiItems);
}

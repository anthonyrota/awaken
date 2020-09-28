import { ApiItem, ApiModel } from '@microsoft/api-extractor-model';
import { ExportIdentifier } from './Identifier';
import { SourceMetadata } from './sourceMetadata';

export interface AnalyzeContextParameters {
    sourceMetadata: SourceMetadata;
    apiModel: ApiModel;
    getDynamicTextVariableReplacement: (variableName: string) => string;
    getPageIdFromExportIdentifier: (
        exportIdentifier: ExportIdentifier,
    ) => string;
    getApiItemsByExportIdentifier: (
        exportIdentifier: ExportIdentifier,
    ) => ApiItem[];
}

export interface AnalyzeContext extends AnalyzeContextParameters {}

export function AnalyzeContext(
    parameters: AnalyzeContextParameters,
): AnalyzeContext {
    return {
        sourceMetadata: parameters.sourceMetadata,
        apiModel: parameters.apiModel,
        getDynamicTextVariableReplacement:
            parameters.getDynamicTextVariableReplacement,
        getPageIdFromExportIdentifier: parameters.getPageIdFromExportIdentifier,
        getApiItemsByExportIdentifier: parameters.getApiItemsByExportIdentifier,
    };
}

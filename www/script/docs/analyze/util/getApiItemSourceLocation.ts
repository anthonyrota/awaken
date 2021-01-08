import { ApiItem } from '@microsoft/api-extractor-model';
import * as ts from 'typescript';
import { AnalyzeContext } from '../Context';
import { getUniqueExportIdentifierKey } from '../Identifier';
import { getApiItemIdentifier } from '../util/getApiItemIdentifier';
import { UnsupportedApiItemError } from '../util/UnsupportedApiItemError';

export interface GetApiItemSourceLocationParameters {
    apiItem: ApiItem;
    context: AnalyzeContext;
    syntaxKind: ts.SyntaxKind;
}

export function getApiItemSourceGithubPathFromRoot(
    parameters: GetApiItemSourceLocationParameters,
): string {
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
        throw new UnsupportedApiItemError(
            apiItem,
            `No export metadata. Identifier key: ${identifierKey}. Syntax kind: ${ts.SyntaxKind[syntaxKind]}`,
        );
    }

    const { sourceLocation } = exportMetadata;
    return `${/* TODO */ sourceLocation.filePath.replace(/^..\//, '')}#L${
        sourceLocation.lineNumber
    }`;
}

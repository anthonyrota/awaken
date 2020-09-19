import { ApiItem } from '@microsoft/api-extractor-model';
import { getApiItemAnchorName } from '../build/util/buildApiItemAnchor';
import { AnalyzeContext } from '../Context';
import { ExportIdentifier } from '../Identifier';
import { getApiItemIdentifier } from './getApiItemIdentifier';

// TODO: handle lowercase collisions.
export function getPagePathOfExportIdentifier(
    currentExportIdentifier: ExportIdentifier,
    exportIdentifier: ExportIdentifier,
    context: AnalyzeContext,
): string {
    const currentApiItemPath = context.getPathOfExportIdentifier(
        currentExportIdentifier,
    );
    const apiItemPath = context.getPathOfExportIdentifier(exportIdentifier);
    if (!currentApiItemPath || !apiItemPath) {
        throw new Error('No more coding today.');
    }
    const titleHash = exportIdentifier.exportName.toLowerCase();

    return currentApiItemPath === apiItemPath
        ? `#${titleHash}`
        : `${apiItemPath}#${titleHash}`;
}

export function getPagePathOfApiItem(
    currentExportIdentifier: ExportIdentifier,
    apiItem: ApiItem,
    context: AnalyzeContext,
): string {
    const currentApiItemPath = context.getPathOfExportIdentifier(
        currentExportIdentifier,
    );
    const apiItemPath = context.getPathOfExportIdentifier(
        getApiItemIdentifier(apiItem),
    );
    if (!currentApiItemPath || !apiItemPath) {
        throw new Error('No more coding today.');
    }
    const titleHash = getApiItemAnchorName({ apiItem, context });

    return currentApiItemPath === apiItemPath
        ? `#${titleHash}`
        : `${apiItemPath}#${titleHash}`;
}

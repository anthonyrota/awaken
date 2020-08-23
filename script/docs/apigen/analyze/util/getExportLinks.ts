import { ApiItem } from '@microsoft/api-extractor-model';
import { getPathOfExportIdentifier } from '../../paths';
import { getRelativePath } from '../../util/getRelativePath';
import { getApiItemAnchorName } from '../build/buildApiItemAnchor';
import { ExportIdentifier } from '../Identifier';
import { AnalyzeContext } from './../Context';
import { getApiItemIdentifier } from './getApiItemIdentifier';

// TODO: handle lowercase collisions.
export function getLinkToExportIdentifier(
    currentExportIdentifier: ExportIdentifier,
    exportIdentifier: ExportIdentifier,
): string {
    const currentApiItemPath = getPathOfExportIdentifier(
        currentExportIdentifier,
    );
    const apiItemPath = getPathOfExportIdentifier(exportIdentifier);
    if (!currentApiItemPath || !apiItemPath) {
        throw new Error('No more coding today.');
    }
    const relativePath = getRelativePath(currentApiItemPath, apiItemPath);
    const titleHash = exportIdentifier.exportName.toLowerCase();

    return relativePath ? `${relativePath}#${titleHash}` : `#${titleHash}`;
}

export function getLinkToApiItem(
    currentExportIdentifier: ExportIdentifier,
    apiItem: ApiItem,
    context: AnalyzeContext,
): string {
    const currentApiItemPath = getPathOfExportIdentifier(
        currentExportIdentifier,
    );
    const apiItemPath = getPathOfExportIdentifier(
        getApiItemIdentifier(apiItem),
    );
    if (!currentApiItemPath || !apiItemPath) {
        throw new Error('No more coding today.');
    }
    const relativePath = getRelativePath(currentApiItemPath, apiItemPath);
    const titleHash = getApiItemAnchorName(apiItem, context);

    return relativePath ? `${relativePath}#${titleHash}` : `#${titleHash}`;
}

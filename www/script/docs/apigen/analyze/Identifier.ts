export interface ExportIdentifier {
    packageName: string;
    exportName: string;
}

export function getUniqueExportIdentifierKey(
    identifier: ExportIdentifier,
): string {
    return `${identifier.packageName}:${identifier.exportName}`;
}

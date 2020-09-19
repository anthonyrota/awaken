import { AnalyzeContext } from '../Context';

export function outPagePathToPageUrl(
    mdPagePath: string,
    context: AnalyzeContext,
): string {
    const [path, hash] = mdPagePath.split('#');
    if (!path) {
        return `#${hash}`;
    }
    for (const packageData of context.packageDataList) {
        for (const pageData of packageData.pages) {
            if (
                path ===
                `${packageData.packageDirectory}/${pageData.pageDirectory}`
            ) {
                return hash ? `${pageData.pageUrl}#${hash}` : pageData.pageUrl;
            }
        }
    }
    throw new Error(`No matching page for given ${mdPagePath}`);
}

export function pageUrlToOutPagePath(
    pageUrl: string,
    context: AnalyzeContext,
): string {
    const [path, hash] = pageUrl.split('#');
    if (!path) {
        return `#${hash}`;
    }
    for (const packageData of context.packageDataList) {
        for (const pageData of packageData.pages) {
            if (path === pageData.pageUrl) {
                const pagePath = `${packageData.packageDirectory}/${pageData.pageDirectory}`;
                return hash ? `${pagePath}#${hash}` : pagePath;
            }
        }
    }
    throw new Error(`No matching page for given ${pageUrl}`);
}

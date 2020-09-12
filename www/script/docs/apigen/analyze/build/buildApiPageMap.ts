import { ApiItemKind, ApiPackage } from '@microsoft/api-extractor-model';
import { DeepCoreNode } from '../../core/nodes';
import { PageNode } from '../../core/nodes/Page';
import { simplifyDeepCoreNode } from '../../core/simplify';
import { AnalyzeContext, getApiItemsByExportIdentifier } from '../Context';
import { getUniqueExportIdentifierKey } from '../Identifier';
import { getApiItemIdentifier } from '../util/getApiItemIdentifier';
import { UnsupportedApiItemError } from '../util/UnsupportedApiItemError';
import { buildApiPage } from './buildApiPage';

export function buildApiPageMap(
    context: AnalyzeContext,
): Map<string, PageNode<DeepCoreNode>> {
    const { apiModel, packageDataList, packageIdentifierToPathMap } = context;
    const memberIdentifierKeys = new Set<string>();

    for (const package_ of apiModel.members) {
        if (package_.kind !== ApiItemKind.Package) {
            throw new UnsupportedApiItemError(
                package_,
                'Expected to be a package.',
            );
        }

        const members = (package_ as ApiPackage).entryPoints[0].members;

        for (const apiItem of members) {
            const memberIdentifier = getApiItemIdentifier(apiItem);
            memberIdentifierKeys.add(
                getUniqueExportIdentifierKey(memberIdentifier),
            );
            const apiItems = getApiItemsByExportIdentifier(
                context,
                memberIdentifier,
                [],
            );
            apiItems.push(apiItem);
        }
    }

    for (const memberIdentifier of memberIdentifierKeys) {
        if (!packageIdentifierToPathMap.has(memberIdentifier)) {
            throw new Error(`${memberIdentifier} not mapped.`);
        }
    }

    if (memberIdentifierKeys.size !== packageIdentifierToPathMap.size) {
        console.log(memberIdentifierKeys, [
            ...packageIdentifierToPathMap.keys(),
        ]);
        throw new Error('Not same number of names mapped.');
    }

    const entries = packageDataList.flatMap((packageData) => {
        return packageData.pages.map((pageData) => {
            const path = `${packageData.packageDirectory}/${pageData.pageDirectory}`;
            const pageNode = buildApiPage({
                packageName: packageData.packageName,
                pageData,
                context,
            });
            simplifyDeepCoreNode(pageNode);
            return [path, pageNode] as const;
        });
    });

    return new Map(entries);
}

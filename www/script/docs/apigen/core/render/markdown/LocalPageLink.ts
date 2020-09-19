import { getRelativePath } from '../../../util/getRelativePath';
import { Node } from '../../nodes';
import { LinkNode } from '../../nodes/Link';
import { LocalPageLinkBase } from '../../nodes/LocalPageLink';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteChildNode, ParamWriteRenderMarkdownNode } from '.';

export function writeLocalPageLink<ChildNode extends Node>(
    localPageLink: LocalPageLinkBase<ChildNode>,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    // This is junk.
    let [path, hash] = localPageLink.pagePath.split('#');
    if (path) {
        let isOneIndexPagePackage = false;
        if (path.endsWith('/_index')) {
            const packageData = output.analyzeContext.packageDataList.find(
                (packageData) =>
                    packageData.pages.some(
                        (page) =>
                            path ===
                            `${packageData.packageDirectory}/${page.pageDirectory}`,
                    ),
            );
            if (!packageData) {
                throw new Error(
                    `No corresponding package data found for ${path}`,
                );
            }
            if (packageData.pages.length === 1) {
                isOneIndexPagePackage = true;
            }
        }
        const p = isOneIndexPagePackage
            ? path.replace(/_index$/, 'README')
            : path;
        const x = hash ? `${p}.md#${hash}` : `${p}.md`;
        const relative = getRelativePath(
            output.pagePath,
            `${output.analyzeContext.outDir}/${x}`,
        );
        [path, hash] = relative.split('#');
    }
    writeRenderMarkdownNode(
        LinkNode<ChildNode>({
            destination: path
                ? hash
                    ? `${path}#${hash}`
                    : `${path}#readme`
                : `#${hash}`,
            title: localPageLink.title,
            children: localPageLink.children,
        }),
        output,
        writeChildNode,
    );
}

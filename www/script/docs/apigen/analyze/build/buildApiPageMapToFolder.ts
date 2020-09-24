import { BoldNode } from '../../core/nodes/Bold';
import { CollapsibleSectionNode } from '../../core/nodes/CollapsibleSection';
import { ContainerNode } from '../../core/nodes/Container';
import { HeadingNode } from '../../core/nodes/Heading';
import { LinkNode } from '../../core/nodes/Link';
import { PageNode } from '../../core/nodes/Page';
import { PageTitleNode } from '../../core/nodes/PageTitle';
import { PlainTextNode } from '../../core/nodes/PlainText';
import { SubheadingNode } from '../../core/nodes/Subheading';
import { renderDeepRenderMarkdownNodeAsMarkdown } from '../../core/render/markdown';
import { DeepRenderMarkdownNode } from '../../core/render/markdown/nodes';
import { DoNotEditCommentNode } from '../../core/render/markdown/nodes/DoNotEditComment';
import { TableOfContentsNode } from '../../core/render/markdown/nodes/TableOfContents';
import {
    addFileToFolder,
    removeFileFromFolder,
    Folder,
} from '../../util/Folder';
import { AnalyzeContext } from '../Context';

export interface BuildApiPageMapToFolderParameters {
    pageMap: Map<string, PageNode<DeepRenderMarkdownNode>>;
    context: AnalyzeContext;
}

export function buildApiPageMapToFolder(
    parameters: BuildApiPageMapToFolderParameters,
): Folder {
    const { pageMap: pageNodeMap, context } = parameters;
    const { packageDataList } = context;
    const outFolder = Folder();

    for (const [path, page] of pageNodeMap) {
        const fileName = `${path}.md`;
        addFileToFolder(
            outFolder,
            fileName,
            renderDeepRenderMarkdownNodeAsMarkdown(page, {
                pagePath: `${context.outDir}/${fileName}`,
                analyzeContext: parameters.context,
            }),
        );
    }

    interface GetPageLinksFunction {
        (inBase: boolean): {
            headingLink: LinkNode<DeepRenderMarkdownNode>;
            tableOfContents: TableOfContentsNode;
        }[];
    }

    const packageDirectoryToPageSummaryMap = new Map<
        string,
        {
            isOneIndexPagePackage: boolean;
            pageTitleTextNode: PlainTextNode;
            getPageLinks: GetPageLinksFunction;
        }
    >();

    for (const packageData of packageDataList) {
        const { pages } = packageData;
        const isOneIndexPagePackage =
            pages.length === 1 && pages[0].pageDirectory === '_index';
        const pageTitleTextNode = PlainTextNode({
            text: `API Reference - ${packageData.packageName}`,
        });
        const getPageLinks: GetPageLinksFunction = (inBase) =>
            pages.map((pageData) => {
                const pageName = isOneIndexPagePackage
                    ? 'README'
                    : pageData.pageDirectory;
                const pagePath = inBase
                    ? `${packageData.packageDirectory}/${pageName}.md#readme`
                    : `${pageName}.md#readme`;
                const outPagePath = `${packageData.packageDirectory}/${pageData.pageDirectory}`;
                return {
                    headingLink: LinkNode({
                        destination: pagePath,
                        children: [PlainTextNode({ text: pageData.pageTitle })],
                    }),
                    tableOfContents: TableOfContentsNode({
                        // eslint-disable-next-line max-len
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        tableOfContents: pageNodeMap.get(outPagePath)!.metadata
                            .tableOfContents,
                        pagePath: outPagePath,
                    }),
                };
            });

        packageDirectoryToPageSummaryMap.set(packageData.packageDirectory, {
            isOneIndexPagePackage,
            pageTitleTextNode,
            getPageLinks,
        });

        if (isOneIndexPagePackage) {
            const oldPagePathRaw = `${packageData.packageDirectory}/_index`;
            const newPagePath = `${packageData.packageDirectory}/README.md`;
            removeFileFromFolder(outFolder, `${oldPagePathRaw}.md`);
            addFileToFolder(
                outFolder,
                newPagePath,
                renderDeepRenderMarkdownNodeAsMarkdown(
                    // eslint-disable-next-line max-len
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    pageNodeMap.get(oldPagePathRaw)!,
                    {
                        pagePath: `${context.outDir}/${newPagePath}`,
                        analyzeContext: parameters.context,
                    },
                ),
            );
            continue;
        }

        const contents = ContainerNode({
            children: [
                DoNotEditCommentNode({}),
                PageTitleNode({
                    children: [pageTitleTextNode],
                }),
                ...getPageLinks(false).flatMap(
                    ({ headingLink, tableOfContents }) => [
                        HeadingNode({
                            children: [headingLink],
                        }),
                        tableOfContents,
                    ],
                ),
            ],
        });

        const pagePath = `${packageData.packageDirectory}/README.md`;
        addFileToFolder(
            outFolder,
            pagePath,
            renderDeepRenderMarkdownNodeAsMarkdown(contents, {
                pagePath: `${context.outDir}/${pagePath}`,
                analyzeContext: parameters.context,
            }),
        );
    }

    const packageSummaries = [
        ...packageDirectoryToPageSummaryMap.entries(),
    ].flatMap<DeepRenderMarkdownNode>(([packageDirectory, packageSummary]) => {
        const {
            isOneIndexPagePackage,
            pageTitleTextNode,
            getPageLinks,
        } = packageSummary;

        const heading = HeadingNode({
            children: [
                LinkNode({
                    destination: `${packageDirectory}/README.md#readme`,
                    children: [pageTitleTextNode],
                }),
            ],
        });

        if (isOneIndexPagePackage) {
            const { tableOfContents } = getPageLinks(true)[0];
            return [heading, tableOfContents];
        }

        return [
            heading,
            CollapsibleSectionNode({
                summaryNode: BoldNode({
                    children: [PlainTextNode({ text: 'Table of Contents' })],
                }),
                children: getPageLinks(true).flatMap(
                    ({ headingLink, tableOfContents }) => [
                        SubheadingNode({
                            children: [headingLink],
                        }),
                        tableOfContents,
                    ],
                ),
            }),
        ];
    });

    const contents = ContainerNode<DeepRenderMarkdownNode>({
        children: [
            DoNotEditCommentNode({}),
            PageTitleNode({
                children: [PlainTextNode({ text: 'Awaken API Reference' })],
            }),
            ...packageSummaries,
        ],
    });

    const pagePath = 'README.md';
    addFileToFolder(
        outFolder,
        pagePath,
        renderDeepRenderMarkdownNodeAsMarkdown(contents, {
            pagePath: `${context.outDir}/${pagePath}`,
            analyzeContext: parameters.context,
        }),
    );

    return outFolder;
}

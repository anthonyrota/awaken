import * as path from 'path';
import { promisify } from 'util';
import {
    ApiModel,
    ApiItem,
    ApiItemKind,
    ApiPackage,
} from '@microsoft/api-extractor-model';
import * as fs from 'fs-extra';
import * as pLimit from 'p-limit';
import * as rimraf from 'rimraf';
import { ThemeDark, ThemeLight, Theme } from '../../src/theme';
import { computeFileHash } from '../computeFileHash';
import { exit } from '../exit';
import { rootDir } from '../rootDir';
import { buildApiPage, PageExports } from './analyze/build/buildApiPage';
import { AnalyzeContext } from './analyze/Context';
import {
    ExportIdentifier,
    getUniqueExportIdentifierKey,
} from './analyze/Identifier';
import { generateSourceMetadata } from './analyze/sourceMetadata';
import { getApiItemIdentifier } from './analyze/util/getApiItemIdentifier';
import { UnsupportedApiItemError } from './analyze/util/UnsupportedApiItemError';
import { DeepCoreNode, CoreNodeType } from './core/nodes';
import { $HACK_SYMBOL } from './core/nodes/CodeBlock';
import { DocPageLinkNode } from './core/nodes/DocPageLink';
import { HtmlElementNode } from './core/nodes/HtmlElement';
import { LineBreakNode } from './core/nodes/LineBreak';
import { PageNode } from './core/nodes/Page';
import { PlainTextNode } from './core/nodes/PlainText';
import { TableNode, TableRow } from './core/nodes/Table';
import { collapseDeepCoreNodeWhitespace } from './core/nodes/util/simplify';
import { walkDeepCoreNode } from './core/nodes/util/walk';
import { renderDeepRenderMarkdownNodeAsMarkdown } from './core/render/markdown';
import { buildDocsSourceDirectoryToApiPages } from './docsSource';
import { getDynamicTextVariableReplacementP } from './getDynamicTextVariableReplacement';
import { PageGroup, Pages, PagesMetadata } from './types';
import {
    addFileToFolder,
    Folder,
    writeFolderToDirectoryPath,
} from './util/Folder';
import { globAbsolute } from './util/glob';
import {
    TokenizeLanguage,
    tokenizeText,
    codeBlockStyleMap,
} from './util/tokenizeText';
import {
    EncodedTokenizedLines,
    EncodedTokenizedLinesMap,
    encodeTokenizedLines,
} from './util/tokenizeText/util';
import { createProgram } from './util/ts';

const rimrafP = promisify(rimraf);

async function main() {
    const sourceFilePaths = await globAbsolute('packages/*/src/**', {
        nodir: true,
    });
    const program = createProgram(sourceFilePaths);

    const packages = await fs.readdir(path.join(rootDir, 'packages'));
    const packageNameToExportFilePath = new Map<string, string>(
        packages.map((packageName) => [
            `@microstream/${packageName}`,
            `packages/${packageName}/src/index.ts`,
        ]),
    );
    const sourceMetadata = generateSourceMetadata(
        program,
        packageNameToExportFilePath,
    );

    const apiModel = new ApiModel();
    const apiModelFilePaths = await globAbsolute('temp/*.api.json', {
        nodir: true,
    });

    for (const apiModelFilePath of apiModelFilePaths) {
        apiModel.loadPackage(apiModelFilePath);
    }

    function coreIdentifier(exportName: string): ExportIdentifier {
        return {
            packageName: '@microstream/core',
            exportName,
        };
    }

    function testingIdentifier(exportName: string): ExportIdentifier {
        return {
            packageName: '@microstream/testing',
            exportName,
        };
    }

    const exportIdentifierKeyToPageId = new Map<string, string>();

    function mapExportIdentifierToPageId(
        identifier: ExportIdentifier,
        id: string,
    ): void {
        const identifierKey = getUniqueExportIdentifierKey(identifier);
        if (exportIdentifierKeyToPageId.has(identifierKey)) {
            throw new Error(`Duplicate identifier ${identifierKey}`);
        }
        exportIdentifierKeyToPageId.set(identifierKey, id);
    }

    function getPageIdFromExportIdentifier(
        identifier: ExportIdentifier,
    ): string {
        const identifierKey = getUniqueExportIdentifierKey(identifier);
        const pageId = exportIdentifierKeyToPageId.get(identifierKey);
        if (pageId === undefined) {
            throw new Error(
                `No page id for export identifier ${identifierKey}`,
            );
        }
        return pageId;
    }

    interface Group {
        title: string;
        exports: PageExports;
    }

    const apiPagesGroupOutlines: Group[] = [
        {
            title: 'Disposable',
            exports: [
                { main: coreIdentifier('Disposable') },
                { main: coreIdentifier('isDisposable') },
                { main: coreIdentifier('DisposalError') },
                { main: coreIdentifier('DisposalErrorConstructor') },
                { main: coreIdentifier('DISPOSED') },
                { main: coreIdentifier('implDisposableMethods') },
            ],
        },
        {
            title: 'Event',
            exports: [
                {
                    main: coreIdentifier('Event'),
                    nested: [coreIdentifier('EventType')],
                },
                {
                    main: coreIdentifier('Push'),
                    nested: [coreIdentifier('PushType')],
                },
                {
                    main: coreIdentifier('Throw'),
                    nested: [coreIdentifier('ThrowType')],
                },
                {
                    main: coreIdentifier('End'),
                    nested: [coreIdentifier('EndType')],
                },
            ],
        },
        {
            title: 'Source',
            exports: [
                { main: coreIdentifier('Source') },
                { main: coreIdentifier('isSource') },
                { main: coreIdentifier('Sink') },
                { main: coreIdentifier('isSink') },
                { main: coreIdentifier('subscribe') },
                { main: coreIdentifier('all') },
                { main: coreIdentifier('animationFrames') },
                { main: coreIdentifier('combineSources') },
                { main: coreIdentifier('concatSources') },
                { main: coreIdentifier('empty') },
                { main: coreIdentifier('emptyScheduled') },
                { main: coreIdentifier('flatSources') },
                { main: coreIdentifier('fromArray') },
                { main: coreIdentifier('fromArrayScheduled') },
                { main: coreIdentifier('fromAsyncIterable') },
                { main: coreIdentifier('fromIterable') },
                { main: coreIdentifier('fromPromise') },
                { main: coreIdentifier('fromReactiveValue') },
                { main: coreIdentifier('fromScheduleFunction') },
                { main: coreIdentifier('fromSingularReactiveValue') },
                { main: coreIdentifier('iif') },
                { main: coreIdentifier('interval') },
                { main: coreIdentifier('isEqual') },
                { main: coreIdentifier('lazy') },
                { main: coreIdentifier('mergeSources') },
                { main: coreIdentifier('mergeSourcesConcurrent') },
                { main: coreIdentifier('never') },
                { main: coreIdentifier('of') },
                { main: coreIdentifier('ofEvent') },
                { main: coreIdentifier('ofEventScheduled') },
                { main: coreIdentifier('ofScheduled') },
                { main: coreIdentifier('raceSources') },
                { main: coreIdentifier('range') },
                { main: coreIdentifier('throwError') },
                { main: coreIdentifier('throwErrorScheduled') },
                { main: coreIdentifier('timer') },
                { main: coreIdentifier('zipSources') },
            ],
        },
        {
            title: 'Operator',
            exports: [
                { main: coreIdentifier('Operator') },
                { main: coreIdentifier('IdentityOperator') },
                { main: coreIdentifier('pipe') },
                { main: coreIdentifier('flow') },
                { main: coreIdentifier('at') },
                { main: coreIdentifier('catchError') },
                { main: coreIdentifier('collect') },
                { main: coreIdentifier('combineWith') },
                { main: coreIdentifier('concat') },
                { main: coreIdentifier('concatDrop') },
                { main: coreIdentifier('concatDropMap') },
                { main: coreIdentifier('concatMap') },
                { main: coreIdentifier('concatWith') },
                { main: coreIdentifier('count') },
                {
                    main: coreIdentifier('debounce'),
                    nested: [
                        coreIdentifier('DebounceConfig'),
                        coreIdentifier('defaultDebounceConfig'),
                        coreIdentifier('InitialDurationInfo'),
                        coreIdentifier('DebounceTrailingRestart'),
                    ],
                },
                { main: coreIdentifier('debounceMs') },
                { main: coreIdentifier('defaultIfEmpty') },
                { main: coreIdentifier('defaultIfEmptyTo') },
                { main: coreIdentifier('delay') },
                { main: coreIdentifier('delayMs') },
                { main: coreIdentifier('distinct') },
                { main: coreIdentifier('distinctFromLast') },
                { main: coreIdentifier('endWith') },
                { main: coreIdentifier('every') },
                { main: coreIdentifier('expandMap') },
                { main: coreIdentifier('filter') },
                { main: coreIdentifier('finalize') },
                { main: coreIdentifier('find') },
                { main: coreIdentifier('findIndex') },
                { main: coreIdentifier('findWithIndex') },
                { main: coreIdentifier('first') },
                { main: coreIdentifier('flat') },
                { main: coreIdentifier('flatMap') },
                { main: coreIdentifier('flatWith') },
                {
                    main: coreIdentifier('groupBy'),
                    nested: [
                        coreIdentifier('GroupSource'),
                        coreIdentifier('ActiveGroupSource'),
                        coreIdentifier('RemovedGroupSource'),
                    ],
                },
                { main: coreIdentifier('ignorePushEvents') },
                { main: coreIdentifier('isEmpty') },
                { main: coreIdentifier('isEqualTo') },
                { main: coreIdentifier('last') },
                { main: coreIdentifier('loop') },
                { main: coreIdentifier('map') },
                { main: coreIdentifier('mapEvents') },
                { main: coreIdentifier('mapPushEvents') },
                { main: coreIdentifier('mapTo') },
                { main: coreIdentifier('max') },
                { main: coreIdentifier('maxCompare') },
                { main: coreIdentifier('merge') },
                { main: coreIdentifier('mergeConcurrent') },
                { main: coreIdentifier('mergeMap') },
                { main: coreIdentifier('mergeWith') },
                { main: coreIdentifier('mergeWithConcurrent') },
                { main: coreIdentifier('min') },
                { main: coreIdentifier('minCompare') },
                { main: coreIdentifier('pluck') },
                { main: coreIdentifier('raceWith') },
                { main: coreIdentifier('reduce') },
                { main: coreIdentifier('repeat') },
                { main: coreIdentifier('repeatWhen') },
                { main: coreIdentifier('retry') },
                { main: coreIdentifier('retryAlways') },
                { main: coreIdentifier('sample') },
                { main: coreIdentifier('sampleMs') },
                { main: coreIdentifier('scan') },
                { main: coreIdentifier('schedulePushEvents') },
                { main: coreIdentifier('scheduleSubscription') },
                { main: coreIdentifier('share') },
                {
                    main: coreIdentifier('shareControlled'),
                    nested: [coreIdentifier('ControllableSource')],
                },
                { main: coreIdentifier('shareOnce') },
                { main: coreIdentifier('sharePersist') },
                { main: coreIdentifier('shareTransform') },
                { main: coreIdentifier('skip') },
                { main: coreIdentifier('skipLast') },
                { main: coreIdentifier('skipUntil') },
                { main: coreIdentifier('skipWhile') },
                { main: coreIdentifier('some') },
                { main: coreIdentifier('spyAfter') },
                { main: coreIdentifier('spyBefore') },
                { main: coreIdentifier('spyEndAfter') },
                { main: coreIdentifier('spyEndBefore') },
                { main: coreIdentifier('spyPushAfter') },
                { main: coreIdentifier('spyPushBefore') },
                { main: coreIdentifier('spyThrowAfter') },
                { main: coreIdentifier('spyThrowBefore') },
                { main: coreIdentifier('startWith') },
                { main: coreIdentifier('startWithSources') },
                { main: coreIdentifier('switchEach') },
                { main: coreIdentifier('switchMap') },
                { main: coreIdentifier('take') },
                { main: coreIdentifier('takeLast') },
                { main: coreIdentifier('takeUntil') },
                { main: coreIdentifier('takeWhile') },
                {
                    main: coreIdentifier('throttle'),
                    nested: [
                        coreIdentifier('ThrottleConfig'),
                        coreIdentifier('defaultThrottleConfig'),
                    ],
                },
                { main: coreIdentifier('throttleMs') },
                { main: coreIdentifier('throwIfEmpty') },
                { main: coreIdentifier('timeout') },
                { main: coreIdentifier('timeoutMs') },
                { main: coreIdentifier('unwrapFromWrappedPushEvents') },
                { main: coreIdentifier('windowControlled') },
                { main: coreIdentifier('windowCount') },
                { main: coreIdentifier('windowEach') },
                { main: coreIdentifier('windowEvery') },
                { main: coreIdentifier('windowTime') },
                { main: coreIdentifier('withLatestFrom') },
                { main: coreIdentifier('withLatestFromLazy') },
                { main: coreIdentifier('withPrevious') },
                {
                    main: coreIdentifier('withTime'),
                    nested: [coreIdentifier('WithTime')],
                },
                {
                    main: coreIdentifier('withTimeInterval'),
                    nested: [coreIdentifier('TimeInterval')],
                },
                { main: coreIdentifier('wrapInPushEvents') },
                { main: coreIdentifier('zipWith') },
            ],
        },
        {
            title: 'Subject',
            exports: [
                { main: coreIdentifier('Subject') },
                { main: coreIdentifier('isSubject') },
                {
                    main: coreIdentifier(
                        'SubjectDistributionSinkDisposalError',
                    ),
                },
                {
                    main: coreIdentifier(
                        'SubjectDistributionSinkDisposalErrorConstructor',
                    ),
                },
                { main: coreIdentifier('markAsSubject') },
                { main: coreIdentifier('CurrentValueSubject') },
                { main: coreIdentifier('FinalValueSubject') },
                {
                    main: coreIdentifier('ReplaySubject'),
                    nested: [coreIdentifier('ReplaySubjectTimeoutConfig')],
                },
                { main: coreIdentifier('SubjectBase') },
            ],
        },
        {
            title: 'Schedule Functions',
            exports: [
                { main: coreIdentifier('ScheduleFunction') },
                { main: coreIdentifier('ScheduleAnimationFrameQueued') },
                { main: coreIdentifier('ScheduleInterval') },
                { main: coreIdentifier('ScheduleQueued') },
                { main: coreIdentifier('ScheduleQueuedDiscrete') },
                { main: coreIdentifier('ScheduleSyncQueued') },
                { main: coreIdentifier('ScheduleTimeout') },
                { main: coreIdentifier('ScheduleTimeoutQueued') },
                { main: coreIdentifier('scheduleAnimationFrame') },
                { main: coreIdentifier('scheduleSync') },
            ],
        },
        {
            title: 'Utils',
            exports: [
                { main: coreIdentifier('setTimeout') },
                { main: coreIdentifier('setInterval') },
                { main: coreIdentifier('requestAnimationFrame') },
                { main: coreIdentifier('asyncReportError') },
                { main: coreIdentifier('TimeProvider') },
            ],
        },
        {
            title: 'Testing',
            exports: [
                { main: testingIdentifier('TestSource') },
                { main: testingIdentifier('SharedTestSource') },
                { main: testingIdentifier('TestSourceEvent') },
                { main: testingIdentifier('TestSubscriptionInfo') },
                { main: testingIdentifier('TestSourceSubscriptions') },
                { main: testingIdentifier('TestSchedule') },
                { main: testingIdentifier('watchSourceEvents') },
                { main: testingIdentifier('P') },
                { main: testingIdentifier('T') },
                { main: testingIdentifier('E') },
            ],
        },
    ];

    const apiPages = apiPagesGroupOutlines.map(
        ({ title, exports }) =>
            [
                `API - ${title}`,
                exports.map((export_) => ({
                    title: export_.main.exportName,
                    id: `api--${title.toLowerCase().split(/\W+/).join('-')}--${
                        export_.main.exportName
                    }`,
                    exportGroup: export_,
                })),
            ] as const,
    );

    for (const [, group] of apiPages) {
        for (const { id, exportGroup } of group) {
            mapExportIdentifierToPageId(exportGroup.main, id);
            if (exportGroup.nested) {
                for (const identifier of exportGroup.nested) {
                    mapExportIdentifierToPageId(identifier, id);
                }
            }
        }
    }

    const apiItemsByExportIdentifier = new Map<string, ApiItem[]>();

    function getApiItemsByExportIdentifierWithDefault(
        identifier: ExportIdentifier,
        defaultValue?: ApiItem[],
    ): ApiItem[] {
        const identifierKey = getUniqueExportIdentifierKey(identifier);
        const apiItems = apiItemsByExportIdentifier.get(identifierKey);
        if (!apiItems) {
            if (defaultValue) {
                apiItemsByExportIdentifier.set(identifierKey, defaultValue);
                return defaultValue;
            }
            throw new Error(
                `No api item set for export identifier ${identifierKey}`,
            );
        }
        return apiItems;
    }

    const exportIdentifierKeys = new Set<string>();

    for (const apiPackage of apiModel.members) {
        if (apiPackage.kind !== ApiItemKind.Package) {
            throw new UnsupportedApiItemError(
                apiPackage,
                'Expected to be a package.',
            );
        }

        const members = (apiPackage as ApiPackage).entryPoints[0].members;

        for (const apiItem of members) {
            const exportIdentifier = getApiItemIdentifier(apiItem);
            exportIdentifierKeys.add(
                getUniqueExportIdentifierKey(exportIdentifier),
            );
            const apiItems = getApiItemsByExportIdentifierWithDefault(
                exportIdentifier,
                [],
            );
            apiItems.push(apiItem);
        }
    }

    for (const exportIdentifier of exportIdentifierKeys) {
        if (!exportIdentifierKeyToPageId.has(exportIdentifier)) {
            throw new Error(`${exportIdentifier} not mapped.`);
        }
    }

    if (exportIdentifierKeys.size !== exportIdentifierKeyToPageId.size) {
        throw new Error('Not same number of names mapped');
    }

    function getApiItemsByExportIdentifier(
        identifier: ExportIdentifier,
    ): ApiItem[] {
        return getApiItemsByExportIdentifierWithDefault(identifier);
    }

    // eslint-disable-next-line max-len
    const getDynamicTextVariableReplacement = await getDynamicTextVariableReplacementP;
    const analyzeContext = AnalyzeContext({
        sourceMetadata,
        apiModel,
        getDynamicTextVariableReplacement,
        getPageIdFromExportIdentifier,
        getApiItemsByExportIdentifier,
    });

    const pages: Pages = apiPages.flatMap(([, group]) =>
        group.map(({ id, exportGroup }) =>
            buildApiPage({
                context: analyzeContext,
                pageId: id,
                pageExports: [exportGroup],
            }),
        ),
    );

    const pageIdToWebsitePath: Record<string, string> = Object.fromEntries(
        apiPages.flatMap(([, group]) =>
            group.map(({ title, id }) => [id, `api/${title}`]),
        ),
    );
    const pageIdToPageTitle: Record<string, string> = Object.fromEntries(
        apiPages.flatMap(([, group]) =>
            group.map(({ title, id }) => [id, title]),
        ),
    );
    const pageIdToMdPagePath: Record<string, string> = Object.fromEntries(
        apiPages.flatMap(([, group]) =>
            group.map(({ title, id }) => [id, `docs/${title}.md`]),
        ),
    );

    const docsSource = await buildDocsSourceDirectoryToApiPages();

    function mergeExpectUnique<V>(
        a: Record<string | number, V>,
        b: Record<string | number, V>,
    ): void {
        for (const [key, v] of Object.entries(b)) {
            if (key in a) {
                throw new Error(`Duplicate key ${key}`);
            }
            a[key] = v;
        }
    }

    pages.push(...docsSource.pages);
    mergeExpectUnique(pageIdToMdPagePath, docsSource.pageIdToMdPagePath);
    mergeExpectUnique(pageIdToPageTitle, docsSource.pageIdToPageTitle);
    mergeExpectUnique(pageIdToWebsitePath, docsSource.pageIdToWebsitePath);

    const pageGroups: PageGroup[] = [
        { title: 'Documentation', pageIds: ['core--introduction'] },
        ...apiPages.map(([title, group]) => ({
            title,
            pageIds: group.map(({ id }) => id),
        })),
    ];

    const allPageGroupIds = pageGroups.flatMap(
        (pageGroup) => pageGroup.pageIds,
    );

    const uniquePageIds = new Set();
    for (const pageId of allPageGroupIds) {
        if (pages.every((page) => page.pageId !== pageId)) {
            throw new Error(`No page id matching ${pageId}`);
        }
        if (uniquePageIds.has(pageId)) {
            throw new Error(`Duplicate page id ${pageId} in page group list`);
        }
        uniquePageIds.add(pageId);
    }

    if (allPageGroupIds.length !== pages.length) {
        throw new Error('order.length !== pages.length');
    }

    const docsDirectoryName = 'docs';
    const docsDir = path.join(rootDir, docsDirectoryName);
    const outFolder = Folder();

    function getPageTitleFromPageId(pageId: string): string {
        if (!(pageId in pageIdToPageTitle)) {
            throw new Error(`Unknown page id ${pageId}`);
        }
        return pageIdToPageTitle[pageId];
    }

    function getPageMarkdownPathFromPageId(pageId: string): string {
        if (!(pageId in pageIdToMdPagePath)) {
            throw new Error(`Unknown page id ${pageId}`);
        }
        const mdPath = pageIdToMdPagePath[pageId];
        if (!mdPath.startsWith(`${docsDirectoryName}/`)) {
            throw new Error(`${mdPath} is not in docs directory`);
        }

        const pageGroupIndex = pageGroups.findIndex(
            (pageGroup) => pageGroup.pageIds.indexOf(pageId) !== -1,
        );
        const inPageGroupIndex = pageGroups[pageGroupIndex].pageIds.indexOf(
            pageId,
        );
        const pageGroupPrefix = `${pageGroupIndex}`.padStart(
            Math.max((pageGroups.length - 1).toString().length, 2),
            '0',
        );
        const inPageGroupPrefix = `${inPageGroupIndex}`.padStart(
            Math.max(
                (pageGroups[pageGroupIndex].pageIds.length - 1).toString()
                    .length,
                2,
            ),
            '0',
        );

        const insideDocsPath = mdPath.slice(docsDirectoryName.length + 1);
        return `${docsDirectoryName}/${pageGroupPrefix}-${pageGroups[
            pageGroupIndex
        ].title
            .toLowerCase()
            .split(/\W+/)
            .join('-')}/${inPageGroupPrefix}-${insideDocsPath}`;
    }

    enum FooterCellRole {
        Previous,
        Next,
    }

    function createFooterCell(
        role: FooterCellRole,
        pageOrderIndex: number,
    ): DeepCoreNode | undefined {
        const description = FooterCellRole[role];
        let toPageId: string;
        if (role === FooterCellRole.Previous) {
            if (pageOrderIndex === 0) {
                return;
            }
            toPageId = allPageGroupIds[pageOrderIndex - 1];
        } else {
            if (pageOrderIndex === allPageGroupIds.length - 1) {
                return;
            }
            toPageId = allPageGroupIds[pageOrderIndex + 1];
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const toPageTitle = pageIdToPageTitle[toPageId];
        return DocPageLinkNode({
            pageId: toPageId,
            children: [
                PlainTextNode({
                    text: `${description} (${toPageTitle})`,
                }),
            ],
        });
    }

    for (let page of pages) {
        collapseDeepCoreNodeWhitespace(page);
        const mdPath = getPageMarkdownPathFromPageId(page.pageId);
        const pageOrderIndex = allPageGroupIds.indexOf(page.pageId);
        const previousCell = createFooterCell(
            FooterCellRole.Previous,
            pageOrderIndex,
        );
        const nextCell = createFooterCell(FooterCellRole.Next, pageOrderIndex);
        const previousTable =
            previousCell &&
            TableNode<DeepCoreNode, DeepCoreNode>({
                header: TableRow({
                    children: [previousCell],
                }),
            });
        const nextTable =
            nextCell &&
            HtmlElementNode({
                tagName: 'div',
                attributes: {
                    align: 'right',
                },
                children: [
                    TableNode<DeepCoreNode, DeepCoreNode>({
                        header: TableRow({
                            children: [nextCell],
                        }),
                    }),
                ],
            });
        if (previousTable || nextTable) {
            const children: DeepCoreNode[] = [
                ...page.children,
                LineBreakNode({}),
            ];
            if (previousTable) {
                children.push(previousTable);
            }
            if (nextTable) {
                children.push(nextTable);
            }
            page = PageNode<DeepCoreNode>({
                pageId: page.pageId,
                tableOfContents: page.tableOfContents,
                children,
            });
        }
        addFileToFolder(
            outFolder,
            mdPath,
            renderDeepRenderMarkdownNodeAsMarkdown(page, {
                pageId: page.pageId,
                getPagePathFromPageId: getPageMarkdownPathFromPageId,
                getPageTitleFromPageId,
            }),
        );
    }

    const limitTokenization = pLimit(25);

    await Promise.all(
        pages.map((page) => {
            const promises: Promise<unknown>[] = [];
            walkDeepCoreNode(page, (node) => {
                if (node.type !== CoreNodeType.CodeBlock) {
                    return;
                }
                if (node.language !== 'ts') {
                    console.log('unknown language', node.language);
                    return;
                }
                if (!node.code) {
                    return;
                }
                const { code } = node;
                const encodedTokenizedLinesMap: EncodedTokenizedLinesMap =
                    node.tokenizedLinesMap ||
                    (node.tokenizedLinesMap = {} as Record<
                        Theme,
                        EncodedTokenizedLines
                    >);
                const prefixText =
                    node[$HACK_SYMBOL]?.syntaxHighlightingPrefix || '';
                const suffixText =
                    node[$HACK_SYMBOL]?.syntaxHighlightingSuffix || '';
                async function mapTheme(theme: Theme): Promise<void> {
                    const tokenizedLines = await limitTokenization(() =>
                        tokenizeText(
                            prefixText + code + suffixText,
                            TokenizeLanguage.TypeScript,
                            theme,
                        ),
                    );
                    if (suffixText) {
                        const lastLine =
                            tokenizedLines.lines[
                                tokenizedLines.lines.length - 1
                            ];
                        for (let i = lastLine.tokens.length - 1; i >= 0; i--) {
                            const token = lastLine.tokens[i];
                            const distanceFromEnd =
                                lastLine.endIndex -
                                (lastLine.startIndex + token.startIndex);
                            if (distanceFromEnd >= suffixText.length) {
                                break;
                            }
                            lastLine.tokens.pop();
                        }
                        lastLine.endIndex -= suffixText.length;
                    }
                    if (prefixText) {
                        const firstLine = tokenizedLines.lines[0];
                        while (firstLine.tokens.length > 1) {
                            if (
                                firstLine.tokens[1].startIndex >
                                prefixText.length
                            ) {
                                break;
                            }
                            firstLine.tokens.shift();
                        }
                        firstLine.tokens[0].startIndex = 0;
                        for (const token_1 of firstLine.tokens.slice(1)) {
                            token_1.startIndex -= prefixText.length;
                        }
                        firstLine.endIndex -= prefixText.length;
                        for (const line of tokenizedLines.lines.slice(1)) {
                            line.startIndex -= prefixText.length;
                            line.endIndex -= prefixText.length;
                        }
                    }
                    encodedTokenizedLinesMap[theme] = encodeTokenizedLines(
                        tokenizedLines,
                    );
                }
                promises.push(mapTheme(ThemeLight), mapTheme(ThemeDark));
            });
            return Promise.all(promises);
        }),
    );

    const pagesMetadata: PagesMetadata = {
        pageIdToWebsitePath,
        pageIdToPageTitle,
        pageGroups,
        codeBlockStyleMap,
        github:
            process.env.VERCEL_GITHUB_DEPLOYMENT === '1'
                ? {
                      // eslint-disable-next-line max-len
                      /* eslint-disable @typescript-eslint/no-non-null-assertion */
                      org: process.env.VERCEL_GITHUB_COMMIT_ORG!,
                      repo: process.env.VERCEL_GITHUB_COMMIT_REPO!,
                      ref: process.env.VERCEL_GITHUB_COMMIT_REF!,
                      sha: process.env.VERCEL_GITHUB_COMMIT_SHA!,
                      // eslint-disable-next-line max-len
                      /* eslint-enable @typescript-eslint/no-non-null-assertion */
                  }
                : null,
    };
    const pagesStringified = JSON.stringify(pages);
    const pagesMetadataStringified = JSON.stringify(pagesMetadata);
    const pagesHash = computeFileHash(pagesStringified);

    addFileToFolder(
        outFolder,
        `www/vercel-public/pages.${pagesHash}.json`,
        pagesStringified,
    );
    addFileToFolder(outFolder, 'www/temp/pages.json', pagesStringified);
    addFileToFolder(outFolder, 'www/temp/pagesHash', pagesHash);
    addFileToFolder(
        outFolder,
        'www/temp/pagesMetadata.json',
        pagesMetadataStringified,
    );

    await Promise.all([
        fs.remove(docsDir),
        rimrafP('vercel-public/pages.*.json'),
    ]);
    await writeFolderToDirectoryPath(outFolder, rootDir);
}

main().catch((error) => {
    console.error('error making docs...');
    exit(error);
});

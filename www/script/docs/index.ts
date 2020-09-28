import * as crypto from 'crypto';
import * as path from 'path';
import {
    ApiModel,
    ApiItem,
    ApiItemKind,
    ApiPackage,
} from '@microsoft/api-extractor-model';
import * as fs from 'fs-extra';
import * as rimraf from 'rimraf';
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
import { renderDeepRenderMarkdownNodeAsMarkdown } from './core/render/markdown';
import { buildDocsSourceDirectoryToApiPages } from './docsSource';
import { getDynamicTextVariableReplacementP } from './getDynamicTextVariableReplacement';
import {
    Pages,
    PagesMetadata,
    PagesWithMetadata,
    PageIdToWebsitePath,
} from './types';
import {
    addFileToFolder,
    Folder,
    writeFolderToDirectoryPath,
} from './util/Folder';
import { globAbsolute } from './util/glob';
import { createProgram } from './util/ts';

async function main() {
    const sourceFilePaths = await globAbsolute('packages/*/src/**');
    const program = createProgram(sourceFilePaths);

    const packages = fs.readdirSync(path.join(rootDir, 'packages'));
    const packageNameToExportFilePath = new Map<string, string>(
        packages.map((packageName) => [
            `@awaken/${packageName}`,
            `packages/${packageName}/src/index.ts`,
        ]),
    );
    const sourceMetadata = generateSourceMetadata(
        program,
        packageNameToExportFilePath,
    );

    const apiModel = new ApiModel();
    const apiModelFilePaths = await globAbsolute('temp/*.api.json');

    for (const apiModelFilePath of apiModelFilePaths) {
        apiModel.loadPackage(apiModelFilePath);
    }

    const coreApiBasicsId = 'core--api--basics';
    const coreApiSourcesId = 'core--api--sources';
    const coreApiOperatorsId = 'core--api--operators';
    const coreApiSubjectsId = 'core--api--subjects';
    const coreApiScheduleFunctionsId = 'core--api--schedule-functions';
    const coreApiUtilsId = 'core--api--utils';
    const testingApiId = 'testing--api';

    function coreIdentifier(exportName: string): ExportIdentifier {
        return {
            packageName: '@awaken/core',
            exportName,
        };
    }

    function testingIdentifier(exportName: string): ExportIdentifier {
        return {
            packageName: '@awaken/testing',
            exportName,
        };
    }

    const coreBasicsExports: PageExports = [
        {
            main: coreIdentifier('Disposable'),
            nested: [
                coreIdentifier('isDisposable'),
                coreIdentifier('DisposalError'),
                coreIdentifier('DisposalErrorConstructor'),
                coreIdentifier('DISPOSED'),
                coreIdentifier('implDisposableMethods'),
            ],
        },
        {
            main: coreIdentifier('Event'),
            nested: [
                coreIdentifier('EventType'),
                coreIdentifier('Push'),
                coreIdentifier('PushType'),
                coreIdentifier('Throw'),
                coreIdentifier('ThrowType'),
                coreIdentifier('End'),
                coreIdentifier('EndType'),
            ],
        },
        { main: coreIdentifier('Sink'), nested: [coreIdentifier('isSink')] },
        {
            main: coreIdentifier('Source'),
            nested: [coreIdentifier('isSource'), coreIdentifier('subscribe')],
        },
        {
            main: coreIdentifier('Operator'),
            nested: [
                coreIdentifier('IdentityOperator'),
                coreIdentifier('pipe'),
                coreIdentifier('flow'),
            ],
        },
        {
            main: coreIdentifier('Subject'),
            nested: [
                coreIdentifier('isSubject'),
                coreIdentifier('SubjectDistributionSinkDisposalError'),
                coreIdentifier(
                    'SubjectDistributionSinkDisposalErrorConstructor',
                ),
                coreIdentifier('markAsSubject'),
            ],
        },
        { main: coreIdentifier('ScheduleFunction') },
    ];

    const coreSourcesExports: PageExports = [
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
    ];

    const coreOperatorsExports: PageExports = [
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
    ];

    const coreSubjectsExports: PageExports = [
        { main: coreIdentifier('CurrentValueSubject') },
        { main: coreIdentifier('FinalValueSubject') },
        {
            main: coreIdentifier('ReplaySubject'),
            nested: [coreIdentifier('ReplaySubjectTimeoutConfig')],
        },
        { main: coreIdentifier('SubjectBase') },
    ];

    const coreScheduleFunctionsExports: PageExports = [
        { main: coreIdentifier('ScheduleAnimationFrameQueued') },
        { main: coreIdentifier('ScheduleInterval') },
        { main: coreIdentifier('ScheduleQueued') },
        { main: coreIdentifier('ScheduleQueuedDiscrete') },
        { main: coreIdentifier('ScheduleSyncQueued') },
        { main: coreIdentifier('ScheduleTimeout') },
        { main: coreIdentifier('ScheduleTimeoutQueued') },
        { main: coreIdentifier('scheduleAnimationFrame') },
        { main: coreIdentifier('scheduleSync') },
    ];

    const coreUtilsExports: PageExports = [
        { main: coreIdentifier('setTimeout') },
        { main: coreIdentifier('setInterval') },
        { main: coreIdentifier('requestAnimationFrame') },
        { main: coreIdentifier('asyncReportError') },
        { main: coreIdentifier('TimeProvider') },
    ];

    const testingExports: PageExports = [
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
    ];

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

    const exportsWithIds = [
        [coreBasicsExports, coreApiBasicsId],
        [coreSourcesExports, coreApiSourcesId],
        [coreOperatorsExports, coreApiOperatorsId],
        [coreSubjectsExports, coreApiSubjectsId],
        [coreScheduleFunctionsExports, coreApiScheduleFunctionsId],
        [coreUtilsExports, coreApiUtilsId],
        [testingExports, testingApiId],
    ] as const;

    for (const [exports, id] of exportsWithIds) {
        for (const exportGroup of exports) {
            mapExportIdentifierToPageId(exportGroup.main, id);
            if ('nested' in exportGroup && exportGroup.nested !== undefined) {
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

    const pages: Pages = [
        buildApiPage({
            context: analyzeContext,
            pageId: coreApiBasicsId,
            pageTitle: 'API Reference - Basics',
            pageExports: coreBasicsExports,
        }),
        buildApiPage({
            context: analyzeContext,
            pageId: coreApiSourcesId,
            pageTitle: 'API Reference - Sources',
            pageExports: coreSourcesExports,
        }),
        buildApiPage({
            context: analyzeContext,
            pageId: coreApiOperatorsId,
            pageTitle: 'API Reference - Operators',
            pageExports: coreOperatorsExports,
        }),
        buildApiPage({
            context: analyzeContext,
            pageId: coreApiSubjectsId,
            pageTitle: 'API Reference - Subjects',
            pageExports: coreSubjectsExports,
        }),
        buildApiPage({
            context: analyzeContext,
            pageId: coreApiScheduleFunctionsId,
            pageTitle: 'API Reference - Schedule Functions',
            pageExports: coreScheduleFunctionsExports,
        }),
        buildApiPage({
            context: analyzeContext,
            pageId: coreApiUtilsId,
            pageTitle: 'API Reference - Utils',
            pageExports: coreUtilsExports,
        }),
        buildApiPage({
            context: analyzeContext,
            pageId: testingApiId,
            pageTitle: 'API Reference - Testing',
            pageExports: testingExports,
        }),
    ];

    const pageIdToWebsitePath: PageIdToWebsitePath = {
        [coreApiBasicsId]: 'docs/api-basics',
        [coreApiSourcesId]: 'docs/api-sources',
        [coreApiOperatorsId]: 'docs/api-operators',
        [coreApiSubjectsId]: 'docs/api-subjects',
        [coreApiScheduleFunctionsId]: 'docs/api-schedule-functions',
        [coreApiUtilsId]: 'docs/api-utils',
        [testingApiId]: 'docs/api-testing',
    };
    const pageIdToMdPagePath: Record<string, string> = Object.fromEntries(
        Object.entries(pageIdToWebsitePath).map(([pageId, websitePath]) => [
            pageId,
            `${websitePath}.md`,
        ]),
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
    mergeExpectUnique(pageIdToWebsitePath, docsSource.pageIdToWebsitePath);

    const order = [
        'core--introduction',
        'test',
        ...exportsWithIds.map(([, id]) => id),
    ];

    const uniquePageIds = new Set();
    for (const pageId of order) {
        if (pages.every((page) => page.pageId !== pageId)) {
            throw new Error(`No page id matching ${pageId}`);
        }
        if (uniquePageIds.has(pageId)) {
            throw new Error(`Duplicate page id ${pageId} in page order list`);
        }
        uniquePageIds.add(pageId);
    }

    if (order.length !== pages.length) {
        throw new Error('order.length !== pages.length');
    }

    const docsDirectoryName = 'docs';
    const docsDir = path.join(rootDir, docsDirectoryName);
    const outFolder = Folder();

    function getPageMarkdownPathFromPageId(pageId: string): string {
        if (!(pageId in pageIdToMdPagePath)) {
            throw new Error(`Unknown page id ${pageId}`);
        }
        return pageIdToWebsitePath[pageId];
    }

    for (const page of pages) {
        const mdPath = pageIdToMdPagePath[page.pageId];
        if (!mdPath.startsWith(`${docsDirectoryName}/`)) {
            throw new Error(`${mdPath} is not in docs directory`);
        }
        addFileToFolder(
            outFolder,
            mdPath,
            renderDeepRenderMarkdownNodeAsMarkdown(page, {
                pageId: page.pageId,
                getPagePathFromPageId: getPageMarkdownPathFromPageId,
            }),
        );
    }

    const pagesMetadata: PagesMetadata = {
        order,
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
    const pagesWithMetadata: PagesWithMetadata = {
        metadata: pagesMetadata,
        pages,
    };
    const pagesWithMetadataStringified = JSON.stringify(pagesWithMetadata);
    // Why eight hex characters chosen to represent the hash? Because parcel
    // does it too.
    // eslint-disable-next-line max-len
    // How good are eight hex characters? Well, according to https://everydayinternetstuff.com/2015/04/hash-collision-probability-calculator/,
    // these are the probabilities of collision given `n` hashes
    // | number of hashes | probability of collision |
    // | ---------------- | ------------------------ |
    // | 5000             | 0.0029055716014250166    |
    // | 10000            | 0.01157288105708909      |
    // | 20000            | 0.04549633911131801      |
    // | 40000            | 0.16994213048124074      |
    // | 80000            | 0.5252888411157739       |
    // | 160000           | 0.9492180149513215       |
    const pagesWithMetadataHash = crypto
        .createHash('md5')
        .update(pagesWithMetadataStringified)
        .digest('hex')
        .slice(-8);

    addFileToFolder(
        outFolder,
        `www/_files/public/pages.${pagesWithMetadataHash}.json`,
        pagesWithMetadataStringified,
    );
    addFileToFolder(
        outFolder,
        'www/temp/pages.json',
        pagesWithMetadataStringified,
    );
    addFileToFolder(outFolder, 'www/temp/pagesHash', pagesWithMetadataHash);
    addFileToFolder(
        outFolder,
        'www/temp/pageIdToWebsitePath.json',
        JSON.stringify(pageIdToWebsitePath),
    );

    fs.removeSync(docsDir);
    rimraf.sync('_files/public/pages.*.json');

    await writeFolderToDirectoryPath(outFolder, rootDir);
}

main().catch((error) => {
    console.error('error making docs...');
    console.log(error);
    exit();
});

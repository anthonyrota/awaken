import * as crypto from 'crypto';
import * as path from 'path';
import { ApiModel } from '@microsoft/api-extractor-model';
import * as fs from 'fs-extra';
import { buildApiPageMap } from './analyze/build/buildApiPageMap';
import { buildApiPageMapToFolder } from './analyze/build/buildApiPageMapToFolder';
import { AnalyzeContext, APIPackageData } from './analyze/Context';
import {
    ExportIdentifier,
    getUniqueExportIdentifierKey,
} from './analyze/Identifier';
import { generateSourceMetadata } from './analyze/sourceMetadata';
import { rootDir } from './rootDir';
import {
    PageNodeMap,
    PageNodeMapWithMetadata,
    PageNodeMapMetadata,
} from './types';
import {
    addFileToFolder,
    Folder,
    getNestedFolderAtPath,
    writeFolderToDirectoryPath,
} from './util/Folder';
import { globAbsolute } from './util/glob';
import { createProgram } from './util/ts';

const packageScope = '@awaken';
const packageDataList: APIPackageData[] = [
    {
        packageDirectory: 'core',
        packageName: `${packageScope}/core`,
        pages: [
            {
                pageDirectory: 'basics',
                pageTitle: 'API Reference - Basics',
                items: [
                    {
                        main: 'Disposable',
                        nested: [
                            'isDisposable',
                            'DisposalError',
                            'DisposalErrorConstructor',
                            'DISPOSED',
                            'implDisposableMethods',
                        ],
                    },
                    {
                        main: 'Event',
                        nested: [
                            'EventType',
                            'Push',
                            'PushType',
                            'Throw',
                            'ThrowType',
                            'End',
                            'EndType',
                        ],
                    },
                    { main: 'Sink', nested: ['isSink'] },
                    { main: 'Source', nested: ['isSource', 'subscribe'] },
                    {
                        main: 'Operator',
                        nested: ['IdentityOperator', 'pipe', 'flow'],
                    },
                    {
                        main: 'Subject',
                        nested: [
                            'isSubject',
                            'SubjectDistributionSinkDisposalError',
                            'SubjectDistributionSinkDisposalErrorConstructor',
                            'markAsSubject',
                        ],
                    },
                    { main: 'ScheduleFunction' },
                ],
            },
            {
                pageDirectory: 'sources',
                pageTitle: 'API Reference - Sources',
                items: [
                    { main: 'all' },
                    { main: 'animationFrames' },
                    { main: 'combineSources' },
                    { main: 'concatSources' },
                    { main: 'empty' },
                    { main: 'emptyScheduled' },
                    { main: 'flatSources' },
                    { main: 'fromArray' },
                    { main: 'fromArrayScheduled' },
                    { main: 'fromAsyncIterable' },
                    { main: 'fromIterable' },
                    { main: 'fromPromise' },
                    { main: 'fromReactiveValue' },
                    { main: 'fromScheduleFunction' },
                    { main: 'fromSingularReactiveValue' },
                    { main: 'iif' },
                    { main: 'interval' },
                    { main: 'isEqual' },
                    { main: 'lazy' },
                    { main: 'mergeSources' },
                    { main: 'mergeSourcesConcurrent' },
                    { main: 'never' },
                    { main: 'of' },
                    { main: 'ofEvent' },
                    { main: 'ofEventScheduled' },
                    { main: 'ofScheduled' },
                    { main: 'raceSources' },
                    { main: 'range' },
                    { main: 'throwError' },
                    { main: 'throwErrorScheduled' },
                    { main: 'timer' },
                    { main: 'zipSources' },
                ],
            },
            {
                pageDirectory: 'operators',
                pageTitle: 'API Reference - Operators',
                items: [
                    { main: 'at' },
                    { main: 'catchError' },
                    { main: 'collect' },
                    { main: 'combineWith' },
                    { main: 'concat' },
                    { main: 'concatDrop' },
                    { main: 'concatDropMap' },
                    { main: 'concatMap' },
                    { main: 'concatWith' },
                    { main: 'count' },
                    {
                        main: 'debounce',
                        nested: [
                            'DebounceConfig',
                            'defaultDebounceConfig',
                            'InitialDurationInfo',
                            'DebounceTrailingRestart',
                        ],
                    },
                    { main: 'debounceMs' },
                    { main: 'defaultIfEmpty' },
                    { main: 'defaultIfEmptyTo' },
                    { main: 'delay' },
                    { main: 'delayMs' },
                    { main: 'distinct' },
                    { main: 'distinctFromLast' },
                    { main: 'endWith' },
                    { main: 'every' },
                    { main: 'expandMap' },
                    { main: 'filter' },
                    { main: 'finalize' },
                    { main: 'find' },
                    { main: 'findIndex' },
                    { main: 'findWithIndex' },
                    { main: 'first' },
                    { main: 'flat' },
                    { main: 'flatMap' },
                    { main: 'flatWith' },
                    {
                        main: 'groupBy',
                        nested: [
                            'GroupSource',
                            'ActiveGroupSource',
                            'RemovedGroupSource',
                        ],
                    },
                    { main: 'ignorePushEvents' },
                    { main: 'isEmpty' },
                    { main: 'isEqualTo' },
                    { main: 'last' },
                    { main: 'loop' },
                    { main: 'map' },
                    { main: 'mapEvents' },
                    { main: 'mapPushEvents' },
                    { main: 'mapTo' },
                    { main: 'max' },
                    { main: 'maxCompare' },
                    { main: 'merge' },
                    { main: 'mergeConcurrent' },
                    { main: 'mergeMap' },
                    { main: 'mergeWith' },
                    { main: 'mergeWithConcurrent' },
                    { main: 'min' },
                    { main: 'minCompare' },
                    { main: 'pluck' },
                    { main: 'raceWith' },
                    { main: 'reduce' },
                    { main: 'repeat' },
                    { main: 'repeatWhen' },
                    { main: 'retry' },
                    { main: 'retryAlways' },
                    { main: 'sample' },
                    { main: 'sampleMs' },
                    { main: 'scan' },
                    { main: 'schedulePushEvents' },
                    { main: 'scheduleSubscription' },
                    { main: 'share' },
                    {
                        main: 'shareControlled',
                        nested: ['ControllableSource'],
                    },
                    { main: 'shareOnce' },
                    { main: 'sharePersist' },
                    { main: 'shareTransform' },
                    { main: 'skip' },
                    { main: 'skipLast' },
                    { main: 'skipUntil' },
                    { main: 'skipWhile' },
                    { main: 'some' },
                    { main: 'spyAfter' },
                    { main: 'spyBefore' },
                    { main: 'spyEndAfter' },
                    { main: 'spyEndBefore' },
                    { main: 'spyPushAfter' },
                    { main: 'spyPushBefore' },
                    { main: 'spyThrowAfter' },
                    { main: 'spyThrowBefore' },
                    { main: 'startWith' },
                    { main: 'startWithSources' },
                    { main: 'switchEach' },
                    { main: 'switchMap' },
                    { main: 'take' },
                    { main: 'takeLast' },
                    { main: 'takeUntil' },
                    { main: 'takeWhile' },
                    {
                        main: 'throttle',
                        nested: ['ThrottleConfig', 'defaultThrottleConfig'],
                    },
                    { main: 'throttleMs' },
                    { main: 'throwIfEmpty' },
                    { main: 'timeout' },
                    { main: 'timeoutMs' },
                    { main: 'unwrapFromWrappedPushEvents' },
                    { main: 'windowControlled' },
                    { main: 'windowCount' },
                    { main: 'windowEach' },
                    { main: 'windowEvery' },
                    { main: 'windowTime' },
                    { main: 'withLatestFrom' },
                    { main: 'withLatestFromLazy' },
                    { main: 'withPrevious' },
                    { main: 'withTime', nested: ['WithTime'] },
                    { main: 'withTimeInterval', nested: ['TimeInterval'] },
                    { main: 'wrapInPushEvents' },
                    { main: 'zipWith' },
                ],
            },
            {
                pageDirectory: 'subjects',
                pageTitle: 'API Reference - Subjects',
                items: [
                    { main: 'CurrentValueSubject' },
                    { main: 'FinalValueSubject' },
                    {
                        main: 'ReplaySubject',
                        nested: ['ReplaySubjectTimeoutConfig'],
                    },
                    { main: 'SubjectBase' },
                ],
            },
            {
                pageDirectory: 'schedule-functions',
                pageTitle: 'API Reference - Schedule Functions',
                items: [
                    { main: 'ScheduleAnimationFrameQueued' },
                    { main: 'ScheduleInterval' },
                    { main: 'ScheduleQueued' },
                    { main: 'ScheduleQueuedDiscrete' },
                    { main: 'ScheduleSyncQueued' },
                    { main: 'ScheduleTimeout' },
                    { main: 'ScheduleTimeoutQueued' },
                    { main: 'scheduleAnimationFrame' },
                    { main: 'scheduleSync' },
                ],
            },
            {
                pageDirectory: 'util',
                pageTitle: 'API Reference - Utils',
                items: [
                    { main: 'setTimeout' },
                    { main: 'setInterval' },
                    { main: 'requestAnimationFrame' },
                    { main: 'asyncReportError' },
                    { main: 'TimeProvider' },
                ],
            },
        ],
    },
    {
        packageDirectory: 'testing',
        packageName: `${packageScope}/testing`,
        pages: [
            {
                pageDirectory: '_index',
                pageTitle: 'API Reference',
                items: [
                    { main: 'TestSource' },
                    { main: 'SharedTestSource' },
                    { main: 'TestSourceEvent' },
                    { main: 'TestSubscriptionInfo' },
                    { main: 'TestSourceSubscriptions' },
                    { main: 'TestSchedule' },
                    { main: 'watchSourceEvents' },
                    { main: 'P' },
                    { main: 'T' },
                    { main: 'E' },
                ],
            },
        ],
    },
];

const packageIdentifierToPathMap = new Map<string, string>();

for (const packageData of packageDataList) {
    for (const page of packageData.pages) {
        const path = `${packageData.packageDirectory}/${page.pageDirectory}`;
        for (const item of page.items) {
            registerIdentifier(
                {
                    packageName: packageData.packageName,
                    exportName: item.main,
                },
                path,
            );
            item.nested?.forEach((name) => {
                registerIdentifier(
                    {
                        packageName: packageData.packageName,
                        exportName: name,
                    },
                    path,
                );
            });
        }
    }
}

function registerIdentifier(identifier: ExportIdentifier, path: string): void {
    const identifierKey = getUniqueExportIdentifierKey(identifier);
    if (identifierKey in packageIdentifierToPathMap) {
        throw new Error(`Duplicate name: ${identifierKey}`);
    }
    packageIdentifierToPathMap.set(identifierKey, path);
}

function getPathOfExportIdentifier(identifier: ExportIdentifier): string {
    const identifierKey = getUniqueExportIdentifierKey(identifier);
    const path = packageIdentifierToPathMap.get(identifierKey);
    if (path === undefined) {
        throw new Error(`${identifierKey} has no path.`);
    }
    return path;
}

const sourceFilePaths = globAbsolute('packages/*/src/**');
const program = createProgram(sourceFilePaths);

const packages = fs.readdirSync(path.join(rootDir, 'packages'));
const packageNameToExportFilePath = new Map<string, string>(
    packages.map((packageName) => [
        `${packageScope}/${packageName}`,
        `packages/${packageName}/src/index.ts`,
    ]),
);
const sourceMetadata = generateSourceMetadata(
    program,
    packageNameToExportFilePath,
);

const apiModel = new ApiModel();
const apiModelFilePaths = globAbsolute('temp/*.api.json');

for (const apiModelFilePath of apiModelFilePaths) {
    apiModel.loadPackage(apiModelFilePath);
}

const context = AnalyzeContext({
    sourceMetadata,
    apiModel,
    packageScope,
    outDir: 'docs/api',
    getPathOfExportIdentifier,
    packageDataList,
    packageIdentifierToPathMap,
});
const pageMap = buildApiPageMap(context);
const outDirAbsolute = path.join(rootDir, ...context.outDir.split('/'));

fs.removeSync(outDirAbsolute);

const renderedApiFolder = buildApiPageMapToFolder({ pageMap, context });

const outFolder = Folder();

// eslint-disable-next-line max-len
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
const pageNodeMap: PageNodeMap = Object.fromEntries(pageMap.entries());
const pageNodeMapStringified = JSON.stringify(pageNodeMap);
const hash = crypto
    .createHash('md5')
    .update(pageNodeMapStringified)
    .digest('hex');
const pageNodeMapMetadata: PageNodeMapMetadata = { hash, version: 1 };
const pageNodeMapWithMetadata: PageNodeMapWithMetadata = {
    metadata: pageNodeMapMetadata,
    pageNodeMap,
};

const apiDocFolder = getNestedFolderAtPath(outFolder, 'www/_files/api-doc');
addFileToFolder(
    apiDocFolder,
    'page-node-map-metadata.json',
    JSON.stringify(pageNodeMapMetadata),
);
addFileToFolder(
    apiDocFolder,
    'page-node-map-with-metadata.json',
    JSON.stringify(pageNodeMapWithMetadata),
);

const outApiFolder = getNestedFolderAtPath(outFolder, context.outDir);
for (const [path, fileOrFolder] of renderedApiFolder) {
    outApiFolder.set(path, fileOrFolder);
}

writeFolderToDirectoryPath(outFolder, rootDir).catch((error) => {
    console.error('error writing pages to out directory...');
    throw error;
});

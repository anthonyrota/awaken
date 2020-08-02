function nullObj<T>(obj: T): T {
    // eslint-disable-next-line @typescript-eslint/ban-types
    return Object.assign(Object.create(null) as {}, obj);
}

interface APIPageDataItem {
    main: string;
    nested?: string[];
}

export interface APIPageData {
    title: string;
    items: APIPageDataItem[];
}

const mainPaths: Record<string, APIPageData> = nullObj({
    'core/operators': {
        title: 'API Reference - Operators',
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
                    'groupBy',
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
            { main: 'shareControlled', nested: ['ControllableSource'] },
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
    'core/schedule-functions': {
        title: 'API Reference - Schedule Functions',
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
    'core/sources': {
        title: 'API Reference - Sources',
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
    'core/subjects': {
        title: 'API Reference - Subjects',
        items: [
            { main: 'CurrentValueSubject' },
            { main: 'FinalValueSubject' },
            { main: 'ReplaySubject' },
            { main: 'ReplaySubjectTimeoutConfig' },
            { main: 'SubjectBase' },
        ],
    },
    'core/util': {
        title: 'API Reference - Utils',
        items: [
            { main: 'pipe' },
            { main: 'flow' },
            { main: 'setTimeout' },
            { main: 'setInterval' },
            { main: 'requestAnimationFrame' },
            { main: 'asyncReportError' },
            { main: 'TimeProvider' },
        ],
    },
    'core/_index': {
        title: 'API Reference - Basics',
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
            { main: 'Operator', nested: ['IdentityOperator', 'pipe', 'flow'] },
            {
                main: 'Subject',
                nested: [
                    'isSubject',
                    'SubjectDistributionSinkDisposalError',
                    'SubjectDistributionSinkDisposalErrorConstructor',
                    'markAsSubject',
                    'NonMarkedSubject',
                ],
            },
            { main: 'ScheduleFunction' },
        ],
    },
    'testing/_index': {
        title: 'API Reference',
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
});

const nameToPath: Record<string, string> = {};
const mainPathEntries = Object.entries(mainPaths);
for (const [pathName, page] of mainPathEntries) {
    for (const item of page.items) {
        nameToPath[item.main] = pathName;
        if (item.nested) {
            for (const name of item.nested) {
                nameToPath[name] = pathName;
            }
        }
    }
}

export function forEachPage(
    callback: (pathName: string, page: APIPageData) => void,
): void {
    for (const [pathName, page] of mainPathEntries) {
        callback(pathName, page);
    }
}

export function getMainPathOfApiItemName(apiItemName: string): string {
    if (!(apiItemName in nameToPath)) {
        throw new Error(`${apiItemName} has no path.`);
    }
    return nameToPath[apiItemName];
}

export function assertMappedApiItemNames(names: Iterable<string>): void {
    let len = 0;

    for (const name of names) {
        if (!(name in nameToPath)) {
            throw new Error(`${name} not mapped.`);
        }
        len++;
    }

    if (len !== Object.keys(nameToPath).length) {
        throw new Error('Not same number of names mapped.');
    }
}

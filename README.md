# Awaken

A fast and extremely lightweight reactive programming library for Typescript, inspired by [callbags](https://github.com/callbag/callbag) and [RxJS](https://github.com/ReactiveX/rxjs).

## TODO

- Allow returning `undefined|null` in operators such as delay?
- Allow optional parameters to be equal to null?
- Look at error instances and make sure we are handling them properly (eg. some operators might need have special error handling build in, eg. reporting to subjects, and errors should go through that).

## RxJS Operator Mappings

| RxJS Operator             | Has Implementation? | Notes                                                            |
| :------------------------ | :------------------ | :--------------------------------------------------------------- |
| `audit`                   | ☑                   |                                                                  |
| `auditTime`               | ☑                   |                                                                  |
| `buffer`                  | ☑                   |                                                                  |
| `bufferCount`             | ☐                   |                                                                  |
| `bufferTime`              | ☐                   |                                                                  |
| `bufferToggle`            | ☐                   |                                                                  |
| `bufferWhen`              | ☑                   | Name: `bufferEach`                                               |
| `catchError`              | ☑                   |                                                                  |
| `combineAll`              | ☐                   | Not needed.                                                      |
| `combineLatestWith`       | ☑                   | Name: `combineWith`                                              |
| `concatAll`               | ☑                   | Name: `concat`                                                   |
| `concatMap`               | ☑                   | Name: `concatMap`                                                |
| `concatMapTo`             | ☐                   | Not needed.                                                      |
| `concatWith`              | ☑                   |                                                                  |
| `count`                   | ☑                   |                                                                  |
| `debounce`                | ☑                   |                                                                  |
| `debounceTime`            | ☑                   | Name: `debounceMs`                                               |
| `defaultIfEmpty`          | ☑                   |                                                                  |
| `delay`                   | ☑                   | Name: `delayMs`                                                  |
| `delayWhen`               | ☑                   | Name: `delay` (no sub delay.)                                    |
| `dematerialize`           | ☑                   | Name: `unwrapFromWrappedPushEvents`                              |
| `distinct`                | ☑                   |                                                                  |
| `distinctUntilChanged`    | ☑                   | Name: `distinctFromLast`                                         |
| `distinctUntilKeyChanged` | ☐                   | Not needed.                                                      |
| `elementAt`               | ☑                   | Name: `at`                                                       |
| `endWith`                 | ☑                   |                                                                  |
| `every`                   | ☑                   |                                                                  |
| `exhaust`                 | ☑                   | Name: `concatDrop`                                               |
| `exhaustMap`              | ☑                   | Name: `concatDropMap`                                            |
| `expand`                  | ☑                   | Name: `expandMap`                                                |
| `filter`                  | ☑                   |                                                                  |
| `finalize`                | ☑                   |                                                                  |
| `find`                    | ☑                   |                                                                  |
| `findIndex`               | ☑                   |                                                                  |
| `first`                   | ☑                   |                                                                  |
| `groupBy`                 | ☑                   |                                                                  |
| `ignoreElements`          | ☑                   | Name: `ignorePushEvents`                                         |
| `isEmpty`                 | ☑                   |                                                                  |
| `last`                    | ☑                   |                                                                  |
| `map`                     | ☑                   |                                                                  |
| `mapTo`                   | ☑                   |                                                                  |
| `materialize`             | ☑                   | Name: `wrapInPushEvents`                                         |
| `max`                     | ☑                   |                                                                  |
| `mergeAll`                | ☑                   | Name: `merge`                                                    |
| `mergeMap`                | ☑                   |                                                                  |
| `mergeMapTo`              | ☐                   | Not needed.                                                      |
| `mergeScan`               | ☐                   | Not needed.                                                      |
| `mergeWith`               | ☑                   |                                                                  |
| `min`                     | ☑                   |                                                                  |
| `multicast`               | ☐                   |                                                                  |
| `observeOn`               | ☑                   | Name: `schedulePushEvents`                                       |
| `onErrorResumeNext`       | ☐                   | Not needed. See row in the RxJS Observable Mappings table below. |
| `pairwise`                | ☑                   | Name: `withPrevious`                                             |
| `partition`               | ☐                   | Not needed.                                                      |
| `pluck`                   | ☑                   |                                                                  |
| `publish`                 | ☐                   |                                                                  |
| `publishBehavior`         | ☐                   |                                                                  |
| `publishLast`             | ☐                   |                                                                  |
| `publishReplay`           | ☐                   |                                                                  |
| `raceWith`                | ☑                   |                                                                  |
| `reduce`                  | ☑                   |                                                                  |
| `refCount`                | ☐                   |                                                                  |
| `repeat`                  | ☑                   |                                                                  |
| `repeatWhen`              | ☑                   | Note: Differing behaviour.                                       |
| `retry`                   | ☑                   |                                                                  |
| `retryWhen`               | ☐                   | Not needed. Behaviour available through `repeatWhen`             |
| `sample`                  | ☑                   |                                                                  |
| `sampleTime`              | ☑                   | Name: `sampleMs`                                                 |
| `scan`                    | ☑                   |                                                                  |
| `sequenceEqual`           | ☑                   | Name: `isEqualTo`                                                |
| `share`                   | ☐                   |                                                                  |
| `shareReplay`             | ☐                   |                                                                  |
| `single`                  | ☐                   | Not needed.                                                      |
| `skip`                    | ☑                   |                                                                  |
| `skipLast`                | ☑                   |                                                                  |
| `skipUntil`               | ☑                   |                                                                  |
| `skipWhile`               | ☑                   |                                                                  |
| `startWith`               | ☑                   |                                                                  |
| `subscribeOn`             | ☑                   | Name: `scheduleSubscription`                                     |
| `switchAll`               | ☑                   | Name: `switchEach`                                               |
| `switchMap`               | ☑                   |                                                                  |
| `switchMapTo`             | ☐                   | Not needed.                                                      |
| `take`                    | ☑                   |                                                                  |
| `takeLast`                | ☑                   |                                                                  |
| `takeUntil`               | ☑                   |                                                                  |
| `takeWhile`               | ☑                   |                                                                  |
| `tap`                     | ☑                   | Name: `spyPush`                                                  |
| `throttle`                | ☑                   |                                                                  |
| `throttleTime`            | ☑                   | Name: `throttleMs`                                               |
| `throwIfEmpty`            | ☑                   |                                                                  |
| `timeInterval`            | ☑                   | Name: `withTimeInterval`                                         |
| `timeout`                 | ☑                   | Name: `timeoutMs`                                                |
| `timeoutWith`             | ☑                   |                                                                  |
| `timestamp`               | ☑                   | Name: `withTime`                                                 |
| `toArray`                 | ☑                   | Name: `collect`                                                  |
| `window`                  | ☑                   |                                                                  |
| `windowCount`             | ☐                   |                                                                  |
| `windowTime`              | ☐                   |                                                                  |
| `windowToggle`            | ☐                   |                                                                  |
| `windowWhen`              | ☑                   | Name: `windowEach`                                               |
| `withLatestFrom`          | ☑                   |                                                                  |
| `zipAll`                  | ☐                   | Not needed.                                                      |
| `zipWith`                 | ☑                   |                                                                  |

## RxJS Observable Mappings

| RxJS Observable     | Has Implementation | Notes                                                                                                                                              |
| :------------------ | :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bindCallback`      | ☐                  | Not needed.                                                                                                                                        |
| `bindNodeCallback`  | ☐                  | Not needed.                                                                                                                                        |
| `combineLatest`     | ☑                  | Name: `combine`                                                                                                                                    |
| `concat`            | ☑                  | Name: `concatSources`                                                                                                                              |
| `defer`             | ☑                  | Name: `lazy`                                                                                                                                       |
| `empty`             | ☑                  |                                                                                                                                                    |
| `forkJoin`          | ☑                  | Name: `all`                                                                                                                                        |
| `from`              | ☐                  | Not needed.                                                                                                                                        |
| `fromArray`         | ☑                  |                                                                                                                                                    |
| `fromEvent`         | ☐                  | Not needed.                                                                                                                                        |
| `fromEventPattern`  | ☑                  | Name: `fromReactiveValue`                                                                                                                          |
| `fromIterable`      | ☑                  |                                                                                                                                                    |
| `fromObservable`    | ☐                  | Not needed.                                                                                                                                        |
| `fromPromise`       | ☑                  |                                                                                                                                                    |
| `generate`          | ☐                  | Not needed.                                                                                                                                        |
| `iif`               | ☑                  |                                                                                                                                                    |
| `interval`          | ☑                  |                                                                                                                                                    |
| `merge`             | ☑                  | Name: `mergeSources`                                                                                                                               |
| `never`             | ☑                  |                                                                                                                                                    |
| `of`                | ☑                  |                                                                                                                                                    |
| `onErrorResumeNext` | ☐                  | Not needed (ignoring errors is a bad pattern, but this operator can be implemented with `concatSources(...sources.map(mapEvents(throw -> end)))`). |
| `pairs`             | ☐                  | Not needed.                                                                                                                                        |
| `partition`         | ☐                  | Not needed.                                                                                                                                        |
| `race`              | ☑                  | Name: `raceSources`                                                                                                                                |
| `range`             | ☑                  |                                                                                                                                                    |
| `throwError`        | ☑                  |                                                                                                                                                    |
| `timer`             | ☑                  | Note: doesn't start an interval, only delays completion.                                                                                           |
| `using`             | ☐                  | Not needed.                                                                                                                                        |
| `zip`               | ☑                  | Name: `zipSources`                                                                                                                                 |

## RxJS Subject Mappings

| RxJS Subject       | Has Implementation | Notes                       |
| :----------------- | :----------------- | :-------------------------- |
| `Subject`          | ☑                  |                             |
| `BehaviourSubject` | ☑                  | Name: `CurrentValueSubject` |
| `AsyncSubject`     | ☑                  | Name: `FinalValueSubject`    |
| `ReplaySubject`    | ☑                  |                             |

## RxJS Scheduler Mappings

| RxJS Scheduler            | Has Implementation | Notes                                                              |
| :------------------------ | :----------------- | :----------------------------------------------------------------- |
| `AnimationFrameScheduler` | ☑                  | Name: `scheduleAnimationFrame`/`SchedulAnimationFrameQueued`       |
| `AsapScheduler`           | ☐                  | Not needed.                                                        |
| `AsyncScheduler`          | ☑                  | Name: `ScheduleTimeout`/`ScheduleTimeoutQueued`/`ScheduleInterval` |
| `QueueScheduler`          | ☑                  | Name: `scheduleSync`/`ScheduleSyncQueued`                          |

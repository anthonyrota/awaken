# Awaken

A fast and extremely lightweight reactive programming library for Typescript, inspired by [callbags](https://github.com/callbag/callbag) and [RxJS](https://github.com/ReactiveX/rxjs)

## TODO

- Allow returning `undefined|null` in operators such as delay?
- Fix (value: unknown, ...) overloads causing issues with type inference

## RxJS Operator Mappings

| RxJS Operator             | Awaken Operator                                   |
| :------------------------ | :------------------------------------------------ |
| `audit`                   | ✅                                                 |
| `auditTime`               | ✅                                                 |
| `buffer`                  | ✅                                                 |
| `bufferCount`             |                                                   |
| `bufferTime`              |                                                   |
| `bufferToggle`            |                                                   |
| `bufferWhen`              | `bufferEach`                                      |
| `catchError`              | ✅                                                 |
| `combineAll`              | Not needed.                                       |
| `combineLatestWith`       | `combineWith`                                     |
| `concatAll`               | `concat`                                          |
| `concatMap`               | `concatMap`                                       |
| `concatMapTo`             | Not needed.                                       |
| `concatWith`              | ✅                                                 |
| `count`                   | ✅                                                 |
| `debounce`                | ✅                                                 |
| `debounceTime`            | `debounceMs`                                      |
| `defaultIfEmpty`          | ✅                                                 |
| `delay`                   | `delayMs`                                         |
| `delayWhen`               | `delay` (no sub delay)                            |
| `dematerialize`           | `unwrapFromWrappedPushEvents`                     |
| `distinct`                | `wrapInPushEvents`                                |
| `distinctUntilChanged`    |                                                   |
| `distinctUntilKeyChanged` |                                                   |
| `elementAt`               |                                                   |
| `endWith`                 | ✅                                                 |
| `every`                   | ✅                                                 |
| `exhaust`                 | `concatDrop`                                      |
| `exhaustMap`              | `concatDropMap`                                   |
| `expand`                  | `expandMap`                                       |
| `filter`                  | ✅                                                 |
| `finalize`                | ✅                                                 |
| `find`                    | ✅                                                 |
| `findIndex`               | ✅                                                 |
| `first`                   | ✅                                                 |
| `groupBy`                 |                                                   |
| `ignoreElements`          | `ignorePushEvents`                                |
| `isEmpty`                 | ✅                                                 |
| `last`                    | ✅                                                 |
| `map`                     | ✅                                                 |
| `mapTo`                   | ✅                                                 |
| `materialize`             | `wrapInPushEvents`                                |
| `max`                     | ✅                                                 |
| `mergeAll`                | `merge`                                           |
| `mergeMap`                | ✅                                                 |
| `mergeMapTo`              | Not needed.                                       |
| `mergeScan`               |                                                   |
| `mergeWith`               | ✅                                                 |
| `min`                     | ✅                                                 |
| `multicast`               |                                                   |
| `observeOn`               | schedulePushEvents                                |
| `onErrorResumeNext`       | Not needed. See RxJS Observable onErrorResumeNext |
| `pairwise`                | `withPrevious`                                    |
| `partition`               |                                                   |
| `pluck`                   | ✅                                                 |
| `publish`                 |                                                   |
| `publishBehavior`         |                                                   |
| `publishLast`             |                                                   |
| `publishReplay`           |                                                   |
| `raceWith`                | ✅                                                 |
| `reduce`                  | ✅                                                 |
| `refCount`                |                                                   |
| `repeat`                  | ✅                                                 |
| `repeatWhen`              |                                                   |
| `retry`                   |                                                   |
| `retryWhen`               |                                                   |
| `sample`                  | ✅                                                 |
| `sampleTime`              | `sampleMs`                                        |
| `scan`                    | ✅                                                 |
| `sequenceEqual`           |                                                   |
| `share`                   |                                                   |
| `shareReplay`             |                                                   |
| `single`                  |                                                   |
| `skip`                    | ✅                                                 |
| `skipLast`                | ✅                                                 |
| `skipUntil`               | ✅                                                 |
| `skipWhile`               | ✅                                                 |
| `startWith`               | ✅                                                 |
| `subscribeOn`             | scheduleSubscription                              |
| `switchAll`               | `switchEach`                                      |
| `switchMap`               | ✅                                                 |
| `switchMapTo`             | Not needed.                                       |
| `take`                    | ✅                                                 |
| `takeLast`                | ✅                                                 |
| `takeUntil`               | ✅                                                 |
| `takeWhile`               | ✅                                                 |
| `tap`                     | spyPush                                           |
| `throttle`                | ✅                                                 |
| `throttleTime`            | throttleMs                                        |
| `throwIfEmpty`            | ✅                                                 |
| `timeInterval`            | ✅                                                 |
| `timeout`                 | `timeoutMs`                                       |
| `timeoutWith`             | ✅                                                 |
| `timestamp`               | ✅                                                 |
| `toArray`                 | `collect`                                         |
| `window`                  | ✅                                                 |
| `windowCount`             |                                                   |
| `windowTime`              |                                                   |
| `windowToggle`            |                                                   |
| `windowWhen`              | `windowEach`                                      |
| `withLatestFrom`          | ✅                                                 |
| `zipAll`                  | Not needed.                                       |
| `zipWith`                 | ✅                                                 |

## RxJS Observable Mappings

| RxJS Observable     | Awaken Source                                                                                                                                      |
| :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onErrorResumeNext` | Not needed (ignoring errors is a bad pattern, but this operator can be implemented with `concatSources(...sources.map(mapEvents(throw -> end)))`). |

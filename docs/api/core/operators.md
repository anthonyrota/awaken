---
title: API Reference - Operators
table_of_contents:
  - text: at
    url_hash_text: at
  - text: catchError
    url_hash_text: catcherror
  - text: collect
    url_hash_text: collect
  - text: combineWith
    url_hash_text: combinewith
  - text: concat
    url_hash_text: concat
  - text: concatDrop
    url_hash_text: concatdrop
  - text: concatDropMap
    url_hash_text: concatdropmap
  - text: concatMap
    url_hash_text: concatmap
  - text: concatWith
    url_hash_text: concatwith
  - text: count
    url_hash_text: count
  - text: debounce
    url_hash_text: debounce
    nested_references:
      - text: DebounceConfig
        url_hash_text: debounceconfig
      - text: defaultDebounceConfig
        url_hash_text: defaultdebounceconfig
      - text: InitialDurationInfo
        url_hash_text: initialdurationinfo
      - text: DebounceTrailingRestart
        url_hash_text: debouncetrailingrestart
        inline_references:
          - text: Type Alias
            url_hash_text: debouncetrailingrestart-typealias
          - text: Variable
            url_hash_text: debouncetrailingrestart-variable
  - text: debounceMs
    url_hash_text: debouncems
  - text: defaultIfEmpty
    url_hash_text: defaultifempty
  - text: defaultIfEmptyTo
    url_hash_text: defaultifemptyto
  - text: delay
    url_hash_text: delay
  - text: delayMs
    url_hash_text: delayms
  - text: distinct
    url_hash_text: distinct
  - text: distinctFromLast
    url_hash_text: distinctfromlast
  - text: endWith
    url_hash_text: endwith
  - text: every
    url_hash_text: every
  - text: expandMap
    url_hash_text: expandmap
  - text: filter
    url_hash_text: filter
  - text: finalize
    url_hash_text: finalize
  - text: find
    url_hash_text: find
  - text: findIndex
    url_hash_text: findindex
  - text: findWithIndex
    url_hash_text: findwithindex
  - text: first
    url_hash_text: first
  - text: flat
    url_hash_text: flat
  - text: flatMap
    url_hash_text: flatmap
  - text: flatWith
    url_hash_text: flatwith
  - text: groupBy
    url_hash_text: groupby
    nested_references:
      - text: groupBy
        url_hash_text: groupby
      - text: GroupSource
        url_hash_text: groupsource
      - text: ActiveGroupSource
        url_hash_text: activegroupsource
      - text: RemovedGroupSource
        url_hash_text: removedgroupsource
  - text: ignorePushEvents
    url_hash_text: ignorepushevents
  - text: isEmpty
    url_hash_text: isempty
  - text: isEqualTo
    url_hash_text: isequalto
  - text: last
    url_hash_text: last
  - text: loop
    url_hash_text: loop
  - text: map
    url_hash_text: map
  - text: mapEvents
    url_hash_text: mapevents
  - text: mapPushEvents
    url_hash_text: mappushevents
  - text: mapTo
    url_hash_text: mapto
  - text: max
    url_hash_text: max
  - text: maxCompare
    url_hash_text: maxcompare
  - text: merge
    url_hash_text: merge
  - text: mergeConcurrent
    url_hash_text: mergeconcurrent
  - text: mergeMap
    url_hash_text: mergemap
  - text: mergeWith
    url_hash_text: mergewith
  - text: mergeWithConcurrent
    url_hash_text: mergewithconcurrent
  - text: min
    url_hash_text: min
  - text: minCompare
    url_hash_text: mincompare
  - text: pluck
    url_hash_text: pluck
  - text: raceWith
    url_hash_text: racewith
  - text: reduce
    url_hash_text: reduce
  - text: repeat
    url_hash_text: repeat
  - text: repeatWhen
    url_hash_text: repeatwhen
  - text: retry
    url_hash_text: retry
  - text: retryAlways
    url_hash_text: retryalways
  - text: sample
    url_hash_text: sample
  - text: sampleMs
    url_hash_text: samplems
  - text: scan
    url_hash_text: scan
  - text: schedulePushEvents
    url_hash_text: schedulepushevents
  - text: scheduleSubscription
    url_hash_text: schedulesubscription
  - text: share
    url_hash_text: share
  - text: shareControlled
    url_hash_text: sharecontrolled
    nested_references:
      - text: ControllableSource
        url_hash_text: controllablesource
  - text: shareOnce
    url_hash_text: shareonce
  - text: sharePersist
    url_hash_text: sharepersist
  - text: shareTransform
    url_hash_text: sharetransform
  - text: skip
    url_hash_text: skip
  - text: skipLast
    url_hash_text: skiplast
  - text: skipUntil
    url_hash_text: skipuntil
  - text: skipWhile
    url_hash_text: skipwhile
  - text: some
    url_hash_text: some
  - text: spyAfter
    url_hash_text: spyafter
  - text: spyBefore
    url_hash_text: spybefore
  - text: spyEndAfter
    url_hash_text: spyendafter
  - text: spyEndBefore
    url_hash_text: spyendbefore
  - text: spyPushAfter
    url_hash_text: spypushafter
  - text: spyPushBefore
    url_hash_text: spypushbefore
  - text: spyThrowAfter
    url_hash_text: spythrowafter
  - text: spyThrowBefore
    url_hash_text: spythrowbefore
  - text: startWith
    url_hash_text: startwith
  - text: startWithSources
    url_hash_text: startwithsources
  - text: switchEach
    url_hash_text: switcheach
  - text: switchMap
    url_hash_text: switchmap
  - text: take
    url_hash_text: take
  - text: takeLast
    url_hash_text: takelast
  - text: takeUntil
    url_hash_text: takeuntil
  - text: takeWhile
    url_hash_text: takewhile
  - text: throttle
    url_hash_text: throttle
    nested_references:
      - text: ThrottleConfig
        url_hash_text: throttleconfig
      - text: defaultThrottleConfig
        url_hash_text: defaultthrottleconfig
  - text: throttleMs
    url_hash_text: throttlems
  - text: throwIfEmpty
    url_hash_text: throwifempty
  - text: timeout
    url_hash_text: timeout
  - text: timeoutMs
    url_hash_text: timeoutms
  - text: unwrapFromWrappedPushEvents
    url_hash_text: unwrapfromwrappedpushevents
  - text: windowControlled
    url_hash_text: windowcontrolled
  - text: windowCount
    url_hash_text: windowcount
  - text: windowEach
    url_hash_text: windoweach
  - text: windowEvery
    url_hash_text: windowevery
  - text: windowTime
    url_hash_text: windowtime
  - text: withLatestFrom
    url_hash_text: withlatestfrom
  - text: withLatestFromLazy
    url_hash_text: withlatestfromlazy
  - text: withPrevious
    url_hash_text: withprevious
  - text: withTime
    url_hash_text: withtime
    nested_references:
      - text: WithTime
        url_hash_text: withtime
  - text: withTimeInterval
    url_hash_text: withtimeinterval
    nested_references:
      - text: TimeInterval
        url_hash_text: timeinterval
  - text: wrapInPushEvents
    url_hash_text: wrapinpushevents
  - text: zipWith
    url_hash_text: zipwith
---

<!-- Do not edit this file. It is automatically generated by a build script. -->

## `at`

#### Signature
<pre>function at(index: number): <a href="_index.md#identityoperator">IdentityOperator</a>;</pre>

## `catchError`

#### Signature
<pre>function catchError&lt;T&gt;(getNewSource: (error: unknown) =&gt; <a href="_index.md#source-interface">Source</a>&lt;T&gt;): <a href="_index.md#operator">Operator</a>&lt;T, T&gt;;</pre>

## `collect`

#### Signature
<pre>function collect&lt;T&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;T&gt;): <a href="_index.md#source-interface">Source</a>&lt;T[]&gt;;</pre>

## `combineWith`

#### Signature
<pre>function combineWith&lt;T extends unknown[]&gt;(...sources: WrapValuesInSource&lt;T&gt;): &lt;U&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;U&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;Unshift&lt;T, U&gt;&gt;;</pre>

## `concat`

#### Signature
<pre>var concat: &lt;T&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;<a href="_index.md#source-interface">Source</a>&lt;T&gt;&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;T&gt;</pre>

## `concatDrop`

#### Signature
<pre>var concatDrop: &lt;T&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;<a href="_index.md#source-interface">Source</a>&lt;T&gt;&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;T&gt;</pre>

## `concatDropMap`

#### Signature
<pre>function concatDropMap&lt;T, U&gt;(transform: (value: T, index: number) =&gt; <a href="_index.md#source-interface">Source</a>&lt;U&gt;): <a href="_index.md#operator">Operator</a>&lt;T, U&gt;;</pre>

## `concatMap`

#### Signature
<pre>function concatMap&lt;T, U&gt;(transform: (value: T, index: number) =&gt; <a href="_index.md#source-interface">Source</a>&lt;U&gt;): <a href="_index.md#operator">Operator</a>&lt;T, U&gt;;</pre>

## `concatWith`

#### Signature
<pre>function concatWith&lt;T&gt;(...sources: <a href="_index.md#source-interface">Source</a>&lt;T&gt;[]): &lt;U&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;U&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;T | U&gt;;</pre>

## `count`

#### Signature
<pre>var count: &lt;T&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;T&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;number&gt;</pre>

## `debounce`

#### Signature
<pre>function debounce&lt;T&gt;(getDurationSource: (value: T, index: number) =&gt; <a href="_index.md#source-interface">Source</a>&lt;unknown&gt;, getInitialDurationRange?: ((firstDebouncedValue: T, index: number) =&gt; <a href="#initialdurationinfo">InitialDurationInfo</a>) | null, config?: <a href="#debounceconfig">DebounceConfig</a> | null): <a href="_index.md#operator">Operator</a>&lt;T, T&gt;;</pre>

#### Signature
<pre>function debounce&lt;T&gt;(getDurationSource: undefined | null, getInitialDurationRange: (firstDebouncedValue: T, index: number) =&gt; <a href="#initialdurationinfo">InitialDurationInfo</a>, config?: <a href="#debounceconfig">DebounceConfig</a> | null): <a href="_index.md#operator">Operator</a>&lt;T, T&gt;;</pre>

## `DebounceConfig`

#### Signature
<pre>interface DebounceConfig </pre>

## `defaultDebounceConfig`

#### Signature
<pre>var defaultDebounceConfig: <a href="#debounceconfig">DebounceConfig</a></pre>

## `InitialDurationInfo`

#### Signature
<pre>type InitialDurationInfo = [<a href="_index.md#source-interface">Source</a>&lt;unknown&gt;, (<a href="_index.md#source-interface">Source</a>&lt;unknown&gt; | undefined | null)?] | [undefined | null, <a href="_index.md#source-interface">Source</a>&lt;unknown&gt;];</pre>

## `DebounceTrailingRestart`

<a name="debouncetrailingrestart-typealias"></a>

### `DebounceTrailingRestart - Type Alias`

#### Signature
<pre>type DebounceTrailingRestart = 'restart';</pre>

<a name="debouncetrailingrestart-variable"></a>

### `DebounceTrailingRestart - Variable`

#### Signature
<pre>var DebounceTrailingRestart: <a href="#debouncetrailingrestart-typealias">DebounceTrailingRestart</a></pre>

## `debounceMs`

#### Signature
<pre>function debounceMs(durationMs: number, maxDurationMs?: number | null, config?: <a href="#debounceconfig">DebounceConfig</a> | null): <a href="_index.md#identityoperator">IdentityOperator</a>;</pre>

#### Signature
<pre>function debounceMs(durationMs: null | undefined, maxDurationMs: number, config?: <a href="#debounceconfig">DebounceConfig</a> | null): <a href="_index.md#identityoperator">IdentityOperator</a>;</pre>

## `defaultIfEmpty`

#### Signature
<pre>function defaultIfEmpty&lt;T&gt;(getDefaultValue: () =&gt; T): &lt;U&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;U&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;T | U&gt;;</pre>

## `defaultIfEmptyTo`

#### Signature
<pre>function defaultIfEmptyTo&lt;T&gt;(value: T): &lt;U&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;U&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;T | U&gt;;</pre>

## `delay`

#### Signature
<pre>function delay&lt;T&gt;(getDelaySource: (value: T, index: number) =&gt; <a href="_index.md#source-interface">Source</a>&lt;unknown&gt;): <a href="_index.md#operator">Operator</a>&lt;T, T&gt;;</pre>

#### Signature
<pre>function delay(getDelaySource: &lt;T&gt;(value: T, index: number) =&gt; <a href="_index.md#source-interface">Source</a>&lt;unknown&gt;): <a href="_index.md#identityoperator">IdentityOperator</a>;</pre>

## `delayMs`

#### Signature
<pre>function delayMs(ms: number): <a href="_index.md#identityoperator">IdentityOperator</a>;</pre>

## `distinct`

#### Signature
<pre>function distinct(): <a href="_index.md#identityoperator">IdentityOperator</a>;</pre>

#### Signature
<pre>function distinct&lt;T, K&gt;(getKey: (value: T, index: number) =&gt; K): <a href="_index.md#operator">Operator</a>&lt;T, T&gt;;</pre>

## `distinctFromLast`

#### Signature
<pre>function distinctFromLast(): <a href="_index.md#identityoperator">IdentityOperator</a>;</pre>

#### Signature
<pre>function distinctFromLast&lt;T&gt;(isDifferent: (keyA: T, keyB: T, currentIndex: number) =&gt; unknown): <a href="_index.md#operator">Operator</a>&lt;T, T&gt;;</pre>

#### Signature
<pre>function distinctFromLast&lt;T, K&gt;(isDifferent: ((keyA: K, keyB: K, currentIndex: number) =&gt; unknown) | undefined, getKey: (value: T) =&gt; K): <a href="_index.md#operator">Operator</a>&lt;T, T&gt;;</pre>

## `endWith`

#### Signature
<pre>function endWith&lt;T&gt;(...values: T[]): &lt;U&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;U&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;T | U&gt;;</pre>

## `every`

#### Signature
<pre>function every&lt;T&gt;(predicate: (value: T, index: number) =&gt; unknown): <a href="_index.md#operator">Operator</a>&lt;T, boolean&gt;;</pre>

## `expandMap`

#### Signature
<pre>var expandMap: &lt;T&gt;(transform: (value: T, index: number) =&gt; <a href="_index.md#source-interface">Source</a>&lt;T&gt;, maxConcurrent?: number | undefined) =&gt; <a href="_index.md#operator">Operator</a>&lt;T, T&gt;</pre>

## `filter`

#### Signature
<pre>function filter&lt;T&gt;(predicate: (value: T, index: number) =&gt; false): <a href="_index.md#operator">Operator</a>&lt;T, never&gt;;</pre>

Calls the predicate function for each Push event of the given source, only passing through events whose value meet the condition specified by the predicate function.

#### Parameters

| <p>Parameter</p> | <p>Type</p> | <p>Description</p> |
| --- | --- | --- |
| <p>`predicate`</p> | <p><code>(value: T, index: number) =&gt; false</code></p> | <p>A function that accepts a value and an index. The filter method calls this function one time for each Push event of the given source. If and only if the function returns a truthy value, then the event will pass through.</p> |

#### Signature
<pre>function filter&lt;T, S extends T&gt;(predicate: (value: T, index: number) =&gt; value is S): <a href="_index.md#operator">Operator</a>&lt;T, S&gt;;</pre>

#### Signature
<pre>function filter&lt;T&gt;(predicate: (value: T, index: number) =&gt; unknown): <a href="_index.md#operator">Operator</a>&lt;T, T&gt;;</pre>

## `finalize`

#### Signature
<pre>function finalize(callback: () =&gt; void): <a href="_index.md#identityoperator">IdentityOperator</a>;</pre>

## `find`

#### Signature
<pre>function find&lt;T, S extends T&gt;(predicate: (value: T, index: number) =&gt; value is S): <a href="_index.md#operator">Operator</a>&lt;T, S&gt;;</pre>

#### Signature
<pre>function find&lt;T&gt;(predicate: (value: T, index: number) =&gt; unknown): <a href="_index.md#operator">Operator</a>&lt;T, T&gt;;</pre>

## `findIndex`

#### Signature
<pre>function findIndex&lt;T&gt;(predicate: (value: T, index: number) =&gt; unknown): <a href="_index.md#operator">Operator</a>&lt;T, number&gt;;</pre>

## `findWithIndex`

#### Signature
<pre>function findWithIndex&lt;T, S extends T&gt;(predicate: (value: T, index: number) =&gt; value is S): <a href="_index.md#operator">Operator</a>&lt;T, WithIndex&lt;S&gt;&gt;;</pre>

#### Signature
<pre>function findWithIndex&lt;T&gt;(predicate: (value: T, index: number) =&gt; unknown): <a href="_index.md#operator">Operator</a>&lt;T, WithIndex&lt;T&gt;&gt;;</pre>

## `first`

#### Signature
<pre>var first: <a href="_index.md#identityoperator">IdentityOperator</a></pre>

## `flat`

#### Signature
<pre>function flat&lt;T&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;<a href="_index.md#source-interface">Source</a>&lt;T&gt;&gt;): <a href="_index.md#source-interface">Source</a>&lt;T&gt;;</pre>

## `flatMap`

#### Signature
<pre>function flatMap&lt;T, U&gt;(transform: (value: T, index: number) =&gt; <a href="_index.md#source-interface">Source</a>&lt;U&gt;): <a href="_index.md#operator">Operator</a>&lt;T, U&gt;;</pre>

## `flatWith`

#### Signature
<pre>function flatWith&lt;T&gt;(...sources: <a href="_index.md#source-interface">Source</a>&lt;T&gt;[]): &lt;U&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;U&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;T | U&gt;;</pre>

## `groupBy`

#### Signature
<pre>function groupBy&lt;T, K&gt;(getKey: (value: T, index: number) =&gt; K, Subject_?: typeof <a href="_index.md#subject-function">Subject</a>, removeGroupWhenNoSubscribers?: boolean): <a href="_index.md#operator">Operator</a>&lt;T, <a href="#groupsource">GroupSource</a>&lt;T, K&gt;&gt;;</pre>

## `GroupSource`

#### Signature
<pre>type GroupSource&lt;T, K&gt; = <a href="#activegroupsource">ActiveGroupSource</a>&lt;T, K&gt; | <a href="#removedgroupsource">RemovedGroupSource</a>&lt;T&gt;;</pre>

## `ActiveGroupSource`

#### Signature
<pre>interface ActiveGroupSource&lt;T, K&gt; extends GroupSourceBase&lt;T&gt; </pre>

## `RemovedGroupSource`

#### Signature
<pre>interface RemovedGroupSource&lt;T&gt; extends GroupSourceBase&lt;T&gt; </pre>

## `ignorePushEvents`

#### Signature
<pre>var ignorePushEvents: &lt;T&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;T&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;never&gt;</pre>

## `isEmpty`

#### Signature
<pre>function isEmpty(source: <a href="_index.md#source-interface">Source</a>&lt;unknown&gt;): <a href="_index.md#source-interface">Source</a>&lt;boolean&gt;;</pre>

## `isEqualTo`

#### Signature
<pre>function isEqualTo&lt;T, U&gt;(otherSource: <a href="_index.md#source-interface">Source</a>&lt;U&gt;, areValuesEqual: (a: T, b: U, index: number) =&gt; unknown): <a href="_index.md#operator">Operator</a>&lt;T, boolean&gt;;</pre>

## `last`

#### Signature
<pre>var last: <a href="_index.md#identityoperator">IdentityOperator</a></pre>

## `loop`

#### Signature
<pre>var loop: <a href="_index.md#identityoperator">IdentityOperator</a></pre>

## `map`

#### Signature
<pre>function map&lt;U&gt;(transform: &lt;T&gt;(value: T, index: number) =&gt; U): &lt;T&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;T&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;U&gt;;</pre>

Calls the given transform function for each Push event of the given source and passes through the result.

#### Parameters

| <p>Parameter</p> | <p>Type</p> | <p>Description</p> |
| --- | --- | --- |
| <p>`transform`</p> | <p><code>&lt;T&gt;(value: T, index: number) =&gt; U</code></p> | <p>A function which accepts a value and an index. The map method calls the transform function one time for each Push event of the given source and passes through the result.</p> |

#### Signature
<pre>function map&lt;T, U&gt;(transform: (value: T, index: number) =&gt; U): <a href="_index.md#operator">Operator</a>&lt;T, U&gt;;</pre>

## `mapEvents`

#### Signature
<pre>function mapEvents&lt;T, U&gt;(transform: (event: <a href="_index.md#event">Event</a>&lt;T&gt;, index: number) =&gt; <a href="_index.md#event">Event</a>&lt;U&gt; | undefined | null): <a href="_index.md#operator">Operator</a>&lt;T, U&gt;;</pre>

## `mapPushEvents`

#### Signature
<pre>function mapPushEvents&lt;T&gt;(transform: (pushEvents: <a href="_index.md#push-interface">Push</a>&lt;T&gt;, index: number) =&gt; <a href="_index.md#throw-interface">Throw</a> | <a href="_index.md#end-interface">End</a>): <a href="_index.md#operator">Operator</a>&lt;T, never&gt;;</pre>

#### Signature
<pre>function mapPushEvents&lt;T, U&gt;(transform: (pushEvent: <a href="_index.md#push-interface">Push</a>&lt;T&gt;, index: number) =&gt; <a href="_index.md#event">Event</a>&lt;U&gt; | undefined | null): <a href="_index.md#operator">Operator</a>&lt;T, U&gt;;</pre>

## `mapTo`

#### Signature
<pre>function mapTo&lt;U&gt;(value: U): &lt;T&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;T&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;U&gt;;</pre>

Replaces the value of each received Push event with the given value.

#### Parameters

| <p>Parameter</p> | <p>Type</p> | <p>Description</p> |
| --- | --- | --- |
| <p>`value`</p> | <p><code>U</code></p> | <p>The value to push.</p> |

## `max`

#### Signature
<pre>var max: <a href="_index.md#operator">Operator</a>&lt;number, number&gt;</pre>

## `maxCompare`

#### Signature
<pre>function maxCompare&lt;T&gt;(compare: (currentValue: T, lastValue: T, currentValueIndex: number) =&gt; number): <a href="_index.md#operator">Operator</a>&lt;T, T&gt;;</pre>

## `merge`

#### Signature
<pre>var merge: &lt;T&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;<a href="_index.md#source-interface">Source</a>&lt;T&gt;&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;T&gt;</pre>

## `mergeConcurrent`

#### Signature
<pre>function mergeConcurrent(maxConcurrent: number): &lt;T&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;<a href="_index.md#source-interface">Source</a>&lt;T&gt;&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;T&gt;;</pre>

## `mergeMap`

#### Signature
<pre>var mergeMap: &lt;T, U&gt;(transform: (value: T, index: number) =&gt; <a href="_index.md#source-interface">Source</a>&lt;U&gt;, maxConcurrent?: number | undefined) =&gt; <a href="_index.md#operator">Operator</a>&lt;T, U&gt;</pre>

## `mergeWith`

#### Signature
<pre>function mergeWith&lt;T&gt;(...sources: <a href="_index.md#source-interface">Source</a>&lt;T&gt;[]): &lt;U&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;U&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;T | U&gt;;</pre>

## `mergeWithConcurrent`

#### Signature
<pre>function mergeWithConcurrent&lt;T&gt;(max: number, ...sources: <a href="_index.md#source-interface">Source</a>&lt;T&gt;[]): &lt;U&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;U&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;T | U&gt;;</pre>

## `min`

#### Signature
<pre>var min: <a href="_index.md#operator">Operator</a>&lt;number, number&gt;</pre>

## `minCompare`

#### Signature
<pre>function minCompare&lt;T&gt;(compare: (currentValue: T, lastValue: T, currentValueIndex: number) =&gt; number): <a href="_index.md#operator">Operator</a>&lt;T, T&gt;;</pre>

## `pluck`

#### Signature
<pre>function pluck&lt;T, K extends keyof T&gt;(key: K): <a href="_index.md#operator">Operator</a>&lt;T, T[K]&gt;;</pre>

## `raceWith`

#### Signature
<pre>function raceWith&lt;T&gt;(...sources: <a href="_index.md#source-interface">Source</a>&lt;T&gt;[]): &lt;U&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;U&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;T | U&gt;;</pre>

## `reduce`

#### Signature
<pre>function reduce&lt;T, R, I&gt;(transform: (previousAccumulatedResult: R | I, currentValue: T, currentIndex: number) =&gt; R, initialValue: I): <a href="_index.md#operator">Operator</a>&lt;T, R&gt;;</pre>

Calls the specified transform function for all the values pushed by the given source. The return value of the transform function is the accumulated result, and is provided as an argument in the next call to the transform function. The accumulated result will be emitted as a Push event once the given source ends.

#### Parameters

| <p>Parameter</p> | <p>Type</p> | <p>Description</p> |
| --- | --- | --- |
| <p>`transform`</p> | <p><code>(previousAccumulatedResult: R | I, currentValue: T, currentIndex: number) =&gt; R</code></p> | <p>A function that transforms the previousAccumulatedResult (last value returned by this function), the currentValue of the emitted Push event and the currentIndex, and returns an accumulated result.</p> |
| <p>`initialValue`</p> | <p><code>I</code></p> | <p>This is used as the initial value to start the accumulation. The first call to the transform function provides this as the previousAccumulatedResult.</p> |

## `repeat`

#### Signature
<pre>var repeat: (times: number) =&gt; <a href="_index.md#identityoperator">IdentityOperator</a></pre>

## `repeatWhen`

#### Signature
<pre>function repeatWhen&lt;T&gt;(getRepeatSource: (sourceEvents: <a href="_index.md#source-interface">Source</a>&lt;<a href="_index.md#event">Event</a>&lt;T&gt;&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;unknown&gt;): <a href="_index.md#operator">Operator</a>&lt;T, T&gt;;</pre>

## `retry`

#### Signature
<pre>var retry: (times: number) =&gt; <a href="_index.md#identityoperator">IdentityOperator</a></pre>

## `retryAlways`

#### Signature
<pre>var retryAlways: <a href="_index.md#identityoperator">IdentityOperator</a></pre>

## `sample`

#### Signature
<pre>function sample(scheduleSource: <a href="_index.md#source-interface">Source</a>&lt;unknown&gt;): <a href="_index.md#identityoperator">IdentityOperator</a>;</pre>

## `sampleMs`

#### Signature
<pre>function sampleMs(ms: number): <a href="_index.md#identityoperator">IdentityOperator</a>;</pre>

## `scan`

#### Signature
<pre>function scan&lt;T, R, I&gt;(transform: (previousAccumulatedResult: R | I, currentValue: T, currentIndex: number) =&gt; R, initialValue: I): <a href="_index.md#operator">Operator</a>&lt;T, R&gt;;</pre>

Calls the specified transform function for all the values pushed by the given source. The return value of the transform function is the accumulated result, and is provided as an argument in the next call to the transform function. The accumulated will be emitted after each Push event.

#### Parameters

| <p>Parameter</p> | <p>Type</p> | <p>Description</p> |
| --- | --- | --- |
| <p>`transform`</p> | <p><code>(previousAccumulatedResult: R | I, currentValue: T, currentIndex: number) =&gt; R</code></p> | <p>A function that transforms the previousAccumulatedResult (last value returned by this function), the currentValue of the emitted Push event and the currentIndex, and returns an accumulated result.</p> |
| <p>`initialValue`</p> | <p><code>I</code></p> | <p>This is used as the initial value to start the accumulation. The first call to the transform function provides this as the previousAccumulatedResult.</p> |

## `schedulePushEvents`

#### Signature
<pre>function schedulePushEvents(schedule: <a href="_index.md#schedulefunction">ScheduleFunction</a>): <a href="_index.md#identityoperator">IdentityOperator</a>;</pre>

## `scheduleSubscription`

#### Signature
<pre>function scheduleSubscription(schedule: <a href="_index.md#schedulefunction">ScheduleFunction</a>): <a href="_index.md#identityoperator">IdentityOperator</a>;</pre>

## `share`

#### Signature
<pre>function share&lt;T&gt;(Subject_: () =&gt; <a href="_index.md#subject-interface">Subject</a>&lt;T&gt;): <a href="_index.md#operator">Operator</a>&lt;T, T&gt;;</pre>

#### Signature
<pre>function share(Subject_?: typeof <a href="_index.md#subject-function">Subject</a>): <a href="_index.md#identityoperator">IdentityOperator</a>;</pre>

## `shareControlled`

#### Signature
<pre>function shareControlled&lt;T&gt;(Subject_: () =&gt; <a href="_index.md#subject-interface">Subject</a>&lt;T&gt;): (source: <a href="_index.md#source-interface">Source</a>&lt;T&gt;) =&gt; <a href="#controllablesource">ControllableSource</a>&lt;T&gt;;</pre>

#### Signature
<pre>function shareControlled(Subject_?: typeof <a href="_index.md#subject-function">Subject</a>): &lt;T&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;T&gt;) =&gt; <a href="#controllablesource">ControllableSource</a>&lt;T&gt;;</pre>

## `ControllableSource`

#### Signature
<pre>interface ControllableSource&lt;T&gt; extends <a href="_index.md#source-interface">Source</a>&lt;T&gt; </pre>

## `shareOnce`

#### Signature
<pre>function shareOnce&lt;T&gt;(Subject_: () =&gt; <a href="_index.md#subject-interface">Subject</a>&lt;T&gt;): <a href="_index.md#operator">Operator</a>&lt;T, T&gt;;</pre>

#### Signature
<pre>function shareOnce(Subject_?: typeof <a href="_index.md#subject-function">Subject</a>): <a href="_index.md#identityoperator">IdentityOperator</a>;</pre>

## `sharePersist`

#### Signature
<pre>function sharePersist&lt;T&gt;(Subject_: () =&gt; <a href="_index.md#subject-interface">Subject</a>&lt;T&gt;): <a href="_index.md#operator">Operator</a>&lt;T, T&gt;;</pre>

#### Signature
<pre>function sharePersist(Subject_?: typeof <a href="_index.md#subject-function">Subject</a>): <a href="_index.md#identityoperator">IdentityOperator</a>;</pre>

## `shareTransform`

#### Signature
<pre>function shareTransform&lt;T, U&gt;(Subject_: () =&gt; <a href="_index.md#subject-interface">Subject</a>&lt;T&gt;, transform: (shared: <a href="_index.md#source-interface">Source</a>&lt;T&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;U&gt;): <a href="_index.md#operator">Operator</a>&lt;T, U&gt;;</pre>

#### Signature
<pre>function shareTransform&lt;U&gt;(Subject_: typeof <a href="_index.md#subject-function">Subject</a>, transform: &lt;T&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;T&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;U&gt;): &lt;T&gt;(shared: <a href="_index.md#source-interface">Source</a>&lt;T&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;U&gt;;</pre>

## `skip`

#### Signature
<pre>function skip(amount: number): <a href="_index.md#identityoperator">IdentityOperator</a>;</pre>

## `skipLast`

#### Signature
<pre>function skipLast(amount: number): <a href="_index.md#identityoperator">IdentityOperator</a>;</pre>

## `skipUntil`

#### Signature
<pre>function skipUntil(stopSource: <a href="_index.md#source-interface">Source</a>&lt;unknown&gt;): <a href="_index.md#identityoperator">IdentityOperator</a>;</pre>

## `skipWhile`

#### Signature
<pre>function skipWhile&lt;T&gt;(shouldContinueSkipping: (value: T, index: number) =&gt; unknown): <a href="_index.md#operator">Operator</a>&lt;T, T&gt;;</pre>

## `some`

#### Signature
<pre>function some&lt;T&gt;(predicate: (value: T, index: number) =&gt; unknown): <a href="_index.md#operator">Operator</a>&lt;T, boolean&gt;;</pre>

## `spyAfter`

#### Signature
<pre>var spyAfter: &lt;T&gt;(onEvent: (event: <a href="_index.md#event">Event</a>&lt;T&gt;) =&gt; void) =&gt; <a href="_index.md#operator">Operator</a>&lt;T, T&gt;</pre>

## `spyBefore`

#### Signature
<pre>var spyBefore: &lt;T&gt;(onEvent: (event: <a href="_index.md#event">Event</a>&lt;T&gt;) =&gt; void) =&gt; <a href="_index.md#operator">Operator</a>&lt;T, T&gt;</pre>

## `spyEndAfter`

#### Signature
<pre>var spyEndAfter: (onEnd: () =&gt; void) =&gt; <a href="_index.md#identityoperator">IdentityOperator</a></pre>

## `spyEndBefore`

#### Signature
<pre>var spyEndBefore: (onEnd: () =&gt; void) =&gt; <a href="_index.md#identityoperator">IdentityOperator</a></pre>

## `spyPushAfter`

#### Signature
<pre>var spyPushAfter: &lt;T&gt;(onPush: (value: T, index: number) =&gt; void) =&gt; <a href="_index.md#operator">Operator</a>&lt;T, T&gt;</pre>

## `spyPushBefore`

#### Signature
<pre>var spyPushBefore: &lt;T&gt;(onPush: (value: T, index: number) =&gt; void) =&gt; <a href="_index.md#operator">Operator</a>&lt;T, T&gt;</pre>

## `spyThrowAfter`

#### Signature
<pre>var spyThrowAfter: (onThrow: (error: unknown) =&gt; void) =&gt; <a href="_index.md#identityoperator">IdentityOperator</a></pre>

## `spyThrowBefore`

#### Signature
<pre>var spyThrowBefore: (onThrow: (error: unknown) =&gt; void) =&gt; <a href="_index.md#identityoperator">IdentityOperator</a></pre>

## `startWith`

#### Signature
<pre>function startWith&lt;T&gt;(...values: T[]): &lt;U&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;U&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;T | U&gt;;</pre>

## `startWithSources`

#### Signature
<pre>function startWithSources&lt;T&gt;(...sources: <a href="_index.md#source-interface">Source</a>&lt;T&gt;[]): &lt;U&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;U&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;T | U&gt;;</pre>

## `switchEach`

#### Signature
<pre>var switchEach: &lt;T&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;<a href="_index.md#source-interface">Source</a>&lt;T&gt;&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;T&gt;</pre>

## `switchMap`

#### Signature
<pre>function switchMap&lt;T, U&gt;(transform: (value: T, index: number) =&gt; <a href="_index.md#source-interface">Source</a>&lt;U&gt;): <a href="_index.md#operator">Operator</a>&lt;T, U&gt;;</pre>

## `take`

#### Signature
<pre>function take(amount: number): <a href="_index.md#identityoperator">IdentityOperator</a>;</pre>

## `takeLast`

#### Signature
<pre>function takeLast(amount: number): <a href="_index.md#identityoperator">IdentityOperator</a>;</pre>

Ignores all received Push events. When the source emits an End event, the last N=amount received Push event will be emitted along with the End event.

#### Parameters

| <p>Parameter</p> | <p>Type</p> | <p>Description</p> |
| --- | --- | --- |
| <p>`amount`</p> | <p><code>number</code></p> | <p>The amount of events to keep and distribute at the end.</p> |

## `takeUntil`

#### Signature
<pre>function takeUntil(stopSource: <a href="_index.md#source-interface">Source</a>&lt;unknown&gt;): <a href="_index.md#identityoperator">IdentityOperator</a>;</pre>

## `takeWhile`

#### Signature
<pre>function takeWhile&lt;T, S extends T&gt;(shouldContinue: (value: T, index: number) =&gt; value is S): <a href="_index.md#operator">Operator</a>&lt;T, S&gt;;</pre>

Calls the shouldContinue function for each Push event of the given source. The returned source will emit an End event instead of the received Push event when the given shouldContinue function returns a falsy value.

#### Parameters

| <p>Parameter</p> | <p>Type</p> | <p>Description</p> |
| --- | --- | --- |
| <p>`shouldContinue`</p> | <p><code>(value: T, index: number) =&gt; value is S</code></p> | <p>A function that accepts a value and an index. The takeWhile method calls this function one time for each Push event of the given source.</p> |

#### Signature
<pre>function takeWhile&lt;T&gt;(shouldContinue: (value: T, index: number) =&gt; unknown): <a href="_index.md#operator">Operator</a>&lt;T, T&gt;;</pre>

## `throttle`

#### Signature
<pre>function throttle(getDurationSource: () =&gt; <a href="_index.md#source-interface">Source</a>&lt;unknown&gt;, config?: <a href="#throttleconfig">ThrottleConfig</a> | null): <a href="_index.md#identityoperator">IdentityOperator</a>;</pre>

#### Signature
<pre>function throttle&lt;T&gt;(getDurationSource: (value: T, index: number) =&gt; <a href="_index.md#source-interface">Source</a>&lt;unknown&gt;, config?: <a href="#throttleconfig">ThrottleConfig</a> | null): <a href="_index.md#operator">Operator</a>&lt;T, T&gt;;</pre>

## `ThrottleConfig`

#### Signature
<pre>interface ThrottleConfig </pre>

## `defaultThrottleConfig`

#### Signature
<pre>var defaultThrottleConfig: <a href="#throttleconfig">ThrottleConfig</a></pre>

## `throttleMs`

#### Signature
<pre>function throttleMs(durationMs: number, config?: <a href="#throttleconfig">ThrottleConfig</a> | null): <a href="_index.md#identityoperator">IdentityOperator</a>;</pre>

## `throwIfEmpty`

#### Signature
<pre>function throwIfEmpty(getError: () =&gt; unknown): <a href="_index.md#identityoperator">IdentityOperator</a>;</pre>

## `timeout`

#### Signature
<pre>function timeout&lt;T&gt;(timeoutSource: <a href="_index.md#source-interface">Source</a>&lt;unknown&gt;, replacementSource: <a href="_index.md#source-interface">Source</a>&lt;T&gt;): &lt;U&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;U&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;T | U&gt;;</pre>

## `timeoutMs`

#### Signature
<pre>function timeoutMs&lt;T&gt;(ms: number, replacementSource: <a href="_index.md#source-interface">Source</a>&lt;T&gt;): &lt;U&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;U&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;T | U&gt;;</pre>

## `unwrapFromWrappedPushEvents`

#### Signature
<pre>var unwrapFromWrappedPushEvents: &lt;T&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;<a href="_index.md#event">Event</a>&lt;T&gt;&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;T&gt;</pre>

## `windowControlled`

#### Signature
<pre>function windowControlled(getWindowOpeningsSource: &lt;T&gt;(sharedSource: <a href="_index.md#source-interface">Source</a>&lt;T&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;unknown&gt;, getWindowClosingSource: &lt;T&gt;(currentWindow: <a href="_index.md#source-interface">Source</a>&lt;T&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;unknown&gt;): &lt;T&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;T&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;<a href="_index.md#source-interface">Source</a>&lt;T&gt;&gt;;</pre>

#### Signature
<pre>function windowControlled&lt;T&gt;(getWindowOpeningsSource: (sharedSource: <a href="_index.md#source-interface">Source</a>&lt;T&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;unknown&gt;, getWindowClosingSource: (currentWindow: <a href="_index.md#source-interface">Source</a>&lt;T&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;unknown&gt;): (source: <a href="_index.md#source-interface">Source</a>&lt;T&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;<a href="_index.md#source-interface">Source</a>&lt;T&gt;&gt;;</pre>

## `windowCount`

#### Signature
<pre>function windowCount(maxWindowLength: number, createEvery?: number): &lt;T&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;T&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;<a href="_index.md#source-interface">Source</a>&lt;T&gt;&gt;;</pre>

## `windowEach`

#### Signature
<pre>function windowEach(getWindowClosingSource: &lt;T&gt;(currentWindow: <a href="_index.md#source-interface">Source</a>&lt;T&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;unknown&gt;): &lt;T&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;T&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;<a href="_index.md#source-interface">Source</a>&lt;T&gt;&gt;;</pre>

#### Signature
<pre>function windowEach&lt;T&gt;(getWindowClosingSource: (currentWindow: <a href="_index.md#source-interface">Source</a>&lt;T&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;unknown&gt;): (source: <a href="_index.md#source-interface">Source</a>&lt;T&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;<a href="_index.md#source-interface">Source</a>&lt;T&gt;&gt;;</pre>

## `windowEvery`

#### Signature
<pre>function windowEvery(boundariesSource: <a href="_index.md#source-interface">Source</a>&lt;unknown&gt;): &lt;T&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;T&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;<a href="_index.md#source-interface">Source</a>&lt;T&gt;&gt;;</pre>

## `windowTime`

#### Signature
<pre>function windowTime(maxWindowDuration?: number | null, creationInterval?: number | null, maxWindowLength?: number): &lt;T&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;T&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;<a href="_index.md#source-interface">Source</a>&lt;T&gt;&gt;;</pre>

## `withLatestFrom`

#### Signature
<pre>function withLatestFrom&lt;T extends unknown[]&gt;(...sources: WrapValuesInSource&lt;T&gt;): &lt;U&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;U&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;Unshift&lt;T, U&gt;&gt;;</pre>

## `withLatestFromLazy`

#### Signature
<pre>function withLatestFromLazy&lt;T extends unknown[]&gt;(getSources: () =&gt; WrapValuesInSource&lt;T&gt;): &lt;U&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;U&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;Unshift&lt;T, U&gt;&gt;;</pre>

## `withPrevious`

#### Signature
<pre>function withPrevious&lt;T&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;T&gt;): <a href="_index.md#source-interface">Source</a>&lt;[T, T]&gt;;</pre>

## `withTime`

#### Signature
<pre>function withTime&lt;T&gt;(provideTime: <a href="util.md#timeprovider">TimeProvider</a>): <a href="_index.md#operator">Operator</a>&lt;T, <a href="#withtime">WithTime</a>&lt;T&gt;&gt;;</pre>

## `WithTime`

#### Signature
<pre>interface WithTime&lt;T&gt; </pre>

## `withTimeInterval`

#### Signature
<pre>function withTimeInterval&lt;T&gt;(provideTime: <a href="util.md#timeprovider">TimeProvider</a>): <a href="_index.md#operator">Operator</a>&lt;T, <a href="#timeinterval">TimeInterval</a>&lt;T&gt;&gt;;</pre>

## `TimeInterval`

#### Signature
<pre>interface TimeInterval&lt;T&gt; </pre>

## `wrapInPushEvents`

#### Signature
<pre>var wrapInPushEvents: &lt;T&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;T&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;<a href="_index.md#event">Event</a>&lt;T&gt;&gt;</pre>

## `zipWith`

#### Signature
<pre>function zipWith&lt;T extends unknown[]&gt;(...sources: WrapValuesInSource&lt;T&gt;): &lt;U&gt;(source: <a href="_index.md#source-interface">Source</a>&lt;U&gt;) =&gt; <a href="_index.md#source-interface">Source</a>&lt;Unshift&lt;T, U&gt;&gt;;</pre>


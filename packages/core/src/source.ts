import { Disposable, implDisposableMethods } from './disposable';
import {
    ScheduleFunction,
    scheduleAnimationFrame,
    ScheduleInterval,
    ScheduleTimeout,
} from './schedule';
import { Subject } from './subject';
import {
    pipe,
    flow,
    removeOnce,
    asyncReportError,
    forEach,
    identity,
    TimeProvider,
} from './util';

export type PushType = 0;
export const PushType: PushType = 0;
export type ThrowType = 1;
export const ThrowType: ThrowType = 1;
export type EndType = 2;
export const EndType: EndType = 2;
export type EventType = PushType | ThrowType | EndType;

/**
 * Represents an event which "pushes" a value to a sink.
 */
export interface Push<T> {
    readonly type: PushType;
    readonly value: T;
}

/**
 * Represents an event where an error has been thrown.
 */
export interface Throw {
    readonly type: ThrowType;
    readonly error: unknown;
}

/**
 * Represents the end of a source.
 */
export interface End {
    readonly type: EndType;
}

export type Event<T> = Push<T> | Throw | End;

/**
 * Creates a Push event.
 * @param value The value to send.
 * @returns The created Push event.
 */
export function Push<T>(value: T): Push<T> {
    return { type: PushType, value };
}

/**
 * Creates a Throw event.
 * @param error The error to be thrown.
 * @returns The created Throw event.
 */
export function Throw(error: unknown): Throw {
    return { type: ThrowType, error };
}

export const End: End = { type: EndType };

/**
 * A Sink is what a Source subscribes to. All events emitted by the source will
 * be passed to the sink that has been given to the source.
 */
export interface Sink<T> extends Disposable {
    (event: Event<T>): void;
}

/**
 * Creates a Sink. A Sink is what a Source subscribes to. All events emitted by
 * the source will be passed to the sink that has been given to the source.
 * @param onEvent The callback for when an event is received.
 * @param subscription When this is disposed this sink will stop taking values,
 *     and any source which this sink has subscribed to will stop emitting
 *     values to this sink.
 */
export function Sink<T>(onEvent: (event: Event<T>) => void): Sink<T> {
    const disposable = Disposable();
    return implDisposableMethods((event: Event<T>): void => {
        if (!disposable.active) {
            return;
        }

        if (event.type !== PushType) {
            disposable.dispose();
        }

        try {
            onEvent(event);
        } catch (error) {
            asyncReportError(error);
            disposable.dispose();
        }
    }, disposable);
}

/**
 * A Source is a function which can be subscribed to with a sink and optionally
 * a subscription. The source will emit values to the given sink, and will stop
 * when the given subscription is disposed.
 */
export interface Source<T> {
    (sink: Sink<T>): void;
}

/**
 * Creates a Source. A Source is a function which can be subscribed to with a
 * sink and optionally a subscription. The source will emit values to the given
 * sink, and will stop when the given subscription is disposed.
 * @param base This will be called with a safe version of a Sink and a
 *     subscription when the source is subscribed to. The safeSink is a sink
 *     which additionally handles errors and disposal logic. When the given
 *     subscription is disposed, the safeSink will stop accepting events.
 * @returns The created source.
 */
export function Source<T>(base: (sink: Sink<T>) => void): Source<T> {
    function safeSource(sink: Sink<T>): void {
        if (!sink.active) {
            return;
        }
        try {
            base(sink);
        } catch (error) {
            let active: boolean;
            try {
                // This can throw if one of the sink's parents is disposed but
                // the sink itself is not disposed yet, meaning while checking
                // if it is active, it disposes itself.
                active = sink.active;
            } catch (innerError) {
                // This try/catch is to ensure that when sink.active throws
                // synchronously, the original error caught when calling the
                // base function is also reported.
                asyncReportError(error);
                throw innerError;
            }
            if (active) {
                sink(Throw(error));
            } else {
                asyncReportError(error);
            }
        }
    }

    return safeSource;
}

/**
 * Higher order function which takes a sink, and returns another function which
 * receives a source that will be subscribed to using the given sink. This is
 * useful, for example, at the end of pipe calls in order to subscribe to the
 * transformed source.
 * @param sink The sink to be given to the received source.
 * @returns The higher order function which takes a source to subscribe to.
 */
export function subscribe<T>(sink: Sink<T>): (source: Source<T>) => void {
    return (source) => {
        source(sink);
    };
}

function pushArrayItemsToSink<T>(array: ArrayLike<T>, sink: Sink<T>): void {
    for (let i = 0; sink.active && i < array.length; i++) {
        sink(Push(array[i]));
    }
}

/**
 * Creates a Source from the given array/array-like. The values of the array
 * will be synchronously emitted by the created source upon each subscription.
 * @param array The array/array-like to iterate over.
 * @returns The created source.
 */
export function fromArray<T>(array: ArrayLike<T>): Source<T> {
    return Source((sink) => {
        pushArrayItemsToSink(array, sink);
        sink(End);
    });
}

export function fromArrayScheduled<T>(
    array: ArrayLike<T>,
    schedule: ScheduleFunction,
): Source<T> {
    return Source((sink) => {
        if (array.length === 0) {
            sink(End);
            return;
        }

        let idx = 0;

        function pushNext(): void {
            sink(Push(array[idx++]));

            if (idx === array.length) {
                sink(End);
            } else {
                // We don't know if the user provided function actually checks
                // if the sink is active or not, even though it should.
                if (sink.active) {
                    schedule(pushNext, sink);
                }
            }
        }

        schedule(pushNext, sink);
    });
}

export function of<T>(...items: T[]): Source<T> {
    return fromArray(items);
}

export function ofScheduled<T>(
    schedule: ScheduleFunction,
    ...items: T[]
): Source<T> {
    return fromArrayScheduled(items, schedule);
}

export function ofEvent(event: Throw | End): Source<never>;
export function ofEvent<T>(event: Event<T>): Source<T>;
export function ofEvent<T>(event: Event<T>): Source<T> {
    return Source((sink) => {
        sink(event);
        sink(End);
    });
}

export function ofEventScheduled<T>(
    event: Throw | End,
    schedule: ScheduleFunction,
): Source<never>;
export function ofEventScheduled<T>(
    event: Event<T>,
    schedule: ScheduleFunction,
): Source<T>;
export function ofEventScheduled<T>(
    event: Event<T>,
    schedule: ScheduleFunction,
): Source<T> {
    return Source((sink) => {
        schedule(() => {
            sink(event);
            sink(End);
        }, sink);
    });
}

export function throwError(getError: () => unknown): Source<never> {
    return lazy(() => ofEvent(Throw(getError())));
}

export function throwErrorScheduled(
    getError: () => unknown,
    schedule: ScheduleFunction,
): Source<never> {
    return lazy(() => ofEventScheduled(Throw(getError()), schedule));
}

export const empty = ofEvent(End);

export function emptyScheduled(schedule: ScheduleFunction): Source<never> {
    return ofEventScheduled(End, schedule);
}

export function timer(durationMs: number): Source<never> {
    return emptyScheduled(ScheduleTimeout(durationMs));
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const never = Source(() => {});

export function fromIterable<T>(iterable: Iterable<T>): Source<T> {
    return Source((sink) => {
        let sinkDisposalError: { __error: unknown } | undefined;
        try {
            for (const item of iterable) {
                try {
                    sink(Push(item));
                    if (!sink.active) {
                        break;
                    }
                } catch (error) {
                    // eslint-disable-next-line max-len
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    sinkDisposalError = { __error: error };
                    break;
                }
            }
        } catch (iterableError) {
            if (sinkDisposalError) {
                asyncReportError(iterableError);
            } else {
                sink(Throw(iterableError));
            }
        }
        if (sinkDisposalError) {
            throw sinkDisposalError.__error;
        }
        sink(End);
    });
}

async function distributeAsyncIterable<T>(
    iterable: AsyncIterable<T>,
    sink: Sink<T>,
): Promise<void> {
    let sinkDisposalError: { __error: unknown } | undefined;
    try {
        for await (const item of iterable) {
            try {
                sink(Push(item));
                if (!sink.active) {
                    break;
                }
            } catch (error) {
                // eslint-disable-next-line max-len
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                sinkDisposalError = { __error: error };
                break;
            }
        }
    } catch (iterableError) {
        if (sinkDisposalError) {
            asyncReportError(iterableError);
        } else {
            sink(Throw(iterableError));
        }
    }
    if (sinkDisposalError) {
        throw sinkDisposalError.__error;
    }
    sink(End);
}

export function fromAsyncIterable<T>(iterable: AsyncIterable<T>): Source<T> {
    return Source((sink) => {
        void distributeAsyncIterable(iterable, sink);
    });
}

export function fromPromise<T>(promise: PromiseLike<T>): Source<T> {
    return Source((sink) => {
        promise
            .then(
                (value) => {
                    sink(Push(value));
                    sink(End);
                },
                (error) => {
                    sink(Throw(error));
                },
            )
            .then(null, asyncReportError);
    });
}

export function fromScheduleFunction<T extends unknown[]>(
    schedule: ScheduleFunction<T>,
): Source<T> {
    return Source((sink) => {
        function callback(...args: T): void {
            sink(Push(args));

            // We don't know if the user provided function actually checks if
            // the sink is active or not, even though it should.
            if (sink.active) {
                schedule(callback, sink);
            }
        }

        schedule(callback, sink);
    });
}

export function fromReactiveValue<T extends unknown[], Signal>(
    addCallback: (handler: (...args: T) => void) => Signal,
    removeCallback: (
        handler: (...args: T) => void,
        signal: { value: Signal } | undefined,
    ) => void,
): Source<T> {
    return Source<T>((sink) => {
        function callback(...values: T): void {
            sink(Push(values));
        }

        sink.add(
            Disposable(() => {
                removeCallback(callback, signal);
            }),
        );

        let signal: { value: Signal } | undefined;
        try {
            signal = { value: addCallback(callback) };
        } catch (error) {
            sink(Throw(error));
            return;
        }
    });
}

export function fromSingularReactiveValue<T, Signal>(
    addCallback: (handler: (value: T) => void) => Signal,
    removeCallback: (
        handler: (value: T) => void,
        signal: { value: Signal } | undefined,
    ) => void,
): Source<T> {
    return pipe(fromReactiveValue(addCallback, removeCallback), pluck(0));
}

const replaceWithValueIndex = map((_: unknown, idx) => idx);

export function interval(delayMs: number): Source<number> {
    return replaceWithValueIndex(
        fromScheduleFunction(ScheduleInterval(delayMs)),
    );
}

export const animationFrames: Source<number> = pipe(
    fromScheduleFunction(scheduleAnimationFrame),
    pluck<[number], 0>(0),
);

export function lazy<T>(createSource: () => Source<T>): Source<T> {
    return Source((sink) => {
        let source: Source<T>;
        try {
            source = createSource();
        } catch (error) {
            sink(Throw(error));
            return;
        }
        source(sink);
    });
}

export function iif<T>(
    condition: () => unknown,
    createSourceIfTrue: () => Source<T>,
    createSourceIfFalse: () => Source<T>,
): Source<T> {
    return lazy(() => {
        return condition() ? createSourceIfTrue() : createSourceIfFalse();
    });
}

export function range(count: number, start = 0): Source<number> {
    return Source((sink) => {
        for (let i = 0; sink.active && i < count; i++) {
            sink(Push(start + i));
        }
        sink(End);
    });
}

export function isEqual<T, U>(
    sourceA: Source<T>,
    sourceB: Source<U>,
    areValuesEqual: (a: T, b: U, index: number) => unknown,
): Source<boolean> {
    return Source((sink) => {
        const valuesA: T[] = [];
        const valuesB: U[] = [];
        let endedA: true | undefined;
        let endedB: true | undefined;
        let idx = 0;

        function onEvent<X extends T | U>(
            event: Event<X>,
            myValues: X[],
        ): void {
            if (event.type === PushType) {
                if (myValues === valuesA ? endedB : endedA) {
                    sink(Push(false));
                    sink(End);
                    return;
                }

                const theirValues = myValues === valuesA ? valuesB : valuesA;

                if (theirValues.length === 0) {
                    myValues.push(event.value);
                    return;
                }

                const myValue = event.value;
                const theirValue = theirValues.shift() as T | U;

                idx++;

                let equal: unknown;
                try {
                    equal =
                        myValues === valuesA
                            ? areValuesEqual(myValue as T, theirValue as U, idx)
                            : areValuesEqual(
                                  theirValue as T,
                                  myValue as U,
                                  idx,
                              );
                } catch (error) {
                    sink(Throw(error));
                    return;
                }

                if (!equal) {
                    sink(Push(false));
                    sink(End);
                }

                return;
            }

            if (event.type === EndType) {
                if (myValues === valuesA) {
                    if (endedB) {
                        // Both ended.
                        sink(Push(true));
                    } else {
                        // Only A ended.
                        endedA = true;
                        return;
                    }
                } else {
                    if (endedA) {
                        // Both ended.
                        sink(Push(true));
                    } else {
                        // Only B ended.
                        endedB = true;
                        return;
                    }
                }
            }

            sink(event);
        }

        const sinkA = Sink<T>((event) => {
            onEvent(event, valuesA);
        });

        const sinkB = Sink<U>((event) => {
            onEvent(event, valuesB);
        });

        sink.add(sinkA);
        sink.add(sinkB);
        sourceA(sinkA);
        sourceB(sinkB);
    });
}

export function flatSources<T>(...sources: Source<T>[]): Source<T> {
    return flat(fromArray(sources));
}

export function mergeSourcesConcurrent<T>(
    max: number,
    ...sources: Source<T>[]
): Source<T> {
    return mergeConcurrent(max)(fromArray(sources));
}

export function mergeSources<T>(...sources: Source<T>[]): Source<T> {
    return merge(fromArray(sources));
}

export function concatSources<T>(...sources: Source<T>[]): Source<T> {
    return concat(fromArray(sources));
}

// eslint-disable-next-line max-len
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
const noValue: unique symbol = {} as any;

type WrapValuesInSource<T> = { [K in keyof T]: Source<T[K]> };

export function combineSources<T extends unknown[]>(
    ...sources: WrapValuesInSource<T>
): Source<T> {
    return sources.length === 0
        ? empty
        : Source((sink) => {
              const values: unknown[] = [];
              let responded = 0;

              for (let i = 0; sink.active && i < sources.length; i++) {
                  const sourceSink = Sink<unknown>((event) => {
                      if (event.type === PushType) {
                          if (values[i] === noValue) {
                              responded++;
                          }
                          values[i] = event.value;
                          if (responded === sources.length) {
                              sink(Push(values.slice() as T));
                          }
                          return;
                      }
                      sink(event);
                  });

                  sink.add(sourceSink);
                  sources[i](sourceSink);
              }
          });
}

export function all<T extends unknown[]>(
    sources: WrapValuesInSource<T>,
): Source<T> {
    return pipe(
        // eslint-disable-next-line prefer-spread
        combineSources.apply<null, WrapValuesInSource<T>, Source<T>>(
            null,
            sources,
        ),
        last,
    );
}

export function raceSources<T>(...sources: Source<T>[]): Source<T> {
    return sources.length === 0
        ? empty
        : Source((sink) => {
              const sourceSinks = Disposable();
              sink.add(sourceSinks);
              let hasSourceWonRace = false;

              for (let i = 0; sink.active && i < sources.length; i++) {
                  const sourceSink = Sink<T>((event) => {
                      if (!hasSourceWonRace && event.type === PushType) {
                          hasSourceWonRace = true;
                          sourceSinks.remove(sourceSink);
                          sink.add(sourceSink);
                          sourceSinks.dispose();
                      }
                      sink(event);
                  });

                  sourceSinks.add(sourceSink);
                  sources[i](sourceSink);
              }
          });
}

export function zipSources<T extends unknown[]>(
    ...sources: WrapValuesInSource<T>
): Source<T> {
    return sources.length === 0
        ? empty
        : Source((sink) => {
              type SourceValues = { __ended: boolean; __values: unknown[] };
              const sourcesValues: SourceValues[] = [];
              let hasValueCount = 0;
              let hasCompletedSourceWithNoValues = false;

              for (let i = 0; sink.active && i < sources.length; i++) {
                  const values: unknown[] = [];
                  const info: SourceValues = {
                      __ended: false,
                      __values: values,
                  };
                  sourcesValues[i] = info;

                  const sourceSink = Sink<unknown>((event) => {
                      if (hasCompletedSourceWithNoValues) {
                          return;
                      }

                      if (event.type === PushType) {
                          if (!values.length) {
                              hasValueCount++;
                          }

                          values.push(event.value);

                          if (hasValueCount === sources.length) {
                              const valuesToPush: unknown[] = [];
                              for (let i = 0; i < sourcesValues.length; i++) {
                                  const {
                                      __values: values,
                                      __ended: ended,
                                  } = sourcesValues[i];
                                  // eslint-disable-next-line max-len
                                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                  valuesToPush.push(values.shift()!);
                                  if (!values.length) {
                                      if (ended) {
                                          hasCompletedSourceWithNoValues = true;
                                      }
                                      hasValueCount--;
                                  }
                              }

                              sink(Push(valuesToPush as T));

                              if (hasCompletedSourceWithNoValues) {
                                  sink(End);
                              }
                          }

                          return;
                      }

                      if (event.type === EndType && values.length !== 0) {
                          info.__ended = true;
                          return;
                      }

                      sink(event);
                  });

                  sink.add(sourceSink);
                  sources[i](sourceSink);
              }
          });
}

export interface Operator<T, U> {
    (source: Source<T>): Source<U>;
}

export interface IdentityOperator {
    <T>(source: Source<T>): Source<T>;
}

type Unshift<T extends unknown[], U> = ((head: U, ...tail: T) => void) extends (
    ...args: infer A
) => void
    ? A
    : never;

export function combineWith<T extends unknown[]>(
    ...sources: WrapValuesInSource<T>
): <U>(source: Source<U>) => Source<Unshift<T, U>> {
    return <U>(source: Source<U>) =>
        combineSources(source, ...sources) as Source<Unshift<T, U>>;
}

export function raceWith<T>(
    ...sources: Source<T>[]
): <U>(source: Source<U>) => Source<T | U> {
    return <U>(source: Source<U>) => raceSources<T | U>(source, ...sources);
}

export function zipWith<T extends unknown[]>(
    ...sources: WrapValuesInSource<T>
): <U>(source: Source<U>) => Source<Unshift<T, U>> {
    return <U>(source: Source<U>) =>
        zipSources(source, ...sources) as Source<Unshift<T, U>>;
}

function _pluckValue<T>(event: { value: T }): T {
    return event.value;
}

export function withLatestFromLazy<T extends unknown[]>(
    getSources: () => WrapValuesInSource<T>,
): <U>(source: Source<U>) => Source<Unshift<T, U>> {
    return <U>(source: Source<U>) =>
        lazy(() =>
            // eslint-disable-next-line max-len
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
            pipe(source, (withLatestFrom.apply as any)(0, getSources())),
        );
}

export function withLatestFrom<T extends unknown[]>(
    ...sources: WrapValuesInSource<T>
): <U>(source: Source<U>) => Source<Unshift<T, U>> {
    return <U>(source: Source<U>) =>
        Source<Unshift<T, U>>((sink) => {
            const latestPushEvents: Push<unknown>[] = [];
            let responded = 0;

            for (let i = 1; sink.active && i <= sources.length; i++) {
                const sourceSink = Sink<unknown>((event) => {
                    if (event.type === PushType) {
                        if (!latestPushEvents[i]) {
                            responded++;
                        }

                        latestPushEvents[i] = event;
                        return;
                    }

                    if (event.type === EndType && latestPushEvents[i]) {
                        return;
                    }

                    sink(event);
                });

                sink.add(sourceSink);
                sources[i - 1](sourceSink);
            }

            const sourceSink = Sink<U>((event) => {
                if (event.type === PushType) {
                    if (responded === sources.length) {
                        latestPushEvents[0] = event;
                        sink(
                            Push(
                                latestPushEvents.map(_pluckValue) as Unshift<
                                    T,
                                    U
                                >,
                            ),
                        );
                    }
                    return;
                }

                sink(event);
            });

            sink.add(sourceSink);
            source(sourceSink);
        });
}

/**
 * Calls the given transform function for each Push event of the given source
 * and passes through the result.
 * @param transform A function which accepts a value and an index. The map
 *     method calls the transform function one time for each Push event of the
 *     given source and passes through the result.
 */
export function map<T, U>(
    transform: (value: T, index: number) => U,
): Operator<T, U> {
    return (source) =>
        Source((sink) => {
            let idx = 0;

            const sourceSink = Sink<T>((event) => {
                if (event.type === PushType) {
                    let transformed: U;
                    try {
                        transformed = transform(event.value, idx++);
                    } catch (error) {
                        sink(Throw(error));
                        return;
                    }
                    sink(Push(transformed));
                    return;
                }
                sink(event);
            });

            sink.add(sourceSink);
            source(sourceSink);
        });
}

/**
 * Replaces the value of each received Push event with the given value.
 * @param value The value to push.
 */
export function mapTo<T>(value: T): Operator<unknown, T> {
    return map(() => value);
}

export function mapEvents<T, U>(
    transform: (event: Event<T>, index: number) => Event<U> | undefined | null,
): Operator<T, U> {
    return (source) =>
        Source((sink) => {
            let idx = 0;

            const sourceSink = Sink<T>((event) => {
                let newEvent: Event<U> | undefined | null;
                try {
                    newEvent = transform(event, idx++);
                } catch (error) {
                    sink(Throw(error));
                    return;
                }
                if (newEvent) {
                    sink(newEvent);
                }
                if (event.type !== PushType) {
                    sink(End);
                }
            });

            sink.add(sourceSink);
            source(sourceSink);
        });
}

export function mapPushEvents<T>(
    transform: (pushEvents: Push<T>, index: number) => Throw | End,
): Operator<T, never>;
export function mapPushEvents<T, U>(
    transform: (
        pushEvent: Push<T>,
        index: number,
    ) => Event<U> | undefined | null,
): Operator<T, U>;
export function mapPushEvents<T, U>(
    transform: (
        pushEvent: Push<T>,
        index: number,
    ) => Event<U> | undefined | null,
): Operator<T, U> {
    return mapEvents((event, index) =>
        event.type === PushType ? transform(event, index) : event,
    );
}

export const wrapInPushEvents: <T>(
    source: Source<T>,
) => Source<Event<T>> = mapEvents(<T>(event: Event<T>) => Push(event));

export const unwrapFromWrappedPushEvents: <T>(
    source: Source<Event<T>>,
) => Source<T> = mapPushEvents(
    <T>(pushEvent: Push<Event<T>>) => pushEvent.value,
);

export function pluck<T, K extends keyof T>(key: K): Operator<T, T[K]> {
    return map((value) => value[key]);
}

/**
 * Calls the predicate function for each Push event of the given source, only
 * passing through events whose value meet the condition specified by the
 * predicate function.
 * @param predicate A function that accepts a value and an index. The filter
 *     method calls this function one time for each Push event of the given
 *     source. If and only if the function returns a truthy value, then the
 *     event will pass through.
 */
export function filter<T>(
    predicate: (value: T, index: number) => false,
): Operator<T, never>;
export function filter<T, S extends T>(
    predicate: (value: T, index: number) => value is S,
): Operator<T, S>;
export function filter<T>(
    predicate: (value: T, index: number) => unknown,
): Operator<T, T>;
export function filter<T>(
    predicate: (value: T, index: number) => unknown,
): Operator<T, T> {
    return (source) =>
        Source((sink) => {
            let idx = 0;

            const sourceSink = Sink<T>((event) => {
                if (event.type === PushType) {
                    let passThrough: unknown;
                    try {
                        passThrough = predicate(event.value, idx++);
                    } catch (error) {
                        sink(Throw(error));
                        return;
                    }
                    if (!passThrough) {
                        return;
                    }
                }
                sink(event);
            });

            sink.add(sourceSink);
            source(sourceSink);
        });
}

export interface WithIndex<T> {
    value: T;
    index: number;
}

export function findWithIndex<T, S extends T>(
    predicate: (value: T, index: number) => value is S,
): Operator<T, WithIndex<S>>;
export function findWithIndex<T>(
    predicate: (value: T, index: number) => unknown,
): Operator<T, WithIndex<T>>;
export function findWithIndex<T>(
    predicate: (value: T, index: number) => unknown,
): Operator<T, WithIndex<T>> {
    return (source) =>
        Source((sink) => {
            let index: number;
            pipe(
                source,
                filter<T>((value, index_) => {
                    index = index_;
                    return predicate(value, index);
                }),
                first,
                map((value) => ({ value, index })),
            )(sink);
        });
}

export function find<T, S extends T>(
    predicate: (value: T, index: number) => value is S,
): Operator<T, S>;
export function find<T>(
    predicate: (value: T, index: number) => unknown,
): Operator<T, T>;
export function find<T>(
    predicate: (value: T, index: number) => unknown,
): Operator<T, T> {
    return flow(filter(predicate), first);
}

export function findIndex<T>(
    predicate: (value: T, index: number) => unknown,
): Operator<T, number> {
    return flow(findWithIndex(predicate), pluck('index'));
}

export function at(index: number): IdentityOperator {
    return flow(
        filter((_, idx) => idx === index),
        first,
    );
}

export function every<T>(
    predicate: (value: T, index: number) => unknown,
): Operator<T, boolean> {
    return flow(
        filter((value, index) => !predicate(value, index)),
        isEmpty,
    );
}

export function some<T>(
    predicate: (value: T, index: number) => unknown,
): Operator<T, boolean> {
    return flow(filter(predicate), first, mapTo(true), defaultIfEmptyTo(false));
}

export function finalize(callback: () => void): IdentityOperator {
    return <T>(source: Source<T>) =>
        Source<T>((sink) => {
            sink.add(Disposable(callback));
            source(sink);
        });
}

export const ignorePushEvents: Operator<unknown, never> = filter(() => false);

export function withPrevious<T>(source: Source<T>): Source<[T, T]> {
    return lazy(() => {
        let previousPush: Push<T> | undefined;
        return pipe(
            source,
            mapPushEvents((pushEvent) => {
                const pair: [T, T] | undefined = previousPush && [
                    previousPush.value,
                    pushEvent.value,
                ];
                previousPush = pushEvent;
                return pair && Push(pair);
            }),
        );
    });
}

/**
 * Calls the specified transform function for all the values pushed by the given
 * source. The return value of the transform function is the accumulated result,
 * and is provided as an argument in the next call to the transform function.
 * The accumulated will be emitted after each Push event.
 * @param transform A function that transforms the previousAccumulatedResult
 *     (last value returned by this function), the currentValue of the emitted
 *     Push event and the currentIndex, and returns an accumulated result.
 * @param initialValue This is used as the initial value to start the
 *     accumulation. The first call to the transform function provides this
 *     as the previousAccumulatedResult.
 */
export function scan<T, R, I>(
    transform: (
        previousAccumulatedResult: R | I,
        currentValue: T,
        currentIndex: number,
    ) => R,
    initialValue: I,
): Operator<T, R> {
    return (source) =>
        Source((sink) => {
            let previousAccumulatedResult: I | R = initialValue;
            let currentIndex = 0;

            const sourceSink = Sink<T>((event) => {
                if (event.type === PushType) {
                    try {
                        previousAccumulatedResult = transform(
                            previousAccumulatedResult,
                            event.value,
                            currentIndex++,
                        );
                    } catch (error) {
                        sink(Throw(error));
                        return;
                    }

                    sink(Push(previousAccumulatedResult));
                    return;
                }

                sink(event);
            });

            sink.add(sourceSink);
            source(sourceSink);
        });
}

/**
 * Calls the specified transform function for all the values pushed by the given
 * source. The return value of the transform function is the accumulated result,
 * and is provided as an argument in the next call to the transform function.
 * The accumulated result will be emitted as a Push event once the given source
 * ends.
 * @param transform A function that transforms the previousAccumulatedResult
 *     (last value returned by this function), the currentValue of the emitted
 *     Push event and the currentIndex, and returns an accumulated result.
 * @param initialValue This is used as the initial value to start the
 *     accumulation. The first call to the transform function provides this
 *     as the previousAccumulatedResult.
 */
export function reduce<T, R, I>(
    transform: (
        previousAccumulatedResult: R | I,
        currentValue: T,
        currentIndex: number,
    ) => R,
    initialValue: I,
): Operator<T, R> {
    return flow(scan(transform, initialValue), last);
}

function _unwrap<T>(box: [T]): T {
    return box[0];
}

export function maxCompare<T>(
    compare: (
        currentValue: T,
        lastValue: T,
        currentValueIndex: number,
    ) => number,
): Operator<T, T> {
    return flow(
        reduce<T, [T], null>(
            (acc, val, index) =>
                acc === null || compare(val, acc[0], index) > 0 ? [val] : acc,
            null,
        ),
        map(_unwrap),
    );
}

function compareNumbers(a: number, b: number): number {
    return a > b ? 1 : -1;
}

export const max: Operator<number, number> = maxCompare(compareNumbers);

export function minCompare<T>(
    compare: (
        currentValue: T,
        lastValue: T,
        currentValueIndex: number,
    ) => number,
): Operator<T, T> {
    return maxCompare((currentValue, lastValue, currentIndex) =>
        compare(currentValue, lastValue, currentIndex) > 0 ? -1 : 1,
    );
}

export const min: Operator<number, number> = minCompare(compareNumbers);

export function isEqualTo<T, U>(
    otherSource: Source<U>,
    areValuesEqual: (a: T, b: U, index: number) => unknown,
): Operator<T, boolean> {
    return (source) => isEqual(source, otherSource, areValuesEqual);
}

export function flat<T>(source: Source<Source<T>>): Source<T> {
    return Source((sink) => {
        let hasReceivedSource = false;

        const sourceSink = Sink<Source<T>>((event) => {
            if (event.type === PushType) {
                hasReceivedSource = true;
                event.value(sink);
                return;
            }
            if (event.type === EndType && !hasReceivedSource) {
                sink(End);
            }
            sink(event);
        });

        sink.add(sourceSink);
        source(sourceSink);
    });
}

function _createMergeMapOperator(
    expand: false,
): <T, U>(
    transform: (value: T, index: number) => Source<U>,
    maxConcurrent?: number,
) => Operator<T, U>;
function _createMergeMapOperator(
    expand: true,
): <T>(
    transform: (value: T, index: number) => Source<T>,
    maxConcurrent?: number,
) => Operator<T, T>;
function _createMergeMapOperator(
    expand: boolean,
): <T, U>(
    transform: (value: T, index: number) => Source<U>,
    maxConcurrent?: number,
) => Operator<T, U> {
    return <T, U>(
        transform: (value: T, index: number) => Source<U>,
        maxConcurrent = Infinity,
    ) => (source: Source<T>) =>
        Source<U>((sink) => {
            const pushEvents: Push<T>[] = [];
            let completed = false;
            let active = 0;
            let idx = 0;

            function onInnerEvent(event: Event<U>): void {
                if (event.type === PushType && expand) {
                    sourceSink((event as unknown) as Push<T>);
                    return;
                }
                if (event.type === EndType) {
                    active--;
                    const nextPush = pushEvents.shift();
                    if (nextPush) {
                        transformPush(nextPush);
                        return;
                    } else if (active !== 0 || !completed) {
                        return;
                    }
                }
                sink(event);
            }

            function transformPush(pushEvent: Push<T>): void {
                let innerSource: Source<U>;
                try {
                    innerSource = transform(pushEvent.value, idx++);
                } catch (error) {
                    sink(Throw(error));
                    return;
                }

                const innerSink = Sink(onInnerEvent);
                sink.add(innerSink);
                innerSource(innerSink);
            }

            const sourceSink = Sink<T>((event) => {
                if (event.type === PushType) {
                    if (active < maxConcurrent) {
                        transformPush(event);
                    } else {
                        pushEvents.push(event);
                    }
                    return;
                }

                if (event.type === EndType) {
                    completed = true;
                    if (pushEvents.length !== 0 || active !== 0) {
                        return;
                    }
                }

                sink(event);
            });

            sink.add(sourceSink);
            source(sourceSink);
        });
}

export const mergeMap = _createMergeMapOperator(false);
export const expandMap = _createMergeMapOperator(true);

export function mergeConcurrent(
    maxConcurrent: number,
): <T>(source: Source<Source<T>>) => Source<T> {
    return mergeMap(identity, maxConcurrent);
}

export const merge = mergeConcurrent(Infinity);

function _createSwitchOperator(
    overrideCurrent: boolean,
): <T>(source: Source<Source<T>>) => Source<T> {
    return <T>(source: Source<Source<T>>) =>
        Source<T>((sink) => {
            let completed = false;
            let innerSink: Sink<T> | undefined;

            function onInnerEvent(event: Event<T>): void {
                if (event.type === EndType && !completed) {
                    return;
                }
                sink(event);
            }

            const sourceSink = Sink<Source<T>>((event) => {
                if (event.type === PushType) {
                    if (innerSink && innerSink.active) {
                        if (overrideCurrent) {
                            innerSink.dispose();
                        } else {
                            return;
                        }
                    }

                    innerSink = Sink(onInnerEvent);
                    sink.add(innerSink);
                    event.value(innerSink);
                    return;
                }

                if (event.type === EndType) {
                    completed = true;
                    if (innerSink && innerSink.active) {
                        return;
                    }
                }

                sink(event);
            });

            sink.add(sourceSink);
            source(sourceSink);
        });
}

export const switchEach = _createSwitchOperator(true);
export const concatDrop = _createSwitchOperator(false);

export function flatWith<T>(
    ...sources: Source<T>[]
): <U>(source: Source<U>) => Source<T | U> {
    return <U>(source: Source<U>) => flatSources<T | U>(source, ...sources);
}

export function mergeWithConcurrent<T>(
    max: number,
    ...sources: Source<T>[]
): <U>(source: Source<U>) => Source<T | U> {
    return <U>(source: Source<U>) =>
        mergeSourcesConcurrent<T | U>(max, source, ...sources);
}

export function mergeWith<T>(
    ...sources: Source<T>[]
): <U>(source: Source<U>) => Source<T | U> {
    return <U>(source: Source<U>) => mergeSources<T | U>(source, ...sources);
}

export function startWithSources<T>(
    ...sources: Source<T>[]
): <U>(source: Source<U>) => Source<T | U> {
    return <U>(source: Source<U>) => concatSources<T | U>(...sources, source);
}

export function concatWith<T>(
    ...sources: Source<T>[]
): <U>(source: Source<U>) => Source<T | U> {
    return <U>(source: Source<U>) => concatSources<T | U>(source, ...sources);
}

export function flatMap<T, U>(
    transform: (value: T, index: number) => Source<U>,
): Operator<T, U> {
    return flow(map(transform), flat);
}

export function concatMap<T, U>(
    transform: (value: T, index: number) => Source<U>,
): Operator<T, U> {
    return mergeMap(transform, 1);
}

export const concat = mergeConcurrent(1);

export function switchMap<T, U>(
    transform: (value: T, index: number) => Source<U>,
): Operator<T, U> {
    return flow(map(transform), switchEach);
}

export function concatDropMap<T, U>(
    transform: (value: T, index: number) => Source<U>,
): Operator<T, U> {
    return flow(map(transform), concatDrop);
}

export function startWith<T>(
    ...values: T[]
): <U>(source: Source<U>) => Source<T | U> {
    return <U>(source: Source<U>) =>
        Source<T | U>((sink) => {
            pushArrayItemsToSink(values, sink);
            source(sink);
        });
}

export function endWith<T>(
    ...values: T[]
): <U>(source: Source<U>) => Source<T | U> {
    return <U>(source: Source<U>) =>
        Source<T | U>((sink) => {
            const sourceSink = Sink<U>((event) => {
                if (event.type === EndType) {
                    pushArrayItemsToSink(values, sink);
                }
                sink(event);
            });

            sink.add(sourceSink);
            source(sourceSink);
        });
}

export function spy<T>(onEvent: (event: Event<T>) => void): Operator<T, T> {
    return (source) =>
        Source((sink) => {
            const sourceSink = Sink<T>((event) => {
                try {
                    onEvent(event);
                } catch (error) {
                    sink(Throw(error));
                    return;
                }
                sink(event);
            });

            sink.add(sourceSink);
            source(sourceSink);
        });
}

export function spyPush<T>(
    onPush: (value: T, index: number) => void,
): Operator<T, T> {
    return (source) =>
        lazy(() => {
            let idx = 0;
            return pipe(
                source,
                spy<T>((event) => {
                    if (event.type === PushType) {
                        onPush(event.value, idx++);
                    }
                }),
            );
        });
}

export function spyThrow(onThrow: (error: unknown) => void): IdentityOperator {
    return spy((event) => {
        if (event.type === ThrowType) {
            onThrow(event.error);
        }
    });
}

export function spyEnd(onEnd: () => void): IdentityOperator {
    return spy((event) => {
        if (event.type === EndType) {
            onEnd();
        }
    });
}

export function isEmpty(source: Source<unknown>): Source<boolean> {
    return Source((sink) => {
        const sourceSink = Sink((event) => {
            if (event.type === ThrowType) {
                sink(event);
                return;
            }
            sink(Push(event.type === EndType));
            sink(End);
        });

        sink.add(sourceSink);
        source(sourceSink);
    });
}

export function defaultIfEmpty<T>(
    getDefaultValue: () => T,
): <U>(source: Source<U>) => Source<T | U> {
    return <U>(source: Source<U>) =>
        Source<T | U>((sink) => {
            let empty = true;

            const sourceSink = Sink<U>((event) => {
                if (event.type === PushType) {
                    empty = false;
                } else if (event.type === EndType && empty) {
                    let defaultValue: T;
                    try {
                        defaultValue = getDefaultValue();
                    } catch (error) {
                        sink(Throw(error));
                        return;
                    }
                    sink(Push(defaultValue));
                }
                sink(event);
            });

            sink.add(sourceSink);
            source(sourceSink);
        });
}

export function defaultIfEmptyTo<T>(
    value: T,
): <U>(source: Source<U>) => Source<T | U> {
    return defaultIfEmpty(() => value);
}

export function throwIfEmpty(getError: () => unknown): IdentityOperator {
    return defaultIfEmpty(() => {
        throw getError();
    });
}

export function distinct(): IdentityOperator;
export function distinct<T, K>(
    getKey: (value: T, index: number) => K,
): Operator<T, T>;
export function distinct<T, K>(
    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    getKey: (value: T, index: number) => K = identity as any,
): Operator<T, T> {
    return (source) =>
        lazy(() => {
            const hasSet = typeof Set !== 'undefined';
            const keysSet: Set<K> | K[] = hasSet ? new Set<K>() : [];
            const keysWeakSet = typeof WeakSet !== 'undefined' && new WeakSet();

            return pipe(
                source,
                filter((value, index) => {
                    const key = getKey(value, index);
                    let hasKey: boolean | undefined;
                    if (keysWeakSet) {
                        try {
                            hasKey = keysWeakSet.has(
                                // eslint-disable-next-line max-len
                                // eslint-disable-next-line @typescript-eslint/ban-types
                                (key as unknown) as object,
                            );
                            if (!hasKey) {
                                // eslint-disable-next-line max-len
                                // eslint-disable-next-line @typescript-eslint/ban-types
                                keysWeakSet.add((key as unknown) as object);
                            }
                        } catch {
                            // Key does not extend type object.
                        }
                    }
                    if (hasKey === undefined) {
                        if (hasSet) {
                            hasKey = (keysSet as Set<K>).has(key);
                            if (!hasKey) {
                                (keysSet as Set<K>).add(key);
                            }
                        } else {
                            hasKey = (keysSet as K[]).indexOf(key) !== -1;
                            if (!hasKey) {
                                (keysSet as K[]).push(key);
                            }
                        }
                    }
                    return !hasKey;
                }),
            );
        });
}

export function distinctFromLast(): IdentityOperator;
export function distinctFromLast<T>(
    isDifferent: (keyA: T, keyB: T, currentIndex: number) => unknown,
): Operator<T, T>;
export function distinctFromLast<T, K>(
    isDifferent:
        | ((keyA: K, keyB: K, currentIndex: number) => unknown)
        | undefined,
    getKey: (value: T) => K,
): Operator<T, T>;
export function distinctFromLast<T, K>(
    isDifferent: (keyA: K, keyB: K, currentIndex: number) => unknown = (
        a: K,
        b: K,
    ) => a === b,
    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    getKey: (value: T) => K = identity as any,
): Operator<T, T> {
    return (source) =>
        lazy(() => {
            let lastKey: { __value: K } | undefined;

            return pipe(
                source,
                filter((value, index) => {
                    if (!lastKey) {
                        return true;
                    }
                    const currentKey = getKey(value);
                    const changed = isDifferent(
                        lastKey.__value,
                        currentKey,
                        index,
                    );
                    if (changed) {
                        lastKey = { __value: currentKey };
                    }
                    return changed;
                }),
            );
        });
}

export function groupBy<T, K>(
    getKey: (value: T, index: number) => K,
    Subject_ = Subject,
    removeGroupWhenNoSubscribers = true,
): Operator<T, GroupSource<T, K>> {
    return (source) =>
        Source((sink) => {
            const groups: _GroupSource<T, K>[] = [];
            let idx = 0;

            const sourceSink = Sink<T>((event) => {
                if (event.type === PushType) {
                    let key: K;
                    try {
                        key = getKey(event.value, idx++);
                    } catch (error) {
                        sourceSink(Throw(error));
                        return;
                    }

                    let group: _GroupSource<T, K> | undefined;
                    for (let i = 0; i < groups.length; i++) {
                        if (key === groups[i].key) {
                            group = groups[i];
                        }
                    }

                    if (!group) {
                        group = GroupSource(
                            key,
                            groups,
                            Subject_,
                            removeGroupWhenNoSubscribers,
                        );

                        groups.push(group);
                        sink(Push(group as GroupSource<T, K>));
                    }

                    group.__subject(Push(event.value));
                    return;
                }

                for (let i = 0; i < groups.length; i++) {
                    groups[i].removed = true;
                    groups[i].key = null;
                }
                for (let i = 0; i < groups.length; i++) {
                    groups[i].__subject(event);
                }
                groups.length = 0;
                sink(event);
            });

            sink.add(sourceSink);
            source(sourceSink);
        });
}

interface _GroupSource<T, K> extends Source<T> {
    __subject: Subject<T>;
    key: K | null;
    removed: boolean;
    remove(): void;
}

interface GroupSourceBase<T> extends Source<T> {
    remove(): void;
}

export interface ActiveGroupSource<T, K> extends GroupSourceBase<T> {
    removed: false;
    key: K;
}

export interface RemovedGroupSource<T> extends GroupSourceBase<T> {
    removed: true;
    key: null;
}

export type GroupSource<T, K> = ActiveGroupSource<T, K> | RemovedGroupSource<T>;

function GroupSource<T, K>(
    key: K,
    groups: _GroupSource<T, K>[],
    Subject_: typeof Subject,
    removeGroupWhenNoSubscribers: boolean,
): _GroupSource<T, K> {
    const subject = Subject_<T>();
    let source: _GroupSource<T, K>;

    if (removeGroupWhenNoSubscribers) {
        let subscriptions = 0;
        source = Source<T>((sink) => {
            if (!source.removed) {
                subscriptions++;
                sink.add(
                    Disposable(() => {
                        if (!source.removed) {
                            subscriptions--;
                            if (subscriptions === 0) {
                                remove();
                            }
                        }
                    }),
                );
            }
            subject(sink);
        }) as _GroupSource<T, K>;
    } else {
        source = Source(subject) as _GroupSource<T, K>;
    }

    function remove(): void {
        if (!source.removed) {
            removeOnce(groups, source);
            source.removed = true;
            source.key = null;
            subject(End);
        }
    }

    source.__subject = subject;
    source.key = key;
    source.removed = false;
    source.remove = remove;

    return source;
}

function toEmpty(): Source<never> {
    return empty;
}

export function take(amount: number): IdentityOperator {
    if (amount < 1) {
        return toEmpty;
    }
    return <T>(source: Source<T>) =>
        Source<T>((sink) => {
            let count = 0;

            const sourceSink = Sink<T>((event) => {
                // If called during last event, exit.
                if (count >= amount) {
                    return;
                }
                if (event.type === PushType) {
                    count++;
                }
                sink(event);
                if (count >= amount) {
                    sink(End);
                }
            });

            sink.add(sourceSink);
            source(sourceSink);
        });
}

export const first = take(1);

/**
 * Calls the shouldContinue function for each Push event of the given source.
 * The returned source will emit an End event instead of the received Push event
 * when the given shouldContinue function returns a falsy value.
 * @param shouldContinue A function that accepts a value and an index. The
 *     takeWhile method calls this function one time for each Push event of the
 *     given source.
 */
export function takeWhile<T, S extends T>(
    shouldContinue: (value: T, index: number) => value is S,
): Operator<T, S>;
export function takeWhile<T>(
    shouldContinue: (value: T, index: number) => unknown,
): Operator<T, T>;
export function takeWhile<T>(
    shouldContinue: (value: T, index: number) => unknown,
): Operator<T, T> {
    return (source) =>
        Source((sink) => {
            let idx = 0;

            const sourceSink = Sink<T>((event) => {
                if (event.type === PushType) {
                    let keepGoing: unknown;
                    try {
                        keepGoing = shouldContinue(event.value, idx++);
                    } catch (error) {
                        sink(Throw(error));
                        return;
                    }
                    if (!keepGoing) {
                        sink(End);
                        return;
                    }
                }
                sink(event);
            });

            sink.add(sourceSink);
            source(sourceSink);
        });
}

/**
 * Ignores all received Push events. When the source emits an End event, the
 * last N=amount received Push event will be emitted along with the End event.
 * @param amount The amount of events to keep and distribute at the end.
 */
export function takeLast(amount: number): IdentityOperator {
    const amount_ = Math.floor(amount);
    if (amount_ < 1) {
        return toEmpty;
    }
    return <T>(source: Source<T>) =>
        Source<T>((sink) => {
            let pushEvents: Push<T>[] | null = [];

            const sourceSink = Sink<T>((event) => {
                if (!pushEvents) {
                    return;
                }

                if (event.type === PushType) {
                    if (pushEvents.length >= amount_) {
                        pushEvents.shift();
                    }
                    pushEvents.push(event);
                    return;
                }

                if (event.type === EndType) {
                    const pushEvents_ = pushEvents;
                    pushEvents = null;
                    forEach(pushEvents_, sink);
                }

                sink(event);
            });

            sink.add(sourceSink);
            source(sourceSink);
        });
}

export const last = takeLast(1);

export const count: Operator<unknown, number> = flow(
    replaceWithValueIndex,
    last,
);

export function takeUntil(stopSource: Source<unknown>): IdentityOperator {
    return <T>(source: Source<T>) =>
        Source<T>((sink) => {
            const stopSink = Sink<unknown>((event) => {
                sink(event.type === ThrowType ? event : End);
            });

            sink.add(stopSink);
            stopSource(stopSink);
            source(sink);
        });
}

export function skip(amount: number): IdentityOperator {
    return <T>(source: Source<T>) =>
        Source<T>((sink) => {
            let count = 0;

            const sourceSink = Sink<T>((event) => {
                if (event.type === PushType && ++count <= amount) {
                    return;
                }
                sink(event);
            });

            sink.add(sourceSink);
            source(sourceSink);
        });
}

export function skipWhile<T>(
    shouldContinueSkipping: (value: T, index: number) => unknown,
): Operator<T, T> {
    return (source) =>
        Source((sink) => {
            let skipping = true;
            let idx = 0;

            const sourceSink = Sink<T>((event) => {
                if (event.type === PushType && skipping) {
                    try {
                        skipping = !!shouldContinueSkipping(event.value, idx++);
                    } catch (error) {
                        sink(Throw(error));
                        return;
                    }

                    if (skipping) {
                        return;
                    }
                }
                sink(event);
            });

            sink.add(sourceSink);
            source(sourceSink);
        });
}

export function skipLast(amount: number): IdentityOperator {
    return <T>(source: Source<T>) =>
        Source<T>((sink) => {
            const pushEvents: Push<T>[] = [];
            let count = 0;

            const sourceSink = Sink<T>((event) => {
                if (event.type === PushType) {
                    let idx = count++;

                    if (idx < amount) {
                        pushEvents[idx] = event;
                    } else {
                        idx %= amount;
                        const previous = pushEvents[idx];
                        pushEvents[idx] = event;
                        sink(previous);
                    }

                    return;
                }

                sink(event);
            });

            sink.add(sourceSink);
            source(sourceSink);
        });
}

export function skipUntil(stopSource: Source<unknown>): IdentityOperator {
    return <T>(source: Source<T>) =>
        Source<T>((sink) => {
            let skip = true;

            const stopSink = Sink<unknown>((event) => {
                if (event.type === ThrowType) {
                    sink(event);
                } else {
                    skip = false;
                    stopSink.dispose();
                }
            });

            const sourceSink = Sink<T>((event) => {
                if (event.type === PushType && skip) {
                    return;
                }
                sink(event);
            });

            sink.add(stopSink);
            sink.add(sourceSink);
            stopSource(stopSink);
            source(sourceSink);
        });
}

function _createRepeatOperator(
    finalEventType: ThrowType | EndType,
): (times: number) => IdentityOperator {
    return (times) => {
        if (times <= 0) {
            return toEmpty;
        }
        return <T>(source: Source<T>) =>
            Source<T>((sink) => {
                let timesLeft = times;
                let sourceSink: Sink<T>;

                function subscribeSource(): void {
                    sourceSink = Sink(onEvent);
                    sink.add(sourceSink);
                    source(sourceSink);
                }

                function onEvent(event: Event<T>): void {
                    if (event.type === finalEventType && timesLeft >= 0) {
                        timesLeft--;
                        subscribeSource();
                        return;
                    }
                    sink(event);
                }

                subscribeSource();
            });
    };
}

export const repeat = _createRepeatOperator(EndType);
export const retry = _createRepeatOperator(ThrowType);
export const loop = repeat(Infinity);
export const retryAlways = retry(Infinity);

export function repeatWhen<T>(
    getRepeatSource: (sourceEvents: Source<Event<T>>) => Source<unknown>,
): Operator<T, T> {
    return (source) =>
        Source<T>((sink) => {
            const sourceEvents = Subject<Event<T>>();
            let sourceSink: Sink<T> | undefined;

            function onEvent(event: Event<T>): void {
                // eslint-disable-next-line max-len
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const _sourceSink = sourceSink!;
                sourceEvents(Push(event));
                // Will not be active if we repeated.
                if (_sourceSink.active) {
                    sink(event);
                }
            }

            function subscribeSource(): void {
                sourceSink = Sink(onEvent);
                sink.add(sourceSink);
                source(sourceSink);
            }

            const repeatSink = Sink<unknown>((event) => {
                if (event.type === PushType) {
                    // Will equal undefined when subscribing repeatSource.
                    if (sourceSink) {
                        sourceSink.dispose();
                        subscribeSource();
                    }
                    return;
                }
                if (
                    event.type === EndType &&
                    !(
                        // If sourceSink is undefined then that means that we
                        // are subscribing to repeatSource, in which we should
                        // not push the End event.
                        (sourceSink && sourceSink.active)
                    )
                ) {
                    return;
                }
                sink(event);
            });
            sink.add(repeatSink);

            let repeatSource: Source<unknown>;
            try {
                repeatSource = getRepeatSource(sourceEvents);
            } catch (error) {
                sink(Throw(error));
                return;
            }

            repeatSource(repeatSink);
            subscribeSource();
        });
}

export function timeout<T>(
    timeoutSource: Source<unknown>,
    replacementSource: Source<T>,
): <U>(source: Source<U>) => Source<T | U> {
    return <U>(source: Source<U>) =>
        pipe(
            timeoutSource,
            mapPushEvents(() => End),
            startWith(0 as const),
            endWith(1 as const),
            switchMap<0 | 1, T | U>((t) =>
                t === 0 ? source : replacementSource,
            ),
        );
}

export function timeoutMs<T>(
    ms: number,
    replacementSource: Source<T>,
): <U>(source: Source<U>) => Source<T | U> {
    return timeout(timer(ms), replacementSource);
}

export function catchError<T>(
    getNewSource: (error: unknown) => Source<T>,
): Operator<T, T> {
    return (source) =>
        Source((sink) => {
            function onEvent(event: Event<T>): void {
                if (event.type === ThrowType) {
                    let newSource: Source<T>;
                    try {
                        newSource = getNewSource(event.error);
                    } catch (error) {
                        sink(Throw(error));
                        return;
                    }
                    sourceSink = Sink(onEvent);
                    sink.add(sourceSink);
                    newSource(sourceSink);
                    return;
                }
                sink(event);
            }

            let sourceSink = Sink(onEvent);
            sink.add(sourceSink);
            source(sourceSink);
        });
}

export function window(
    boundariesSource: Source<unknown>,
): <T>(source: Source<T>) => Source<Source<T>> {
    return <T>(source: Source<T>) =>
        Source<Source<T>>((sink) => {
            let currentWindow = Subject<T>();
            sink(Push(currentWindow));

            const sourceSink = Sink<T>((event) => {
                if (event.type !== PushType) {
                    boundariesSink.dispose();
                }
                currentWindow(event);
                if (event.type !== PushType) {
                    sink(event);
                }
            });

            const boundariesSink = Sink<unknown>((event) => {
                if (event.type === PushType) {
                    currentWindow(End);
                    currentWindow = Subject();
                    sink(Push(currentWindow));
                    return;
                }
                sink(event);
            });

            sink.add(sourceSink);
            sink.add(boundariesSink);
            source(sourceSink);
            boundariesSource(boundariesSink);
        });
}

export function windowEach(
    getWindowEndSource: () => Source<unknown>,
): <T>(source: Source<T>) => Source<Source<T>> {
    return <T>(source: Source<T>) =>
        Source<Source<T>>((sink) => {
            let currentWindow: Subject<T>;
            let windowEndSink: Sink<unknown>;

            const sourceSink = Sink<T>((event) => {
                if (event.type !== PushType) {
                    windowEndSink.dispose();
                }
                currentWindow(event);
                if (event.type !== PushType) {
                    sink(event);
                }
            });

            function onWindowEndEvent(event: Event<unknown>): void {
                if (event.type === ThrowType) {
                    sink(event);
                    return;
                }
                openWindow();
            }

            function openWindow(): void {
                if (currentWindow) {
                    windowEndSink.dispose();
                    currentWindow(End);
                }

                currentWindow = Subject();
                sink(Push(currentWindow));

                let windowEndSource: Source<unknown>;
                try {
                    windowEndSource = getWindowEndSource();
                } catch (error) {
                    const throwEvent = Throw(error);
                    currentWindow(throwEvent);
                    sink(throwEvent);
                    return;
                }

                windowEndSink = Sink(onWindowEndEvent);
                sink.add(windowEndSink);
                windowEndSource(windowEndSink);
            }

            openWindow();
            sink.add(sourceSink);
            source(sourceSink);
        });
}

export function collect<T>(source: Source<T>): Source<T[]> {
    return Source((sink) => {
        const items: T[] = [];

        const sourceSink = Sink<T>((event) => {
            if (event.type === PushType) {
                items.push(event.value);
                return;
            }
            if (event.type === EndType) {
                sink(Push(items));
            }
            sink(event);
        });

        sink.add(sourceSink);
        source(sourceSink);
    });
}

export type DebounceTrailingRestart = 'restart';
export const DebounceTrailingRestart: DebounceTrailingRestart = 'restart';

export interface DebounceConfig {
    leading?: boolean | null;
    trailing?: boolean | DebounceTrailingRestart | null;
    emitPendingOnEnd?: boolean | null;
}

export const defaultDebounceConfig: DebounceConfig = {
    leading: false,
    trailing: true,
    emitPendingOnEnd: true,
};

export type InitialDurationInfo =
    | [
          /* durationSource */ Source<unknown>,
          /* maxDurationSource */ (Source<unknown> | undefined | null)?,
      ]
    | [
          /* durationSource */ undefined | null,
          /* maxDurationSource */ Source<unknown>,
      ];

export function debounce<T>(
    getDurationSource: (value: T, index: number) => Source<unknown>,
    getInitialDurationRange?:
        | ((firstDebouncedValue: T, index: number) => InitialDurationInfo)
        | null,
    config?: DebounceConfig | null,
): Operator<T, T>;
export function debounce<T>(
    getDurationSource: undefined | null,
    getInitialDurationRange: (
        firstDebouncedValue: T,
        index: number,
    ) => InitialDurationInfo,
    config?: DebounceConfig | null,
): Operator<T, T>;
export function debounce<T>(
    getDurationSource?: ((value: T, index: number) => Source<unknown>) | null,
    getInitialDurationRange?:
        | ((firstDebouncedValue: T, index: number) => InitialDurationInfo)
        | null,
    config?: DebounceConfig | null,
): Operator<T, T> {
    let leading: DebounceConfig['leading'];
    let trailing: DebounceConfig['trailing'];
    let emitPendingOnEnd: DebounceConfig['emitPendingOnEnd'];

    if (config) {
        leading =
            config.leading == null
                ? defaultDebounceConfig.leading
                : config.leading;
        trailing =
            config.trailing == null
                ? defaultDebounceConfig.trailing
                : config.trailing;
        emitPendingOnEnd =
            config.emitPendingOnEnd == null
                ? defaultDebounceConfig.emitPendingOnEnd
                : config.emitPendingOnEnd;
    }

    return (source) =>
        Source<T>((sink) => {
            let latestPush: Push<T>;
            let durationSink: Sink<unknown>;
            let maxDurationSink: Sink<unknown> | true | undefined;
            let distributing = false;
            let lastPushedIdx = 0;
            let idx = 0;

            function onDurationEvent(event: Event<unknown>): void {
                if (event.type === ThrowType) {
                    sink(event);
                    return;
                }

                if (durationSink) durationSink.dispose();
                if (maxDurationSink && maxDurationSink !== true) {
                    maxDurationSink.dispose();
                }
                maxDurationSink = undefined;

                if (trailing && idx > lastPushedIdx) {
                    if (trailing === DebounceTrailingRestart) {
                        const _latestPush = latestPush;
                        const _idx = idx;

                        distributing = true;
                        lastPushedIdx = _idx;
                        sink(_latestPush);
                        distributing = false;

                        startDebounce(_latestPush, _idx);
                    } else {
                        // No logic after this so we can straight up push.
                        sink(latestPush);
                    }
                }
            }

            function restartDebounce(durationSource?: Source<unknown>): void {
                if (!getDurationSource) {
                    return;
                }

                if (durationSink) durationSink.dispose();
                durationSink = Sink(onDurationEvent);
                sourceSink.add(durationSink);

                let durationSource_ = durationSource;
                if (!durationSource_) {
                    try {
                        durationSource_ = getDurationSource(
                            latestPush.value,
                            idx,
                        );
                    } catch (error) {
                        sink(Throw(error));
                        return;
                    }
                }

                durationSource_(durationSink);
            }

            function startDebounce(_latestPush: Push<T>, _idx: number): void {
                if (getInitialDurationRange) {
                    maxDurationSink = Sink(onDurationEvent);
                    sourceSink.add(maxDurationSink);
                } else {
                    maxDurationSink = true;
                    restartDebounce();
                    return;
                }

                let initialDurationInfo: InitialDurationInfo;
                try {
                    initialDurationInfo = getInitialDurationRange(
                        _latestPush.value,
                        _idx,
                    );
                } catch (error) {
                    sink(Throw(error));
                    return;
                }

                const [durationSource, maxDurationSource] = initialDurationInfo;

                const _maxDurationSink = maxDurationSink;
                if (maxDurationSource) {
                    maxDurationSource(_maxDurationSink);
                }

                if (durationSource && _maxDurationSink.active) {
                    restartDebounce(durationSource);
                }
            }

            const sourceSink = Sink<T>((event) => {
                if (event.type === PushType) {
                    latestPush = event;
                    idx++;

                    if (distributing) {
                        return;
                    }

                    if (maxDurationSink) {
                        restartDebounce();
                    } else {
                        const _latestPush = latestPush;
                        const _idx = idx;

                        if (leading) {
                            distributing = true;
                            lastPushedIdx = idx;
                            sink(_latestPush);
                            distributing = false;
                        }

                        startDebounce(_latestPush, _idx);
                    }

                    return;
                }

                if (
                    event.type === EndType &&
                    emitPendingOnEnd &&
                    maxDurationSink &&
                    idx > lastPushedIdx
                ) {
                    sink(latestPush);
                }

                sink(event);
            });

            sink.add(sourceSink);
            source(sourceSink);
        });
}

export function debounceMs(
    durationMs: number,
    maxDurationMs?: number | null,
    config?: DebounceConfig | null,
): IdentityOperator;
export function debounceMs(
    durationMs: null | undefined,
    maxDurationMs: number,
    config?: DebounceConfig | null,
): IdentityOperator;
export function debounceMs(
    durationMs?: number | null,
    maxDurationMs?: number | null,
    config?: DebounceConfig | null,
): IdentityOperator {
    const durationSource = durationMs == null ? durationMs : timer(durationMs);
    const maxDuration =
        maxDurationMs == null ? maxDurationMs : timer(maxDurationMs);

    if (durationSource != null) {
        return debounce(
            () => durationSource,
            maxDuration == null
                ? maxDuration
                : () => [durationSource, maxDuration],
            config,
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return debounce(null, () => [null, maxDuration!], config);
}

export interface ThrottleConfig {
    leading?: boolean | null;
    trailing?: boolean | null;
    emitPendingOnEnd?: boolean | null;
}

export const defaultThrottleConfig: ThrottleConfig = {
    leading: true,
    trailing: true,
    emitPendingOnEnd: true,
};

export function throttle(
    getDurationSource: () => Source<unknown>,
    config?: ThrottleConfig | null,
): IdentityOperator;
export function throttle<T>(
    getDurationSource: (value: T, index: number) => Source<unknown>,
    config?: ThrottleConfig | null,
): Operator<T, T>;
export function throttle<T>(
    getDurationSource: (value: T, index: number) => Source<unknown>,
    config?: ThrottleConfig | null,
): Operator<T, T> {
    let leading: ThrottleConfig['leading'];
    let trailing: ThrottleConfig['trailing'];
    let emitPendingOnEnd: ThrottleConfig['emitPendingOnEnd'];

    if (config) {
        leading =
            config.leading == null
                ? defaultThrottleConfig.leading
                : config.leading;
        trailing =
            config.trailing == null
                ? defaultThrottleConfig.trailing
                : config.trailing;
        emitPendingOnEnd =
            config.emitPendingOnEnd == null
                ? defaultThrottleConfig.emitPendingOnEnd
                : config.emitPendingOnEnd;
    }

    return debounce<T>(
        null,
        (value, index) => [null, getDurationSource(value, index)],
        { leading, trailing, emitPendingOnEnd },
    );
}

export function throttleMs(
    durationMs: number,
    config?: ThrottleConfig | null,
): IdentityOperator {
    const durationSource = timer(durationMs);
    return throttle(() => durationSource, config);
}

export function delay<T>(
    getDelaySource: (value: T, index: number) => Source<unknown>,
): Operator<T, T>;
export function delay<T>(
    getDelaySource: (value: T, index: number) => Source<unknown>,
): Operator<T, T> {
    return (source) =>
        Source((sink) => {
            let idx = 0;
            let active = 0;
            let ended = false;

            const sourceSink = Sink<T>((event) => {
                if (event.type === PushType) {
                    let delaySource: Source<unknown>;
                    try {
                        delaySource = getDelaySource(event.value, idx++);
                    } catch (error) {
                        sink(Throw(error));
                        return;
                    }

                    const delaySink = Sink<unknown>((innerEvent) => {
                        if (innerEvent.type === ThrowType) {
                            sink(innerEvent);
                            return;
                        }

                        active--;
                        delaySink.dispose();

                        sink(event);
                        if (ended && active === 0) {
                            sink(End);
                        }
                    });

                    sink.add(delaySink);
                    active++;
                    delaySource(delaySink);
                    return;
                }

                if (event.type === EndType && active !== 0) {
                    ended = true;
                    return;
                }

                sink(event);
            });

            sink.add(sourceSink);
            source(sourceSink);
        });
}

export function delayMs(ms: number): IdentityOperator {
    const delaySource = timer(ms);
    return delay(() => delaySource);
}

export function sample(scheduleSource: Source<unknown>): IdentityOperator {
    return <T>(source: Source<T>) =>
        Source<T>((sink) => {
            let lastPushEvent: Push<T> | undefined;

            const sourceSink = Sink<T>((event) => {
                if (event.type === PushType) {
                    lastPushEvent = event;
                    return;
                }
                sink(event);
            });

            const scheduleSink = Sink<unknown>((event) => {
                if (event.type === PushType) {
                    if (lastPushEvent) {
                        sink(lastPushEvent);
                    }
                    return;
                }
                sink(event);
            });

            sink.add(sourceSink);
            sink.add(scheduleSink);
            source(sourceSink);
            scheduleSource(scheduleSink);
        });
}

export function sampleMs(ms: number): IdentityOperator {
    return sample(interval(ms));
}

export interface WithTime<T> {
    value: T;
    time: number;
}

export function withTime<T>(
    provideTime: TimeProvider,
): Operator<T, WithTime<T>> {
    return map((value) => ({ value, time: provideTime() }));
}

export interface TimeInterval<T> {
    value: T;
    time: number;
    startTime: number;
    timeSinceStart: number;
    lastTime: number;
    timeDifference: number;
}

export function withTimeInterval<T>(
    provideTime: TimeProvider,
): Operator<T, TimeInterval<T>> {
    return (source) =>
        Source((sink) => {
            const startTime = provideTime();
            let lastTime = provideTime();

            const sourceSink = Sink<T>((event) => {
                if (event.type === PushType) {
                    const currentTime = provideTime();
                    const timeInfo: TimeInterval<T> = {
                        value: event.value,
                        time: currentTime,
                        startTime,
                        timeSinceStart: currentTime - startTime,
                        lastTime,
                        timeDifference: currentTime - lastTime,
                    };
                    lastTime = currentTime;
                    sink(Push(timeInfo));
                    return;
                }
                sink(event);
            });

            sink.add(sourceSink);
            source(sourceSink);
        });
}

export function schedulePushEvents(
    schedule: ScheduleFunction,
): IdentityOperator {
    const delaySource = emptyScheduled(schedule);
    return delay(() => delaySource);
}

export function scheduleSubscription(
    schedule: ScheduleFunction,
): IdentityOperator {
    return <T>(source: Source<T>) =>
        concatSources(emptyScheduled(schedule), source);
}

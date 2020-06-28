import { Disposable, implDisposable } from './disposable';
import {
    ScheduleFunction,
    scheduleAnimationFrame,
    ScheduleInterval,
    ScheduleTimeout,
} from './schedule';
import { Subject } from './subject';
import { asyncReportError, flow, forEach } from './util';

export const enum EventType {
    Push = 0,
    Throw = 1,
    End = 2,
}

/**
 * Represents an event which "pushes" a value to a sink.
 */
export interface Push<T> {
    readonly type: EventType.Push;
    readonly value: T;
}

/**
 * Represents an event where an error has been thrown.
 */
export interface Throw {
    readonly type: EventType.Throw;
    readonly error: unknown;
}

/**
 * Represents the end of a source.
 */
export interface End {
    readonly type: EventType.End;
}

export type Event<T> = Push<T> | Throw | End;

/**
 * Creates a Push event.
 * @param value The value to send.
 * @returns The created Push event.
 */
export function Push<T>(value: T): Push<T> {
    return { type: EventType.Push, value };
}

/**
 * Creates a Throw event.
 * @param error The error to be thrown.
 * @returns The created Throw event.
 */
export function Throw(error: unknown): Throw {
    return { type: EventType.Throw, error };
}

export const End: End = { type: EventType.End };

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
    return implDisposable((event: Event<T>): void => {
        if (!disposable.active) {
            return;
        }

        if (event.type !== EventType.Push) {
            disposable.dispose();
        }

        try {
            onEvent(event);
        } /* prettier-ignore */ catch (error: unknown) {
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
 *     which additionally handles errors and unsubscription logic. When the
 *     given subscription is disposed, the safeSink will stop accepting events.
 * @returns The created source.
 */
export function Source<T>(base: (sink: Sink<T>) => void): Source<T> {
    function safeSource(sink: Sink<T>): void {
        if (!sink.active) {
            return;
        }
        try {
            base(sink);
        } /* prettier-ignore */ catch (error: unknown) {
            let active: boolean;
            try {
                // This can throw if one of the sink's parents is disposed but
                // the sink itself is not disposed yet, meaning while checking
                // if it is active, it disposes itself.
                active = sink.active;
            } /* prettier-ignore */ catch (innerError: unknown) {
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
 * will be synchronously emitted by the created source upon each susbcription.
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

export function throwError(error: unknown): Source<never> {
    return ofEvent(Throw(error));
}

export function throwErrorScheduled(
    error: unknown,
    schedule: ScheduleFunction,
): Source<never> {
    return ofEventScheduled(Throw(error), schedule);
}

export const empty = ofEvent(End);

export function emptyScheduled(schedule: ScheduleFunction): Source<never> {
    return ofEventScheduled(End, schedule);
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const never = Source(() => {});

export function fromIterable<T>(iterable: Iterable<T>): Source<T> {
    return Source((sink) => {
        let sinkDisposalError: { e: unknown } | undefined;
        try {
            for (const item of iterable) {
                try {
                    sink(Push(item));
                    if (!sink.active) {
                        break;
                    }
                } /* prettier-ignore */ catch (error: unknown) {
                    // eslint-disable-next-line max-len
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    sinkDisposalError = { e: error };
                    break;
                }
            }
        } /* prettier-ignore */ catch (iterableError: unknown) {
            if (sinkDisposalError) {
                asyncReportError(iterableError);
            } else {
                sink(Throw(iterableError));
            }
        }
        if (sinkDisposalError) {
            throw sinkDisposalError.e;
        }
        sink(End);
    });
}

async function distributeAsyncIterable<T>(
    iterable: AsyncIterable<T>,
    sink: Sink<T>,
): Promise<void> {
    let sinkDisposalError: { e: unknown } | undefined;
    try {
        for await (const item of iterable) {
            try {
                sink(Push(item));
                if (!sink.active) {
                    break;
                }
            } /* prettier-ignore */ catch (error: unknown) {
                // eslint-disable-next-line max-len
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                sinkDisposalError = { e: error };
                break;
            }
        }
    } /* prettier-ignore */ catch (iterableError: unknown) {
        if (sinkDisposalError) {
            asyncReportError(iterableError);
        } else {
            sink(Throw(iterableError));
        }
    }
    if (sinkDisposalError) {
        throw sinkDisposalError.e;
    }
    sink(End);
}

export function fromAsyncIterable<T>(iterable: AsyncIterable<T>): Source<T> {
    return Source((sink) => {
        void distributeAsyncIterable(iterable, sink);
    });
}

export function fromPromise<T>(promise: Promise<T>): Source<T> {
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

const replaceWithValueIndex = map((_: unknown, idx) => idx);

export function interval(delayMs: number): Source<number> {
    return replaceWithValueIndex(
        fromScheduleFunction(ScheduleInterval(delayMs)),
    );
}

export const animationFrames: Source<number> = pluck<[number], 0>(0)(
    fromScheduleFunction(scheduleAnimationFrame),
);

export function lazy<T>(createSource: () => Source<T>): Source<T> {
    return Source((sink) => {
        let source: Source<T>;
        try {
            source = createSource();
        } /* prettier-ignore */ catch (error: unknown) {
            sink(Throw(error));
            return;
        }
        source(sink);
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

export function combineSources<T extends unknown[]>(
    ...sources: { [K in keyof T]: Source<T[K]> }
): Source<T> {
    return sources.length === 0
        ? empty
        : Source((sink) => {
              const values: unknown[] = [];
              let responded = 0;

              for (let i = 0; sink.active && i < sources.length; i++) {
                  const sourceSink = Sink<unknown>((event) => {
                      if (event.type === EventType.Push) {
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

export function raceSources<T>(...sources: Source<T>[]): Source<T> {
    return sources.length === 0
        ? empty
        : Source((sink) => {
              const sourceSinks = Disposable();
              sink.add(sourceSinks);
              let hasSourceWonRace = false;

              for (let i = 0; sink.active && i < sources.length; i++) {
                  const sourceSink = Sink<T>((event) => {
                      if (!hasSourceWonRace && event.type === EventType.Push) {
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
    ...sources: { [K in keyof T]: Source<T[K]> }
): Source<T> {
    return sources.length === 0
        ? empty
        : Source((sink) => {
              const sourcesValues: { ended: boolean; values: unknown[] }[] = [];
              let hasValueCount = 0;
              let hasCompletedSourceWithNoValues = false;

              for (let i = 0; sink.active && i < sources.length; i++) {
                  const values: unknown[] = [];
                  const info = { ended: false, values };
                  sourcesValues[i] = info;

                  const sourceSink = Sink<unknown>((event) => {
                      if (hasCompletedSourceWithNoValues) {
                          return;
                      }

                      if (event.type === EventType.Push) {
                          if (!values.length) {
                              hasValueCount++;
                          }

                          values.push(event.value);

                          if (hasValueCount === sources.length) {
                              const valuesToPush: unknown[] = [];
                              for (let i = 0; i < sourcesValues.length; i++) {
                                  const { values, ended } = sourcesValues[i];
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

                      if (event.type === EventType.End && values.length !== 0) {
                          info.ended = true;
                          return;
                      }

                      sink(event);
                  });

                  sink.add(sourceSink);
                  sources[i](sourceSink);
              }
          });
}

export function combineWith<T extends unknown[]>(
    ...sources: { [K in keyof T]: Source<T[K]> }
): <U>(source: Source<U>) => Source<[U, ...T]> {
    return <U>(source: Source<U>) =>
        combineSources<[U, ...T]>(source, ...sources);
}

export function raceWith<T>(
    ...sources: Source<T>[]
): <U>(source: Source<U>) => Source<T | U> {
    return <U>(source: Source<U>) => raceSources<T | U>(source, ...sources);
}

export function zipWith<T extends unknown[]>(
    ...sources: { [K in keyof T]: Source<T[K]> }
): <U>(source: Source<U>) => Source<[U, ...T]> {
    return <U>(source: Source<U>) => zipSources<[U, ...T]>(source, ...sources);
}

export interface Operator<T, U> {
    (source: Source<T>): Source<U>;
}

export interface IdentityOperator {
    <T>(source: Source<T>): Source<T>;
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
                if (event.type === EventType.Push) {
                    let transformed: U;
                    try {
                        transformed = transform(event.value, idx++);
                    } /* prettier-ignore */ catch (error: unknown) {
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
    transform: (event: Event<T>, index: number) => Event<U>,
): Operator<T, U> {
    return (source) =>
        Source((sink) => {
            let idx = 0;

            const sourceSink = Sink<T>((event) => {
                let newEvent: Event<U>;
                try {
                    newEvent = transform(event, idx++);
                } /* prettier-ignore */ catch (error: unknown) {
                    sink(Throw(error));
                    return;
                }
                sink(newEvent);
                if (event.type !== EventType.Push) {
                    sink(End);
                }
            });

            sink.add(sourceSink);
            source(sourceSink);
        });
}

export const wrapInPushEvents: <T>(
    source: Source<T>,
) => Source<Event<T>> = mapEvents(<T>(event: Event<T>) => Push(event));
export const unwrapFromWrappedPushEvents: <T>(
    source: Source<Event<T>>,
) => Source<T> = mapEvents(<T>(event: Event<Event<T>>) => {
    return event.type === EventType.Push ? event.value : event;
});

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
                if (event.type === EventType.Push) {
                    let passThrough: unknown;
                    try {
                        passThrough = predicate(event.value, idx++);
                    } /* prettier-ignore */ catch (error: unknown) {
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
export function scan<T, R>(
    transform: (
        previousAccumulatedResult: R,
        currentValue: T,
        currentIndex: number,
    ) => R,
    initialValue: R,
): Operator<T, R> {
    return (source) =>
        Source((sink) => {
            let previousAccumulatedResult = initialValue;
            let currentIndex = 0;

            const sourceSink = Sink<T>((event) => {
                if (event.type === EventType.Push) {
                    try {
                        previousAccumulatedResult = transform(
                            previousAccumulatedResult,
                            event.value,
                            currentIndex++,
                        );
                    } /* prettier-ignore */ catch (error: unknown) {
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
export function reduce<T, R>(
    transform: (
        previousAccumulatedResult: R,
        currentValue: T,
        currentIndex: number,
    ) => R,
    initialValue: R,
): Operator<T, R> {
    return flow(scan(transform, initialValue), last);
}

export function flat<T>(source: Source<Source<T>>): Source<T> {
    return Source((sink) => {
        let hasReceivedSource = false;

        const sourceSink = Sink<Source<T>>((event) => {
            if (event.type === EventType.Push) {
                hasReceivedSource = true;
                event.value(sink);
                return;
            }
            if (event.type === EventType.End && !hasReceivedSource) {
                sink(End);
            }
            sink(event);
        });

        sink.add(sourceSink);
        source(sourceSink);
    });
}

export function mergeConcurrent(
    max: number,
): <T>(source: Source<Source<T>>) => Source<T> {
    return <T>(source: Source<Source<T>>) =>
        Source<T>((sink) => {
            const queue: Source<T>[] = [];
            let completed = false;
            let active = 0;

            function onInnerEvent(event: Event<T>): void {
                if (event.type === EventType.End) {
                    active--;
                    const nextSource = queue.shift();
                    if (nextSource) {
                        subscribeNext(nextSource);
                        return;
                    }
                    if (active !== 0 || !completed) {
                        return;
                    }
                }
                sink(event);
            }

            function subscribeNext(innerSource: Source<T>): void {
                const innerSink = Sink(onInnerEvent);
                sink.add(innerSink);
                innerSource(innerSink);
            }

            const sourceSink = Sink<Source<T>>((event) => {
                if (event.type === EventType.Push) {
                    if (active < max) {
                        subscribeNext(event.value);
                    } else {
                        queue.push(event.value);
                    }
                    return;
                }

                if (event.type === EventType.End) {
                    completed = true;
                    if (queue.length !== 0 || active !== 0) {
                        return;
                    }
                }

                sink(event);
            });

            sink.add(sourceSink);
            source(sourceSink);
        });
}

export const merge = mergeConcurrent(Infinity);
export const concat = mergeConcurrent(1);

function _createSwitchOperator(
    overrideCurrent: boolean,
): <T>(source: Source<Source<T>>) => Source<T> {
    return <T>(source: Source<Source<T>>) =>
        Source<T>((sink) => {
            let completed = false;
            let innerSink: Sink<T> | undefined;

            function onInnerEvent(event: Event<T>): void {
                if (event.type === EventType.End && !completed) {
                    return;
                }
                sink(event);
            }

            const sourceSink = Sink<Source<T>>((event) => {
                if (event.type === EventType.Push) {
                    if (overrideCurrent) {
                        innerSink?.dispose();
                    } else if (innerSink?.active) {
                        return;
                    }

                    innerSink = Sink(onInnerEvent);
                    sink.add(innerSink);
                    event.value(innerSink);
                    return;
                }

                if (event.type === EventType.End) {
                    completed = true;
                    if (innerSink?.active) {
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
                if (event.type === EventType.End) {
                    pushArrayItemsToSink(values, sink);
                }
                sink(event);
            });

            sink.add(sourceSink);
            source(sourceSink);
        });
}

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

export function mergeMapConcurrent<T, U>(
    max: number,
    transform: (value: T, index: number) => Source<U>,
): Operator<T, U> {
    return flow(map(transform), mergeConcurrent(max));
}

export function mergeMap<T, U>(
    transform: (value: T, index: number) => Source<U>,
): Operator<T, U> {
    return flow(map(transform), merge);
}

export function concatMap<T, U>(
    transform: (value: T, index: number) => Source<U>,
): Operator<T, U> {
    return flow(map(transform), concat);
}

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

export function spyEvent<T>(
    onEvent: (event: Event<T>) => void,
): Operator<T, T> {
    return (source) =>
        Source((sink) => {
            const sourceSink = Sink<T>((event) => {
                try {
                    onEvent(event);
                } /* prettier-ignore */ catch (error: unknown) {
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
        Source((sink) => {
            let idx = 0;

            spyEvent<T>((event) => {
                if (event.type === EventType.Push) {
                    onPush(event.value, idx++);
                }
            })(source)(sink);
        });
}

export function spyThrow(onThrow: (error: unknown) => void): IdentityOperator {
    return spyEvent((event) => {
        if (event.type === EventType.Throw) {
            onThrow(event.error);
        }
    });
}

export function spyEnd(onEnd: () => void): IdentityOperator {
    return spyEvent((event) => {
        if (event.type === EventType.End) {
            onEnd();
        }
    });
}

const toEmpty = () => empty;

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
                if (event.type === EventType.Push) {
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
                if (event.type === EventType.Push) {
                    let keepGoing: unknown;
                    try {
                        keepGoing = shouldContinue(event.value, idx++);
                    } /* prettier-ignore */ catch (error: unknown) {
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

                if (event.type === EventType.Push) {
                    if (pushEvents.length >= amount_) {
                        pushEvents.shift();
                    }
                    pushEvents.push(event);
                    return;
                }

                if (event.type === EventType.End) {
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

export function takeUntil(stopSource: Source<unknown>): IdentityOperator {
    return <T>(source: Source<T>) =>
        Source<T>((sink) => {
            const stopSink = Sink<unknown>((event) => {
                sink(event.type === EventType.Throw ? event : End);
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
                if (event.type === EventType.Push && ++count <= amount) {
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
                if (event.type === EventType.Push && skipping) {
                    try {
                        skipping = !!shouldContinueSkipping(event.value, idx++);
                    } /* prettier-ignore */ catch (error: unknown) {
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
                if (event.type === EventType.Push) {
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
                if (event.type === EventType.Throw) {
                    sink(event);
                } else {
                    skip = false;
                    stopSink.dispose();
                }
            });

            const sourceSink = Sink<T>((event) => {
                if (event.type === EventType.Push && skip) {
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

export function catchError<T>(
    getNewSource: (error: unknown) => Source<T>,
): Operator<T, T> {
    return (source) =>
        Source((sink) => {
            function onEvent(event: Event<T>): void {
                if (event.type === EventType.Throw) {
                    let newSource: Source<T>;
                    try {
                        newSource = getNewSource(event.error);
                    } /* prettier-ignore */ catch (error: unknown) {
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
                if (event.type !== EventType.Push) {
                    boundariesSink.dispose();
                }
                currentWindow(event);
                if (event.type !== EventType.Push) {
                    sink(event);
                }
            });

            const boundariesSink = Sink<unknown>((event) => {
                if (event.type === EventType.Push) {
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
                if (event.type !== EventType.Push) {
                    windowEndSink.dispose();
                }
                currentWindow(event);
                if (event.type !== EventType.Push) {
                    sink(event);
                }
            });

            function onWindowEndEvent(event: Event<unknown>): void {
                if (event.type === EventType.Throw) {
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
                } /* prettier-ignore */ catch (error: unknown) {
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
            if (event.type === EventType.Push) {
                items.push(event.value);
                return;
            }
            if (event.type === EventType.End) {
                sink(Push(items));
            }
            sink(event);
        });

        sink.add(sourceSink);
        source(sourceSink);
    });
}

const collectInner: <T>(source: Source<Source<T>>) => Source<T[]> = mergeMap(
    collect,
);

export function buffer(
    boundariesSource: Source<unknown>,
): <T>(source: Source<T>) => Source<T[]> {
    return flow(window(boundariesSource), mergeMap(collect));
}

export function bufferEach(
    getWindowEndSource: () => Source<unknown>,
): <T>(source: Source<T>) => Source<T[]> {
    return flow(windowEach(getWindowEndSource), collectInner);
}

export function delay(getDelaySource: () => Source<unknown>): IdentityOperator;
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

            const sourceSink = Sink<T>((event) => {
                if (event.type === EventType.Push) {
                    let delaySource: Source<unknown>;
                    try {
                        delaySource = getDelaySource(event.value, idx++);
                    } /* prettier-ignore */ catch (error: unknown) {
                        sink(Throw(error));
                        return;
                    }

                    const delaySink = Sink<unknown>((innerEvent) => {
                        active--;
                        delaySink.dispose();
                        sink(
                            innerEvent.type === EventType.Throw
                                ? innerEvent
                                : event,
                        );
                    });

                    sink.add(delaySink);
                    active++;
                    delaySource(delaySink);
                    return;
                }

                if (event.type === EventType.End && active !== 0) {
                    return;
                }

                sink(event);
            });

            sink.add(sourceSink);
            source(sourceSink);
        });
}

export function delayTo(source: Source<unknown>): IdentityOperator {
    return delay(() => source);
}

export function schedulePushEvents(
    schedule: ScheduleFunction,
): IdentityOperator {
    return delayTo(emptyScheduled(schedule));
}

export function delayMs(ms: number): IdentityOperator {
    return schedulePushEvents(ScheduleTimeout(ms));
}

export function sample(scheduleSource: Source<unknown>): IdentityOperator {
    return <T>(source: Source<T>) =>
        Source<T>((sink) => {
            let lastPushEvent: Push<T> | undefined;

            const sourceSink = Sink<T>((event) => {
                if (event.type === EventType.Push) {
                    lastPushEvent = event;
                    return;
                }
                sink(event);
            });

            const scheduleSink = Sink<unknown>((event) => {
                if (event.type !== EventType.Push) {
                    sink(event);
                    return;
                }

                if (lastPushEvent) {
                    sink(lastPushEvent);
                }
            });

            sink.add(sourceSink);
            sink.add(scheduleSink);
            source(sourceSink);
            scheduleSource(scheduleSink);
        });
}

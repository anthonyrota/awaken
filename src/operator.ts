import {
    Source,
    Sink,
    EventType,
    Event,
    Push,
    Throw,
    End,
    empty,
    pushArrayItemsToSink,
    flatSources,
    mergeSources,
    mergeSourcesConcurrent,
    concatSources,
    combineSources,
    raceSources,
    zipSources,
} from './source';
import { flow, forEach } from './util';

export interface Operator<T, U> {
    (source: Source<T>): Source<U>;
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
                switch (event.type) {
                    case EventType.Push: {
                        let transformed: U;
                        try {
                            transformed = transform(event.value, idx++);
                        } catch (error) {
                            sink(Throw(error));
                            return;
                        }
                        sink(Push(transformed));
                        break;
                    }
                    default:
                        sink(event);
                }
            });

            sink.add(sourceSink);
            source(sourceSink);
        });
}

export function mapTo<T>(value: T): Operator<unknown, T> {
    return map(() => value);
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
    onPush: (pushEvent: Push<T>, index: number) => void,
): Operator<T, T> {
    return (source) =>
        Source((sink) => {
            let idx = 0;

            spyEvent<T>((event) => {
                if (event.type === EventType.Push) {
                    onPush(event, idx++);
                }
            })(source)(sink);
        });
}

export function spyThrow(
    onThrow: (throwEvent: Throw) => void,
): <T>(source: Source<T>) => Source<T> {
    return spyEvent((event) => {
        if (event.type === EventType.Throw) {
            onThrow(event);
        }
    });
}

export function spyEnd(
    onEnd: (endEvent: End) => void,
): <T>(source: Source<T>) => Source<T> {
    return spyEvent((event) => {
        if (event.type === EventType.End) {
            onEnd(event);
        }
    });
}

const toEmpty = () => empty;

export function take(amount: number): <T>(source: Source<T>) => Source<T> {
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
export function takeLast(amount: number): <T>(source: Source<T>) => Source<T> {
    return <T>(source: Source<T>) =>
        Source<T>((sink) => {
            let pushEvents: Push<T>[] | null = [];

            const sourceSink = Sink<T>((event) => {
                if (!pushEvents) {
                    return;
                }

                if (event.type === EventType.Push) {
                    if (pushEvents.length >= amount) {
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

export function takeUntil(
    stopSource: Source<unknown>,
): <T>(source: Source<T>) => Source<T> {
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

export function skip(amount: number): <T>(source: Source<T>) => Source<T> {
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

export function skipLast(amount: number): <T>(source: Source<T>) => Source<T> {
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

export function skipUntil(
    stopSource: Source<unknown>,
): <T>(source: Source<T>) => Source<T> {
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

export function pluck<T, K extends keyof T>(key: K): Operator<T, T[K]> {
    return map((value) => value[key]);
}

export type Unshift<T extends unknown[], U> = ((
    h: U,
    ...t: T
) => void) extends (...t: infer R) => void
    ? R
    : never;

export function combineWith<T extends unknown[]>(
    ...sources: { [K in keyof T]: Source<T[K]> }
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
    ...sources: { [K in keyof T]: Source<T[K]> }
): <U>(source: Source<U>) => Source<Unshift<T, U>> {
    return <U>(source: Source<U>) =>
        zipSources(source, ...sources) as Source<Unshift<T, U>>;
}

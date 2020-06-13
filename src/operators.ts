import { Source, Sink, EventType, Push, Throw, End } from './source';

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
 * The accumulated result will be emitted as a Push event once the given source
 * ends.
 * @param transform A function that transforms the previosAccumulatedResult
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
    return (source) =>
        Source((sink) => {
            let previousAccumulatedResult = initialValue;
            let currentValue: T;
            let currentIndex = 0;

            const sourceSink = Sink<T>((event) => {
                switch (event.type) {
                    case EventType.Push: {
                        currentValue = event.value;
                        try {
                            previousAccumulatedResult = transform(
                                previousAccumulatedResult,
                                currentValue,
                                currentIndex++,
                            );
                        } catch (error) {
                            sink(error);
                        }
                        return;
                    }
                    case EventType.End: {
                        sink(Push(previousAccumulatedResult));
                    }
                }
                sink(event);
            });

            sink.add(sourceSink);
            source(sourceSink);
        });
}

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

import { Disposable, implDisposable } from './disposable';
import { pluck, map, concat, merge, mergeConcurrent, flat } from './operator';
import {
    ScheduleFunction,
    scheduleAnimationFrame,
    ScheduleInterval,
} from './schedule';
import { asyncReportError } from './util';

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
 *     which additionally handles errors and unsubscription logic. When the
 *     given subscription is disposed, the safeSink will stop accepting events.
 * @returns The created source.
 */
export function Source<T>(base: (sink: Sink<T>) => void): Source<T> {
    function safeSource(sink: Sink<T>): void {
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
                asyncReportError(error);
                throw innerError;
            }
            if (active) {
                sink(error);
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

export function pushArrayItemsToSink<T>(
    array: ArrayLike<T>,
    sink: Sink<T>,
): void {
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

export function ofError(error: unknown): Source<never> {
    return ofEvent(Throw(error));
}

export const empty = ofEvent(End);

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const never = Source(() => {});

export function fromIterable<T>(iterable: Iterable<T>): Source<T> {
    return Source((sink) => {
        try {
            for (const item of iterable) {
                sink(Push(item));
                if (!sink.active) {
                    break;
                }
            }
        } catch (error) {
            sink(Throw(error));
        }
        sink(End);
    });
}

async function distributeAsyncIterable<T>(
    iterable: AsyncIterable<T>,
    sink: Sink<T>,
): Promise<void> {
    try {
        for await (const item of iterable) {
            sink(Push(item));
            if (!sink.active) {
                break;
            }
        }
    } catch (error) {
        sink(Throw(error));
        return;
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
        } catch (error) {
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
              const sourcesValues: unknown[][] = [];
              let hasValueCount = 0;

              for (let i = 0; sink.active && i < sources.length; i++) {
                  const values = [];
                  sourcesValues[i] = values;

                  const sourceSink = Sink<unknown>((event) => {
                      if (event.type === EventType.Push) {
                          if (!values.length) {
                              hasValueCount++;
                          }

                          if (hasValueCount === sources.length) {
                              const valuesToPush: unknown[] = [];
                              for (let i = 0; i < sourcesValues.length; i++) {
                                  // eslint-disable-next-line max-len
                                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                  valuesToPush.push(sourcesValues[i].shift()!);
                                  if (!sourcesValues[i].length) {
                                      hasValueCount--;
                                  }
                              }
                              sink(Push(valuesToPush as T));
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

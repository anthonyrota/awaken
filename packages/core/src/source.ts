import { Disposable, implDisposableMethods } from './disposable';
import {
    ScheduleFunction,
    scheduleAnimationFrame,
    ScheduleInterval,
    ScheduleTimeout,
} from './schedule';
import { Subject } from './subject';
import { $$Sink, $$Source } from './symbols';
import {
    pipe,
    flow,
    removeOnce,
    asyncReportError,
    forEach,
    identity,
    noop,
    TimeProvider,
} from './util';

/**
 * @public
 */
export type PushType = 0;
/**
 * @public
 */
export const PushType: PushType = 0;
/**
 * @public
 */
export type ThrowType = 1;
/**
 * @public
 */
export const ThrowType: ThrowType = 1;
/**
 * @public
 */
export type EndType = 2;
/**
 * @public
 */
export const EndType: EndType = 2;
/**
 * @public
 */
export type EventType = PushType | ThrowType | EndType;

/**
 * @public
 */
export interface Push<T> {
    readonly type: PushType;
    readonly value: T;
}

/**
 * @public
 */
export interface Throw {
    readonly type: ThrowType;
    readonly error: unknown;
}

/**
 * @public
 */
export interface End {
    readonly type: EndType;
}

/**
 * This is the base construct for distributing values/messages. All things
 * pushed and received to and from {@link (Sink:function)|Sinks} will be events.
 * An event is an object which consists of a `type` field, which determines the
 * type of the event. There are three types of events:
 * {@link (Push:VALUE_ARG)}, {@link (Throw:function)} and
 * {@link End} events:
 *
 * - A Push event represents the "pushing" of a value to a sink, and has a
 *   `value` field equal to the value the event is carrying.
 *
 * - A Throw represents the "throwing" of an error, and has an `error` field
 *   equal to the error the event is carrying. After a Sink receives an Error
 *   event, it will be disposed and will not take any more events.
 *
 * - An End event represents the "end" of a source, and has no additional
 *   properties. After a Sink receives an End event, it will be disposed and
 *   will not take any more events.
 *
 * When determining an event's type, you should **always** use either
 * {@link (PushType:variable)}, {@link (ThrowType:variable)} or
 * {@link (EndType:variable)} directly instead of their constant number values.
 *
 * @example
 * ```
 * const sink = Sink<number>(event => {
 *     console.log(event.type); // Either `PushType`, `ThrowType` or `EndType`.
 *     if (event.type === PushType) {
 *         // In this case event.value this will be of type `number`.
 *         console.log('value:', event.value);
 *     } else if (event.type === ThrowType) {
 *         const error = event.error; // This is of type `unknown`.
 *         console.log('error', event.error);
 *     }
 * });
 * sink(Push(2)); // `${PushType}`, value: 2.
 * sink(Throw(new Error('...'))); // `${ThrowType}`, Error(...).
 * ```
 *
 * @see {@link (Push:VALUE_ARG)}
 * @see {@link (Throw:function)}
 * @see {@link End}
 * @see {@link (PushType:variable)}
 * @see {@link (ThrowType:variable)}
 * @see {@link (EndType:variable)}
 * @see {@link (Source:function)}
 * @see {@link (Sink:function)}
 *
 * @public
 */
export type Event<T> = Push<T> | Throw | End;

/**
 * A Push event represents the "pushing" of a value to a
 * {@link (Sink:function)}, and has a `value` field equal to the value the event
 * is carrying.
 *
 * @param value - The value to send.
 * @returns The created Push event.
 *
 * @example
 * ```
 * const event = Push([1, 2, 3]);
 * console.log(event.type); // `${PushType}`.
 * console.log(event.value); // [1, 2, 3].
 * ```
 *
 * @see {@link Event}
 * @see {@link (Throw:function)}
 * @see {@link End}
 * @see {@link (Source:function)}
 * @see {@link (Sink:function)}
 *
 * {@label NO_ARGS}
 *
 * @public
 */
export function Push<T>(): Push<undefined>;
/**
 * {@label VALUE_ARG}
 *
 * @public
 */
export function Push<T>(value: T): Push<T>;
export function Push<T>(value?: T): Push<T | undefined> {
    return { type: PushType, value };
}

/**
 * A Throw represents the "throwing" of an error, and has an `error` field equal
 * to the error the event is carrying. After a {@link (Sink:function)} receives
 * an Error event, it will be disposed and will not take any more events.
 *
 * @param error - The error to be thrown.
 * @returns The created Throw event.
 *
 * @example
 * ```
 * const event = Throw(new Error(...));
 * console.log(event.type); // `${ThrowType}`.
 * console.log(event.value); // Error(...).
 * ```
 *
 * @see {@link Event}
 * @see {@link (Push:VALUE_ARG)}
 * @see {@link End}
 * @see {@link (Source:function)}
 * @see {@link (Sink:function)}
 *
 * @public
 */
export function Throw(error: unknown): Throw {
    return { type: ThrowType, error };
}

/**
 * An End event represents the "end" of a {@link (Source:function)}, and has no
 * additional properties. After a Sink receives an End event, it will be
 * disposed and will not take any more events.
 *
 * @example
 * ```
 * function onEvent(event: Event<unknown>): void {
 *     console.log(event.type);
 * };
 * const sink = Sink(onEvent);
 * sink(End); // This disposes the sink, then calls `onEvent` above.
 * // Logs:
 * // `${EndType}`
 * ```
 *
 * @see {@link Event}
 * @see {@link (Push:VALUE_ARG)}
 * @see {@link (Throw:function)}
 * @see {@link (Source:function)}
 * @see {@link (Sink:function)}
 *
 * @public
 */
export const End: End = { type: EndType };

/**
 * @public
 */
export interface Sink<T> extends Disposable {
    [$$Sink]: undefined;
    (event: Event<T>): void;
}

/**
 * A Sink is what a {@link (Source:function)} subscribes to. All events emitted
 * by the source will be passed to the sink that has been given to the source.
 *
 * The shape of a Sink is a function which takes an {@link Event} and
 * distributes it to the `onEvent` function as described below. Sinks also
 * implement the {@link (Disposable:function)} construct, and has all of the
 * methods of the Disposable type, and can be treated as a Disposable. This is
 * important as the way to stop a sink (and also unsubscribe the sources
 * subscribed to the sink) is to dispose the sink itself. This also means that
 * the way to cleanup or cancel some process when a Sink stops taking values
 * (for example, when creating a custom Source), is to add a child to the Sink
 * (as done on a disposable), which will then be called when the Sink is
 * disposed. An example of this cancellation ability is say, cancelling a http
 * request.
 *
 * The sink constructor takes an `onEvent` function, which is called every time
 * an event is received. When a sink is disposed, it will stop taking values and
 * will ignore all subsequent events received. As well as this, when the sink is
 * active and when the event received is a ThrowEvent or an EndEvent, then the
 * sink will be disposed and then *after* this the `onEvent` function will
 * called with the given event. If the `onEvent` function throws upon receiving
 * an event, then the sink will immediately be disposed and the error will be
 * thrown asynchronously in a `setTimeout` with delay zero.
 *
 * @param onEvent - The callback for when an event is received.
 * @returns The created Sink.
 *
 * @example
 * ```
 * const sink = Sink<number>(event => {
 *     if (event.type === PushType) {
 *         console.log(event.value);
 *     } else if (event.type === EndType) {
 *         console.log('ended');
 *     }
 * });
 * sink(Push(1));
 * sink(Push(2));
 * sinK(End);
 * // Logs:
 * // 1
 * // 2
 * // ended
 * ```
 *
 * @example
 * ```
 * const sink = Sink<number>(event => {
 *     console.log(event);
 * });
 * sink(Push(1));
 * sink(Throw(new Error('some error was caught')));
 * sink(Push(4)); // Ignored.
 * sink(End); // Ignored.
 * sink(Throw(...)); // Ignored.
 * // Logs:
 * // { type: PushType, value: 1 }
 * // { type: ThrowType, error: Error }
 * ```
 *
 * @example
 * ```
 * const sink = Sink<number>(event => {
 *     if (event.type === PushType && event.value === 5) {
 *         // This means that the Sink will stop receiving values, and all
 *         // disposable children added to this Sink will be disposed, allowing
 *         // for cleanup, for example in sources subscribed to this Sink.
 *         sink.dispose();
 *     }
 *     console.log(event);
 * });
 * for (let i = 0; i < 1_000_000_000 && sink.active; i++) {
 *     // Because the loop above checks if `sink.active` is true at the start of
 *     // every iteration, the loop will be exited when i === 6 before the
 *     // following is called, meaning that the following will never be reached
 *     // when i > 5. This is important as we want to stop iterating after the
 *     // source is disposed, meaning it won't take any more values. This
 *     // optimization prevents us from iterating pointlessly one billion times,
 *     // and instead we only iterate six times, with the `sink.active` check
 *     // breaking the loop on the seventh iteration.
 *     sink(Push(i));
 * }
 * sink(End); // This is ignored.
 * // Logs:
 * // { type: PushType, value: 0 }
 * // { type: PushType, value: 1 }
 * // { type: PushType, value: 2 }
 * // { type: PushType, value: 3 }
 * // { type: PushType, value: 4 }
 * // { type: PushType, value: 5 }
 * // Note: The End event is ignored here, as the sink was disposed upon
 * // receiving the Push(5) event.
 * ```
 *
 * @example
 * ```
 * function onEvent(event: Event<unknown>): void {
 *     console.log(event);
 *     if (event.type === PushType && event.value === 2) {
 *         throw new Error('I don\'t like the value two. Begone.');
 *     }
 * }
 * const sink = Sink<number>(onEvent);
 * for (let i = 0; i < 10 && sink.active; i++) {
 *     // When i === 2, after the event is logged above, `onEvent` will throw an
 *     // error. When this happens, the sink will catch the error and it will be
 *     // thrown asynchronously in a setTimeout. As well as this, the sink will
 *     // be disposed immediately, unsubscribing anything subscribed to it.
 *     // Because the loop above checks if `sink.active` is true at the start of
 *     // every iteration, the loop will be exited when i === 3 before the
 *     // following is called.
 *     sink(Push(i));
 * }
 * sink(End); // This is ignored.
 * // Logs:
 * // { type: PushType, value: 0 }
 * // { type: PushType, value: 1 }
 * // { type: PushType, value: 2 }
 * ```
 *
 * @example
 * ```
 * import { Request, startRequest, cancelRequest } from './my-api.ts';
 *
 * const sink = Sink(() => {});
 * // This is important as, in the case where the sink is disposed later
 * // (meaning it will no longer take events), the request should be cancelled.
 * // Note that in this case, cancelRequest will be called straight after the
 * // sink receives the End event, which happens after the request completes and
 * // the sink has already received a Push event with the result of the request.
 * // However, in this example it is presumed that the cancelRequest function
 * // will do nothing when given an already completed request.
 * sink.add(() => {
 *     cancelRequest(myRequest);
 * });
 * const myRequest = startRequest(result => {
 *     sink(Push(result)));
 *     sink(End);
 * });
 *
 * // Alternatively, if `startRequest` takes a Disposable and will automatically
 * // cancel the request when the disposable is disposed, in a similar manner to
 * // `ScheduleFunction`, we can directly pass the sink to the `startRequest`
 * // function and the request will automatically be cancelled when the sink is
 * // disposed.
 * const sink = Sink(() => {});
 * startRequest(result => {
 *     sink(Push(result));
 *     sink(End)
 * }, sink);
 * ```
 *
 * @example
 * ```
 * // In this example the source emits values 0..49.
 * const source = range(50);
 * const sink = Sink(event => {
 *     console.log(event);
 *     if (event.value === 3) {
 *         sink.dispose();
 *     }
 * })
 * source(sink);
 * // Logs:
 * // Push(0)
 * // Push(1)
 * // Push(2)
 * // Push(3)
 * ```
 *
 * @see {@link (Disposable:function)}
 * @see {@link Event}
 * @see {@link (Source:function)}
 * @see {@link (Subject:function)}
 * @see {@link asyncReportError}
 *
 * @public
 */
export function Sink<T>(onEvent: (event: Event<T>) => void): Sink<T> {
    const disposable = Disposable();
    const sink = implDisposableMethods((event: Event<T>): void => {
        if (!disposable.active) {
            if (event.type === ThrowType) {
                const { error } = event;
                throw new Error(
                    `A Throw event was intercepted by a disposed Sink: ${
                        // eslint-disable-next-line max-len
                        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                        (error instanceof Error && error.stack) || error
                    }`,
                );
            }
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
    sink[$$Sink] = undefined;
    return (sink as unknown) as Sink<T>;
}

/**
 * Determines whether the given value is a Sink.
 * @param value - The value to check.
 * @returns Whether the value is a Sink.
 *
 * @example
 * ```
 * isSink(Sink(() => {})); // true.
 * isSink(Source(() => {})) // false.
 * isSink(Subject()); // true.
 * isSink(Disposable()); // false.
 * isSink({}); // false.
 * isSink(() => {}); // false.
 * isSink(null); // false.
 * ```
 *
 * @see {@link (Sink:function)}
 * @see {@link (Source:function)}
 * @see {@link (Subject:function)}
 * @see {@link (Disposable:function)}
 * @see {@link isDisposable}
 * @see {@link isSource}
 * @see {@link isSubject}
 *
 * @public
 */
export function isSink(value: unknown): value is Sink<unknown> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return value != null && $$Sink in (value as any);
}

export interface Source<T> {
    [$$Source]: undefined;
    (sink: Sink<T>): void;
}

/**
 * A Source is a function which can be subscribed to with a
 * {@link (Sink:function)}. This construct is the basis of all reactive
 * programming done with this library. Sources are by default essentially a lazy
 * push-style stream/observable which will produce new values every
 * subscription. The "lazy" part can be thought of as follows:
 *
 * ```ts
 * function mySource(): void {
 *     return (sink: Sink<mySourceType>) => {
 *         const producer = Producer();
 *         // ...add subscriber to producer.
 *         producer.produce();
 *     }
 * }
 * ```
 *
 * Compared to a less lazy and more eager implementation:
 *
 * ```ts
 * function mySource(): void {
 *     const producer = Producer();
 *     producer.produce();
 *     return (sink: Sink<mySourceType>) => {
 *          // ...add subscriber to producer.
 *     }
 * }
 * ```
 *
 * The shape of a Source is a function which takes a Sink, which will be passed
 * to the "produce" function given at the creation of the Source whose job is to
 * fill up the Sink with values. When the Source is subscribed to, this produce
 * function is called with the sink given to the source. The given produce
 * function should stop trying to emit values to the subscribed sink when the
 * subscribed sink is disposed, and should stop/cleanup any ongoing side
 * processes.
 *
 * If the given (subscribed) sink is disposed (meaning it will not take any more
 * values), then the given produce function will never be called and the sink
 * will just be ignored. On the other hand, if the sink is active, then the
 * given produce function will be called with the sink as the only parameter.
 *
 * However, if the given produce function throws an error during initial
 * execution, the error will be passed to the sink if it is active at the time
 * of throwing (it might not be active in the case where it is disposed inside
 * the given produce function, and then *after* this the given produce function
 * throws), then the error will be passed to the sink as a Throw event,
 * otherwise is will be asynchronously reported through a `setTimeout` with
 * delay zero, similar to how Promises don't synchronously throw errors during
 * construction. Because of this error handling behavior, it is *always* a good
 * practice to wrap any functions called asynchronously after subscription in a
 * try/catch, then to pass the error on in a Throw event to the subscribed sink
 * which can then handle it.
 *
 * The implementation for Source is very basic, and can roughly be thought of as
 * follows:
 *
 * ```ts
 * const Source = produce => sink => {
 *     if (sink.active) {
 *         try { produce(sink) }
 *         catch (error) {
 *             if (sink.active) sink(Throw(error));
 *             else setTimeout(() => { throw error })
 *         }
 *     }
 * }
 * ```
 *
 * @param produce - This will be called with the given sink each subscription.
 *     When the sink is disposed this function should stop trying to emit
 *     values, and should stop/cleanup any ongoing side processes
 * @returns The created Source.
 *
 * @example
 * ```
 * // Creating a Source which synchronously produces values 0..50
 * const source = Source(sink => {
 *     // Note: It is guaranteed (at the start of execution of this function
 *     // at least) that the sink here is active.
 *     for (let i = 0; i <= 50 && sink.active; i++) {
 *         sink(Push(i));
 *     }
 *     // Even if the above loop breaks, and the sink is no longer active, it
 *     // will just ignore this End event, meaning there is no need to check
 *     // whether the sink is active for distributing singular events like this
 *     // at the end of execution.
 *     sink(End);
 * });
 * source(Sink(console.log));
 * source(Sink(console.log));
 * // Logs:
 * // Push(0)
 * // Push(1)
 * // ...
 * // Push(50)
 * // End
 * // Push(0)
 * // Push(1)
 * // ...
 * // Push(50)
 * // End
 * ```
 *
 * @example
 * ```
 * // Creating a Factory function which creates a Source that emits all the
 * // values in the provided array at construction.
 * function fromArray<T>(array: ArrayLike<T>): Source<T> {
 *     return Source(sink => {
 *         for (let i = 0; i < array.length && sink.active; i++) {
 *             sink(Push(array[i]));
 *         }
 *         sink(End);
 *     });
 * }
 * const array = [1, 2];
 * fromArray(array)(Sink(console.log));
 * fromArray(array)(Sink(console.log));
 * // Logs:
 * // Push(1)
 * // Push(2)
 * // End
 * // Push(1)
 * // Push(2)
 * // End
 * ```
 *
 * @example
 * ```
 * // Creating a Source that maps an external api into a reactive one.
 * import { MyExternalSubscriptionToken, myExternalApi } from './myExternalApi';
 * const source = Source(sink => {
 *     let subscriptionToken: { v: MyExternalSubscriptionToken } | undefined;
 *     sink.add(() => {
 *         if (subscriptionToken) {
 *              myExternalApi.cancel(subscriptionToken);
 *         }
 *     })
 *     // In this example myExternalApi may throw.
 *     try {
 *         subscriptionToken = myExternalApi.request((value, error) => {
 *             if (error) {
 *                 sink(Throw(error));
 *                 return;
 *             }
 *             sink(Push(value));
 *             sink(End);
 *         });
 *     } catch (error) {
 *         sink(Throw(error));
 *     }
 * });
 * ```
 *
 * @see {@link (Disposable:function)}
 * @see {@link Event}
 * @see {@link (Sink:function)}
 * @see {@link (Subject:function)}
 * @see {@link asyncReportError}
 *
 * @public
 */
export function Source<T>(produce: (sink: Sink<T>) => void): Source<T> {
    function safeSource(sink: Sink<T>): void {
        if (!sink.active) {
            return;
        }
        try {
            produce(sink);
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

    safeSource[$$Source] = undefined;

    return safeSource as Source<T>;
}

/**
 * Determines whether the given value is a Source.
 * @param value - The value to check.
 * @returns Whether the value is a Source.
 *
 * @example
 * ```
 * isSource(Sink(() => {})); // false.
 * isSource(Source(() => {})); // true.
 * isSource(Subject()); // true.
 * isSource(Disposable()); // false.
 * isSource({}); // false.
 * isSource(() => {}); // false.
 * isSource(null); // false.
 * ```
 *
 * @see {@link (Sink:function)}
 * @see {@link (Source:function)}
 * @see {@link (Subject:function)}
 * @see {@link (Disposable:function)}
 * @see {@link isDisposable}
 * @see {@link isSink}
 * @see {@link isSubject}
 *
 * @public
 */
export function isSource(value: unknown): value is Sink<unknown> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return value != null && $$Source in (value as any);
}

/**
 * Higher order function which takes a sink, and returns another function which
 * receives a source that will be subscribed to using the given sink. This is
 * useful, for example, at the end of pipe calls in order to subscribe to the
 * transformed source.
 *
 * @param sink - The sink to be given to the received source.
 * @returns The higher order function which takes a source to subscribe to.
 *
 * @example
 * ```
 * import { DogPictures, myGetDogPictures } from './myApi.ts';
 * import { MyRequestTimeoutError } from './myRequestTimeoutError.ts';
 * import { myReportError } from './myReportError.ts'
 * import { myUpdateViewWithDogs } from './myUpdateViewWithDogs.ts'
 *
 * const sink = Sink<DogPictures>(event => {
 *     if (event.type === ThrowType) {
 *         myReportError(event.error)
 *     } else if (event.type === EndType) {
 *         return;
 *     }
 *     myUpdateViewWithDogs(event.value)
 * });
 *
 * pipe(
 *     myGetDogPictures(...),
 *     timeoutMs(5000, throwError(() => new MyRequestTimeoutError())),
 *     retry(3),
 *     subscribe(sink)
 * );
 * ```
 *
 * @see {@link (Source:function)}
 * @see {@link (Sink:function)}
 *
 * @public
 */
export function subscribe<T>(
    sink = Sink<T>(noop),
): (source: Source<T>) => void {
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
 *
 * @param array - The array/array-like to iterate over.
 * @returns The created source.
 *
 * @example
 * ```
 * pipe(fromArray([1, 2, 3, 4]), subscribe(Sink(console.log)));
 * // Logs:
 * // Push(1), Push(2), Push(3), Push(4)
 * // End
 * ```
 *
 * @example
 * ```
 * pipe(
 *     fromArray({ length: 5, 0: 'foo', 3: 'bar' }),
 *     subscribe(Sink(console.log))
 * )
 * // Logs:
 * // Push('foo'), Push(undefined), Push(undefined), Push('bar'),
 * // Push(undefined)
 * // End
 * ```
 *
 * @see {@link fromArrayScheduled}
 * @see {@link of}
 *
 * @public
 */
export function fromArray<T>(array: ArrayLike<T>): Source<T> {
    return Source((sink) => {
        pushArrayItemsToSink(array, sink);
        sink(End);
    });
}

/**
 * @public
 */
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

/**
 * Creates a Source from the given values.. The values will be synchronously
 * emitted by the created source upon each subscription.
 *
 * @param values - The values to iterate over.
 * @returns The created source.
 *
 * @example
 * ```
 * pipe(of(1, 2, 3, 4), subscribe(Sink(console.log)));
 * // Logs:
 * // Push(1), Push(2), Push(3), Push(4)
 * // End
 * ```
 *
 * @example
 * ```
 * pipe(of(), subscribe(Sink(console.log)));
 * // Logs:
 * // End
 * ```
 *
 * @see {@link fromArray}
 * @see {@link ofScheduled}
 *
 * @public
 */
export function of<T>(...items: T[]): Source<T> {
    return fromArray(items);
}

/**
 * @public
 */
export function ofScheduled<T>(
    schedule: ScheduleFunction,
    ...items: T[]
): Source<T> {
    return fromArrayScheduled(items, schedule);
}

/**
 * @public
 */
export function ofEvent(event: Throw | End): Source<never>;
/**
 * @public
 */
export function ofEvent<T>(event: Event<T>): Source<T>;
export function ofEvent<T>(event: Event<T>): Source<T> {
    return Source((sink) => {
        sink(event);
        sink(End);
    });
}

/**
 * @public
 */
export function ofEventScheduled<T>(
    event: Throw | End,
    schedule: ScheduleFunction,
): Source<never>;
/**
 * @public
 */
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

/**
 * @public
 */
export function throwError(getError: () => unknown): Source<never> {
    return lazy(() => ofEvent(Throw(getError())));
}

/**
 * @public
 */
export function throwErrorScheduled(
    getError: () => unknown,
    schedule: ScheduleFunction,
): Source<never> {
    return lazy(() => ofEventScheduled(Throw(getError()), schedule));
}

/**
 * @public
 */
export const empty = ofEvent(End);

/**
 * @public
 */
export function emptyScheduled(schedule: ScheduleFunction): Source<never> {
    return ofEventScheduled(End, schedule);
}

/**
 * @public
 */
export function timer(durationMs: number): Source<never> {
    return emptyScheduled(ScheduleTimeout(durationMs));
}

/**
 * @public
 */
export const never = Source(noop);

/**
 * @public
 */
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

/**
 * @public
 */
export function fromAsyncIterable<T>(iterable: AsyncIterable<T>): Source<T> {
    return Source((sink) => {
        void distributeAsyncIterable(iterable, sink);
    });
}

/**
 * @public
 */
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

/**
 * @public
 */
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

/**
 * @public
 */
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

/**
 * @public
 */
export function fromSingularReactiveValue<T, Signal>(
    addCallback: (handler: (value: T) => void) => Signal,
    removeCallback: (
        handler: (value: T) => void,
        signal: { value: Signal } | undefined,
    ) => void,
): Source<T> {
    return pipe(fromReactiveValue(addCallback, removeCallback), pluck(0));
}

const replaceWithValueIndex = map((_, idx: number) => idx);

/**
 * @public
 */
export function interval(delayMs: number): Source<number> {
    return replaceWithValueIndex(
        fromScheduleFunction(ScheduleInterval(delayMs)),
    );
}

/**
 * @public
 */
export const animationFrames: Source<number> = pipe(
    fromScheduleFunction(scheduleAnimationFrame),
    pluck<[number], 0>(0),
);

/**
 * @public
 */
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

/**
 * @public
 */
export function iif<T>(
    condition: () => unknown,
    createSourceIfTrue: () => Source<T>,
    createSourceIfFalse: () => Source<T>,
): Source<T> {
    return lazy(() => {
        return condition() ? createSourceIfTrue() : createSourceIfFalse();
    });
}

/**
 * @public
 */
export function range(count: number, start = 0): Source<number> {
    return Source((sink) => {
        for (let i = 0; sink.active && i < count; i++) {
            sink(Push(start + i));
        }
        sink(End);
    });
}

/**
 * @public
 */
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

/**
 * @public
 */
export function flatSources<T>(...sources: Source<T>[]): Source<T> {
    return flat(fromArray(sources));
}

/**
 * @public
 */
export function mergeSourcesConcurrent<T>(
    max: number,
    ...sources: Source<T>[]
): Source<T> {
    return mergeConcurrent(max)(fromArray(sources));
}

/**
 * @public
 */
export function mergeSources<T>(...sources: Source<T>[]): Source<T> {
    return merge(fromArray(sources));
}

/**
 * @public
 */
export function concatSources<T>(...sources: Source<T>[]): Source<T> {
    return concat(fromArray(sources));
}

// eslint-disable-next-line max-len
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
const noValue: unique symbol = {} as any;

type WrapValuesInSource<T> = { [K in keyof T]: Source<T[K]> };

/**
 * @public
 */
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

/**
 * @public
 */
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

/**
 * @public
 */
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

/**
 * @public
 */
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

/**
 * @public
 */
export interface Operator<T, U> {
    (source: Source<T>): Source<U>;
}

/**
 * @public
 */
export interface IdentityOperator {
    <T>(source: Source<T>): Source<T>;
}

type Unshift<T extends unknown[], U> = ((head: U, ...tail: T) => void) extends (
    ...args: infer A
) => void
    ? A
    : never;

/**
 * @public
 */
export function combineWith<T extends unknown[]>(
    ...sources: WrapValuesInSource<T>
): <U>(source: Source<U>) => Source<Unshift<T, U>> {
    return <U>(source: Source<U>) =>
        combineSources(source, ...sources) as Source<Unshift<T, U>>;
}

/**
 * @public
 */
export function raceWith<T>(
    ...sources: Source<T>[]
): <U>(source: Source<U>) => Source<T | U> {
    return <U>(source: Source<U>) => raceSources<T | U>(source, ...sources);
}

/**
 * @public
 */
export function zipWith<T extends unknown[]>(
    ...sources: WrapValuesInSource<T>
): <U>(source: Source<U>) => Source<Unshift<T, U>> {
    return <U>(source: Source<U>) =>
        zipSources(source, ...sources) as Source<Unshift<T, U>>;
}

function _pluckValue<T>(event: { value: T }): T {
    return event.value;
}

/**
 * @public
 */
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

/**
 * @public
 */
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
 *
 * @param transform - A function which accepts a value and an index. The map
 *     method calls the transform function one time for each Push event of the
 *     given source and passes through the result.
 *
 * @public
 */
export function map<U>(
    transform: <T>(value: T, index: number) => U,
): <T>(source: Source<T>) => Source<U>;
/**
 * @public
 */
export function map<T, U>(
    transform: (value: T, index: number) => U,
): Operator<T, U>;
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
 *
 * @param value - The value to push.
 *
 * @public
 */
export function mapTo<U>(value: U): <T>(source: Source<T>) => Source<U> {
    return map(() => value);
}

/**
 * @public
 */
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

/**
 * @public
 */
export function mapPushEvents<T>(
    transform: (pushEvents: Push<T>, index: number) => Throw | End,
): Operator<T, never>;
/**
 * @public
 */
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

/**
 * @public
 */
export const wrapInPushEvents: <T>(
    source: Source<T>,
) => Source<Event<T>> = mapEvents(<T>(event: Event<T>) => Push(event));

/**
 * @public
 */
export const unwrapFromWrappedPushEvents: <T>(
    source: Source<Event<T>>,
) => Source<T> = mapPushEvents(
    <T>(pushEvent: Push<Event<T>>) => pushEvent.value,
);

/**
 * @public
 */
export function pluck<T, K extends keyof T>(key: K): Operator<T, T[K]> {
    return map((value: T) => value[key]);
}

/**
 * Calls the predicate function for each Push event of the given source, only
 * passing through events whose value meet the condition specified by the
 * predicate function.
 *
 * @param predicate - A function that accepts a value and an index. The filter
 *     method calls this function one time for each Push event of the given
 *     source. If and only if the function returns a truthy value, then the
 *     event will pass through.
 *
 * @public
 */
export function filter<T>(
    predicate: (value: T, index: number) => false,
): Operator<T, never>;
/**
 * @public
 */
export function filter<T, S extends T>(
    predicate: (value: T, index: number) => value is S,
): Operator<T, S>;
/**
 * @public
 */
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

/**
 * @public
 */
export interface WithIndex<T> {
    value: T;
    index: number;
}

/**
 * @public
 */
export function findWithIndex<T, S extends T>(
    predicate: (value: T, index: number) => value is S,
): Operator<T, WithIndex<S>>;
/**
 * @public
 */
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
                filter((value, index_) => {
                    index = index_;
                    return predicate(value, index);
                }),
                first,
                map((value: T) => ({ value, index })),
            )(sink);
        });
}

/**
 * @public
 */
export function find<T, S extends T>(
    predicate: (value: T, index: number) => value is S,
): Operator<T, S>;
/**
 * @public
 */
export function find<T>(
    predicate: (value: T, index: number) => unknown,
): Operator<T, T>;
export function find<T>(
    predicate: (value: T, index: number) => unknown,
): Operator<T, T> {
    return flow(filter(predicate), first);
}

/**
 * @public
 */
export function findIndex<T>(
    predicate: (value: T, index: number) => unknown,
): Operator<T, number> {
    return flow(findWithIndex(predicate), pluck('index'));
}

/**
 * @public
 */
export function at(index: number): IdentityOperator {
    return flow(
        filter((_, idx) => idx === index),
        first,
    );
}

/**
 * @public
 */
export function every<T>(
    predicate: (value: T, index: number) => unknown,
): Operator<T, boolean> {
    return flow(
        filter((value, index) => !predicate(value, index)),
        isEmpty,
    );
}

/**
 * @public
 */
export function some<T>(
    predicate: (value: T, index: number) => unknown,
): Operator<T, boolean> {
    return flow(filter(predicate), first, mapTo(true), defaultIfEmptyTo(false));
}

/**
 * @public
 */
export function finalize(callback: () => void): IdentityOperator {
    return <T>(source: Source<T>) =>
        Source<T>((sink) => {
            sink.add(Disposable(callback));
            source(sink);
        });
}

/**
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ignorePushEvents = filter(<T>(_: T) => false);

/**
 * @public
 */
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
 *
 * @param transform - A function that transforms the previousAccumulatedResult
 *     (last value returned by this function), the currentValue of the emitted
 *     Push event and the currentIndex, and returns an accumulated result.
 * @param initialValue - This is used as the initial value to start the
 *     accumulation. The first call to the transform function provides this
 *     as the previousAccumulatedResult.
 *
 * @public
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
 *
 * @param transform - A function that transforms the previousAccumulatedResult
 *     (last value returned by this function), the currentValue of the emitted
 *     Push event and the currentIndex, and returns an accumulated result.
 * @param initialValue - This is used as the initial value to start the
 *     accumulation. The first call to the transform function provides this
 *     as the previousAccumulatedResult.
 *
 * @public
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

/**
 * @public
 */
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

/**
 * @public
 */
export const max: Operator<number, number> = maxCompare(compareNumbers);

/**
 * @public
 */
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

/**
 * @public
 */
export const min: Operator<number, number> = minCompare(compareNumbers);

/**
 * @public
 */
export function isEqualTo<T, U>(
    otherSource: Source<U>,
    areValuesEqual: (a: T, b: U, index: number) => unknown,
): Operator<T, boolean> {
    return (source) => isEqual(source, otherSource, areValuesEqual);
}

/**
 * @public
 */
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

/**
 * @public
 */
export const mergeMap = _createMergeMapOperator(false);

/**
 * @public
 */
export const expandMap = _createMergeMapOperator(true);

/**
 * @public
 */
export function mergeConcurrent(
    maxConcurrent: number,
): <T>(source: Source<Source<T>>) => Source<T> {
    return mergeMap(identity, maxConcurrent);
}

/**
 * @public
 */
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

/**
 * @public
 */
export const switchEach = _createSwitchOperator(true);

/**
 * @public
 */
export const concatDrop = _createSwitchOperator(false);

/**
 * @public
 */
export function flatWith<T>(
    ...sources: Source<T>[]
): <U>(source: Source<U>) => Source<T | U> {
    return <U>(source: Source<U>) => flatSources<T | U>(source, ...sources);
}

/**
 * @public
 */
export function mergeWithConcurrent<T>(
    max: number,
    ...sources: Source<T>[]
): <U>(source: Source<U>) => Source<T | U> {
    return <U>(source: Source<U>) =>
        mergeSourcesConcurrent<T | U>(max, source, ...sources);
}

/**
 * @public
 */
export function mergeWith<T>(
    ...sources: Source<T>[]
): <U>(source: Source<U>) => Source<T | U> {
    return <U>(source: Source<U>) => mergeSources<T | U>(source, ...sources);
}

/**
 * @public
 */
export function startWithSources<T>(
    ...sources: Source<T>[]
): <U>(source: Source<U>) => Source<T | U> {
    return <U>(source: Source<U>) => concatSources<T | U>(...sources, source);
}

/**
 * @public
 */
export function concatWith<T>(
    ...sources: Source<T>[]
): <U>(source: Source<U>) => Source<T | U> {
    return <U>(source: Source<U>) => concatSources<T | U>(source, ...sources);
}

/**
 * @public
 */
export function flatMap<T, U>(
    transform: (value: T, index: number) => Source<U>,
): Operator<T, U> {
    return flow(map(transform), flat);
}

/**
 * @public
 */
export function concatMap<T, U>(
    transform: (value: T, index: number) => Source<U>,
): Operator<T, U> {
    return mergeMap(transform, 1);
}

/**
 * @public
 */
export const concat = mergeConcurrent(1);

/**
 * @public
 */
export function switchMap<T, U>(
    transform: (value: T, index: number) => Source<U>,
): Operator<T, U> {
    return flow(map(transform), switchEach);
}

/**
 * @public
 */
export function concatDropMap<T, U>(
    transform: (value: T, index: number) => Source<U>,
): Operator<T, U> {
    return flow(map(transform), concatDrop);
}

/**
 * @public
 */
export function startWith<T>(
    ...values: T[]
): <U>(source: Source<U>) => Source<T | U> {
    return <U>(source: Source<U>) =>
        Source<T | U>((sink) => {
            pushArrayItemsToSink(values, sink);
            source(sink);
        });
}

/**
 * @public
 */
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

interface SpyOperators {
    __spy: <T>(onEvent: (event: Event<T>) => void) => Operator<T, T>;
    __spyPush: <T>(onPush: (value: T, index: number) => void) => Operator<T, T>;
    __spyThrow: (onThrow: (error: unknown) => void) => IdentityOperator;
    __spyEnd: (onEnd: () => void) => IdentityOperator;
}

function _createSpyOperators(spyAfter: boolean): SpyOperators {
    function spy<T>(onEvent: (event: Event<T>) => void): Operator<T, T> {
        return (source) =>
            Source((sink) => {
                const sourceSink = Sink<T>((event) => {
                    if (spyAfter) {
                        sink(event);
                    }
                    try {
                        onEvent(event);
                    } catch (error) {
                        sink(Throw(error));
                        return;
                    }
                    if (!spyAfter) {
                        sink(event);
                    }
                });

                sink.add(sourceSink);
                source(sourceSink);
            });
    }

    function spyPush<T>(
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

    function spyThrow(onThrow: (error: unknown) => void): IdentityOperator {
        return spy((event) => {
            if (event.type === ThrowType) {
                onThrow(event.error);
            }
        });
    }

    function spyEnd(onEnd: () => void): IdentityOperator {
        return spy((event) => {
            if (event.type === EndType) {
                onEnd();
            }
        });
    }

    return {
        __spy: spy,
        __spyPush: spyPush,
        __spyThrow: spyThrow,
        __spyEnd: spyEnd,
    };
}

export const {
    __spy: spyBefore,
    __spyPush: spyPushBefore,
    __spyThrow: spyThrowBefore,
    __spyEnd: spyEndBefore,
}: {
    /**
     * @public
     */
    __spy: <T>(onEvent: (event: Event<T>) => void) => Operator<T, T>;
    /**
     * @public
     */
    __spyPush: <T>(onPush: (value: T, index: number) => void) => Operator<T, T>;
    /**
     * @public
     */
    __spyThrow: (onThrow: (error: unknown) => void) => IdentityOperator;
    /**
     * @public
     */
    __spyEnd: (onEnd: () => void) => IdentityOperator;
} = _createSpyOperators(false);

export const {
    __spy: spyAfter,
    __spyPush: spyPushAfter,
    __spyThrow: spyThrowAfter,
    __spyEnd: spyEndAfter,
}: {
    /**
     * @public
     */
    __spy: <T>(onEvent: (event: Event<T>) => void) => Operator<T, T>;
    /**
     * @public
     */
    __spyPush: <T>(onPush: (value: T, index: number) => void) => Operator<T, T>;
    /**
     * @public
     */
    __spyThrow: (onThrow: (error: unknown) => void) => IdentityOperator;
    /**
     * @public
     */
    __spyEnd: (onEnd: () => void) => IdentityOperator;
} = _createSpyOperators(true);

/**
 * @public
 */
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

/**
 * @public
 */
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

/**
 * @public
 */
export function defaultIfEmptyTo<T>(
    value: T,
): <U>(source: Source<U>) => Source<T | U> {
    return defaultIfEmpty(() => value);
}

/**
 * @public
 */
export function throwIfEmpty(getError: () => unknown): IdentityOperator {
    return defaultIfEmpty(() => {
        throw getError();
    });
}

/**
 * @public
 */
export function distinct(): IdentityOperator;
/**
 * @public
 */
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

/**
 * @public
 */
export function distinctFromLast(): IdentityOperator;
/**
 * @public
 */
export function distinctFromLast<T>(
    isDifferent: (keyA: T, keyB: T, currentIndex: number) => unknown,
): Operator<T, T>;
/**
 * @public
 */
export function distinctFromLast<T, K>(
    isDifferent:
        | ((keyA: K, keyB: K, currentIndex: number) => unknown)
        | undefined,
    getKey: (value: T) => K,
): Operator<T, T>;
/**
 * @public
 */
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

/**
 * @public
 */
export function groupBy<T, K>(
    getKey: (value: T, index: number) => K,
    Subject_ = Subject,
    removeGroupWhenNoSubscribers = true,
): Operator<T, GroupSource<T, K>> {
    return (source) =>
        Source((sink) => {
            const groups: GroupSourceImplementation<T, K>[] = [];
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

                    let group: GroupSourceImplementation<T, K> | undefined;
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

interface GroupSourceImplementation<T, K> extends Source<T> {
    __subject: Subject<T>;
    key: K | null;
    removed: boolean;
    remove(): void;
}

interface GroupSourceBase<T> extends Source<T> {
    remove(): void;
}

/**
 * @public
 */
export interface ActiveGroupSource<T, K> extends GroupSourceBase<T> {
    removed: false;
    key: K;
}

/**
 * @public
 */
export interface RemovedGroupSource<T> extends GroupSourceBase<T> {
    removed: true;
    key: null;
}

/**
 * @public
 */
export type GroupSource<T, K> = ActiveGroupSource<T, K> | RemovedGroupSource<T>;

function GroupSource<T, K>(
    key: K,
    groups: GroupSourceImplementation<T, K>[],
    Subject_: typeof Subject,
    removeGroupWhenNoSubscribers: boolean,
): GroupSourceImplementation<T, K> {
    const subject = Subject_<T>();
    let source: GroupSourceImplementation<T, K>;

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
        }) as GroupSourceImplementation<T, K>;
    } else {
        source = Source(subject) as GroupSourceImplementation<T, K>;
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

/**
 * @public
 */
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

/**
 * @public
 */
export const first = take(1);

/**
 * Calls the shouldContinue function for each Push event of the given source.
 * The returned source will emit an End event instead of the received Push event
 * when the given shouldContinue function returns a falsy value.
 *
 * @param shouldContinue - A function that accepts a value and an index. The
 *     takeWhile method calls this function one time for each Push event of the
 *     given source.
 *
 * @public
 */
export function takeWhile<T, S extends T>(
    shouldContinue: (value: T, index: number) => value is S,
): Operator<T, S>;
/**
 * @public
 */
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
 *
 * @param amount - The amount of events to keep and distribute at the end.
 *
 * @public
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

/**
 * @public
 */
export const last = takeLast(1);

/**
 * @public
 */
export const count: <T>(source: Source<T>) => Source<number> = flow(
    replaceWithValueIndex,
    last,
);

/**
 * @public
 */
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

/**
 * @public
 */
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

/**
 * @public
 */
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

/**
 * @public
 */
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

/**
 * @public
 */
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

/**
 * @public
 */
export const repeat = _createRepeatOperator(EndType);

/**
 * @public
 */
export const retry = _createRepeatOperator(ThrowType);

/**
 * @public
 */
export const loop = repeat(Infinity);

/**
 * @public
 */
export const retryAlways = retry(Infinity);

/**
 * @public
 */
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

/**
 * @public
 */
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

/**
 * @public
 */
export function timeoutMs<T>(
    ms: number,
    replacementSource: Source<T>,
): <U>(source: Source<U>) => Source<T | U> {
    return timeout(timer(ms), replacementSource);
}

/**
 * @public
 */
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

/**
 * @public
 */
export function windowEvery(
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

/**
 * @public
 */
export function windowControlled(
    getWindowOpeningsSource: <T>(sharedSource: Source<T>) => Source<unknown>,
    getWindowClosingSource: <T>(currentWindow: Source<T>) => Source<unknown>,
): <T>(source: Source<T>) => Source<Source<T>>;
/**
 * @public
 */
export function windowControlled<T>(
    getWindowOpeningsSource: (sharedSource: Source<T>) => Source<unknown>,
    getWindowClosingSource: (currentWindow: Source<T>) => Source<unknown>,
): (source: Source<T>) => Source<Source<T>>;
export function windowControlled<T>(
    getWindowOpeningsSource: (sharedSource: Source<T>) => Source<unknown>,
    getWindowClosingSource: (currentWindow: Source<T>) => Source<unknown>,
): (source: Source<T>) => Source<Source<T>> {
    return (source: Source<T>) =>
        Source<Source<T>>((sink) => {
            const sharedSource = Subject<T>();

            let windowOpeningsSource: Source<unknown>;
            try {
                windowOpeningsSource = getWindowOpeningsSource(sharedSource);
            } catch (error) {
                sink(Throw(error));
                return;
            }

            let active = 0;
            const windowOpeningsSink = Sink<unknown>((event) => {
                if (event.type === PushType) {
                    const window = Subject<T>();
                    sharedSource(window);
                    let windowClosingSource: Source<unknown>;
                    try {
                        windowClosingSource = getWindowClosingSource(window);
                    } catch (error) {
                        sink(Throw(error));
                        return;
                    }
                    active++;
                    const windowClosingSink = Sink<unknown>((event) => {
                        if (event.type === ThrowType) {
                            sink(event);
                            return;
                        }
                        active--;
                        windowClosingSink.dispose();
                        window(End);
                    });
                    sourceSink.add(windowClosingSink);
                    windowClosingSource(windowClosingSink);
                    if (windowClosingSink.active) {
                        sink(Push(window));
                    }
                    return;
                }

                if (event.type === EndType && active !== 0) {
                    return;
                }

                sink(event);
            });
            sink.add(windowOpeningsSink);
            windowOpeningsSource(windowOpeningsSink);

            const sourceSink = Sink<T>((event) => {
                sharedSource(event);
                if (event.type !== PushType) {
                    sink(event);
                }
            });
            sink.add(sourceSink);
            source(sourceSink);
        });
}

/**
 * @public
 */
export function windowEach(
    getWindowClosingSource: <T>(currentWindow: Source<T>) => Source<unknown>,
): <T>(source: Source<T>) => Source<Source<T>>;
/**
 * @public
 */
export function windowEach<T>(
    getWindowClosingSource: (currentWindow: Source<T>) => Source<unknown>,
): (source: Source<T>) => Source<Source<T>>;
export function windowEach<T>(
    getWindowClosingSource: (currentWindow: Source<T>) => Source<unknown>,
): (source: Source<T>) => Source<Source<T>> {
    return (source: Source<T>): Source<Source<T>> =>
        lazy(() => {
            const newWindow = Subject<undefined>();
            return pipe(
                source,
                windowControlled(
                    () => pipe(newWindow, startWith(undefined)),
                    flow(
                        getWindowClosingSource,
                        spyEndAfter(() => {
                            newWindow(Push());
                        }),
                    ),
                ),
            );
        });
}

/**
 * @public
 */
export function windowCount(
    maxWindowLength: number,
    createEvery?: number,
): <T>(source: Source<T>) => Source<Source<T>> {
    const getWindowClosingSource = flow(
        take(maxWindowLength),
        ignorePushEvents,
    );
    if (createEvery) {
        return windowControlled(
            filter((_, index: number) => (index + 1) % createEvery === 0),
            getWindowClosingSource,
        );
    }
    return windowEach(getWindowClosingSource);
}

/**
 * @public
 */
export function windowTime(
    maxWindowDuration?: number | null,
    creationInterval?: number | null,
    maxWindowLength = Infinity,
): <T>(source: Source<T>) => Source<Source<T>> {
    const takeMaxAndIgnorePush = flow(take(maxWindowLength), ignorePushEvents);
    const getWindowClosingSource =
        maxWindowDuration == null
            ? takeMaxAndIgnorePush
            : flow(takeMaxAndIgnorePush, timeoutMs(maxWindowDuration, empty));
    if (creationInterval == null) {
        return windowEach(getWindowClosingSource);
    }
    return windowControlled(
        () => pipe(interval(creationInterval), startWith(undefined)),
        getWindowClosingSource,
    );
}

/**
 * @public
 */
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

/**
 * @public
 */
export type DebounceTrailingRestart = 'restart';
/**
 * @public
 */
export const DebounceTrailingRestart: DebounceTrailingRestart = 'restart';

/**
 * @public
 */
export interface DebounceConfig {
    leading?: boolean | null;
    trailing?: boolean | DebounceTrailingRestart | null;
    emitPendingOnEnd?: boolean | null;
}

/**
 * @public
 */
export const defaultDebounceConfig: DebounceConfig = {
    leading: false,
    trailing: true,
    emitPendingOnEnd: true,
};

/**
 * @public
 */
export type InitialDurationInfo =
    | [
          /* durationSource */ Source<unknown>,
          /* maxDurationSource */ (Source<unknown> | undefined | null)?,
      ]
    | [
          /* durationSource */ undefined | null,
          /* maxDurationSource */ Source<unknown>,
      ];

/**
 * @public
 */
export function debounce<T>(
    getDurationSource: (value: T, index: number) => Source<unknown>,
    getInitialDurationRange?:
        | ((firstDebouncedValue: T, index: number) => InitialDurationInfo)
        | null,
    config?: DebounceConfig | null,
): Operator<T, T>;
/**
 * @public
 */
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

/**
 * @public
 */
export function debounceMs(
    durationMs: number,
    maxDurationMs?: number | null,
    config?: DebounceConfig | null,
): IdentityOperator;
/**
 * @public
 */
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

/**
 * @public
 */
export interface ThrottleConfig {
    leading?: boolean | null;
    trailing?: boolean | null;
    emitPendingOnEnd?: boolean | null;
}

/**
 * @public
 */
export const defaultThrottleConfig: ThrottleConfig = {
    leading: true,
    trailing: true,
    emitPendingOnEnd: true,
};

/**
 * @public
 */
export function throttle(
    getDurationSource: () => Source<unknown>,
    config?: ThrottleConfig | null,
): IdentityOperator;
/**
 * @public
 */
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

/**
 * @public
 */
export function throttleMs(
    durationMs: number,
    config?: ThrottleConfig | null,
): IdentityOperator {
    const durationSource = timer(durationMs);
    return throttle(() => durationSource, config);
}

/**
 * @public
 */
export function delay<T>(
    getDelaySource: (value: T, index: number) => Source<unknown>,
): Operator<T, T>;
/**
 * @public
 */
export function delay(
    getDelaySource: <T>(value: T, index: number) => Source<unknown>,
): IdentityOperator;
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

/**
 * @public
 */
export function delayMs(ms: number): IdentityOperator {
    const delaySource = timer(ms);
    return delay(() => delaySource);
}

/**
 * @public
 */
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

/**
 * @public
 */
export function sampleMs(ms: number): IdentityOperator {
    return sample(interval(ms));
}

/**
 * @public
 */
export interface WithTime<T> {
    value: T;
    time: number;
}

/**
 * @public
 */
export function withTime<T>(
    provideTime: TimeProvider,
): Operator<T, WithTime<T>> {
    return map((value: T) => ({ value, time: provideTime() }));
}

/**
 * @public
 */
export interface TimeInterval<T> {
    value: T;
    time: number;
    startTime: number;
    timeSinceStart: number;
    lastTime: number;
    timeDifference: number;
}

/**
 * @public
 */
export function withTimeInterval<T>(
    provideTime: TimeProvider,
): Operator<T, TimeInterval<T>> {
    return (source) =>
        Source((sink) => {
            const startTime = provideTime();
            let lastTime = startTime;

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

/**
 * @public
 */
export function schedulePushEvents(
    schedule: ScheduleFunction,
): IdentityOperator {
    const delaySource = emptyScheduled(schedule);
    return delay(() => delaySource);
}

/**
 * @public
 */
export function scheduleSubscription(
    schedule: ScheduleFunction,
): IdentityOperator {
    return <T>(source: Source<T>) =>
        concatSources(emptyScheduled(schedule), source);
}

/**
 * @public
 */
export interface ControllableSource<T> extends Source<T> {
    produce(): void;
}

/**
 * @public
 */
export function shareControlled<T>(
    Subject_: () => Subject<T>,
): (source: Source<T>) => ControllableSource<T>;
/**
 * @public
 */
export function shareControlled(
    Subject_?: typeof Subject,
): <T>(source: Source<T>) => ControllableSource<T>;
export function shareControlled(
    Subject_ = Subject,
): <T>(source: Source<T>) => ControllableSource<T> {
    return <T>(source: Source<T>) => {
        let subject: Subject<T> | undefined;

        const controllable = Source<T>((sink) => {
            if (!subject || !subject.active) {
                subject = Subject_();
            }
            subject(sink);
        }) as ControllableSource<T>;

        function produce(): void {
            if (!subject || !subject.active) {
                subject = Subject_();
            }
            source(subject);
        }

        controllable.produce = produce;

        return controllable;
    };
}

/**
 * @public
 */
export function share<T>(Subject_: () => Subject<T>): Operator<T, T>;
/**
 * @public
 */
export function share(Subject_?: typeof Subject): IdentityOperator;
export function share(Subject_ = Subject): IdentityOperator {
    return <T>(source: Source<T>): Source<T> => {
        let subject: Subject<T>;
        const shared = pipe(
            source,
            shareControlled(() => {
                subject = Subject_();
                return subject;
            }),
        );
        let subscriberCount = 0;

        return Source((sink) => {
            sink.add(
                Disposable(() => {
                    subscriberCount--;
                    if (subscriberCount === 0) {
                        subject.dispose();
                    }
                }),
            );
            const _subscriberCount = subscriberCount;
            subscriberCount++;
            shared(sink);
            if (_subscriberCount === 0 && subscriberCount !== 0) {
                shared.produce();
            }
        });
    };
}

/**
 * @public
 */
export function shareOnce<T>(Subject_: () => Subject<T>): Operator<T, T>;
/**
 * @public
 */
export function shareOnce(Subject_?: typeof Subject): IdentityOperator;
export function shareOnce(Subject_ = Subject): IdentityOperator {
    return <T>(source: Source<T>): Source<T> => {
        const subject = Subject_<T>();
        return pipe(
            source,
            share(() => subject),
        );
    };
}

/**
 * @public
 */
export function sharePersist<T>(Subject_: () => Subject<T>): Operator<T, T>;
/**
 * @public
 */
export function sharePersist(Subject_?: typeof Subject): IdentityOperator;
export function sharePersist(Subject_ = Subject): IdentityOperator {
    return <T>(source: Source<T>): Source<T> => {
        let subject: Subject<T> | undefined;
        const shared = pipe(
            source,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            shareControlled(() => subject!),
        );

        return Source((sink) => {
            if (!subject) {
                subject = Subject_();
            }
            shared(sink);
            shared.produce();
        });
    };
}

/**
 * @public
 */
export function shareTransform<T, U>(
    Subject_: () => Subject<T>,
    transform: (shared: Source<T>) => Source<U>,
): Operator<T, U>;
/**
 * @public
 */
export function shareTransform<U>(
    Subject_: typeof Subject,
    transform: <T>(source: Source<T>) => Source<U>,
): <T>(shared: Source<T>) => Source<U>;
export function shareTransform<T, U>(
    Subject_: () => Subject<T>,
    transform: (shared: Source<T>) => Source<U>,
): Operator<T, U> {
    return (source) =>
        Source((sink) => {
            const subject = Subject_();
            let transformed: Source<U>;
            try {
                transformed = transform(subject);
            } catch (error) {
                sink(Throw(error));
                return;
            }
            transformed(sink);
            sink.add(subject);
            source(subject);
        });
}

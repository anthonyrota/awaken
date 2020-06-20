import { Disposable, implDisposable } from './disposable';
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

/**
 * Creates a Source from the given array/array-like. The values of the array
 * will be synchronously emitted by the created source upon each susbcription.
 * @param array The array/array-like to iterate over.
 * @returns The created source.
 */
export function fromArray<T>(array: ArrayLike<T>): Source<T> {
    return Source((sink) => {
        for (let i = 0; i < array.length && sink.active; i++) {
            sink(Push(array[i]));
        }
        sink(End);
    });
}

export const empty = Source<never>((sink) => {
    sink(End);
});

import { Disposable } from './disposable';
import { asyncReportError } from './utils';

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
export interface Sink<T> {
    (event: Event<T>): void;
}

/**
 * A Source is a function which can be subscribed to with a sink and optionally
 * a subscription. The source will emit values to the given sink, and will stop
 * when the given subscription is disposed.
 */
export interface Source<T> {
    (sink: Sink<T>, subscription?: Disposable): void;
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
export function Source<T>(
    base: (
        safeSink: (event: Event<T>) => void,
        subscription: Disposable,
    ) => void,
): Source<T> {
    function safeSource(sink: Sink<T>, subscription?: Disposable): void {
        if (subscription?.active === false) {
            return;
        }

        const downstreamSubscription = new Disposable();
        subscription?.add(downstreamSubscription);

        function safeSink(event: Event<T>): void {
            // This check is necessary in case a dispose method is queued to
            // subscription before downstreamSubscription and calls this
            // function, meaning downstreamSubscription is active but the given
            // subscription is not active.
            if (subscription?.active === false) {
                downstreamSubscription.dispose();
                return;
            }

            if (!downstreamSubscription.active) {
                return;
            }

            if (event.type !== EventType.Push) {
                downstreamSubscription.dispose();
            }

            try {
                sink(event);
            } catch (error) {
                downstreamSubscription.dispose();
                asyncReportError(error);
            }
        }

        try {
            base(safeSink, downstreamSubscription);
        } catch (error) {
            safeSink(Throw(error));
        }
    }

    return safeSource;
}

/**
 * Higher order function which takes a sink and a subscription, and returns
 * another function which receives a source that will be subscribed to using the
 * given sink and subscription. This is useful, for example, at the end of pipe
 * calls in order to subscribe to the transformed source.
 * @param sink The sink to be given to the received source.
 * @param subscription The subscription to be given to the received source.
 * @returns The higher order function which takes a source to subscribe to.
 */
export function subscribe<T>(
    sink: Sink<T>,
    subscription: Disposable,
): (source: Source<T>) => void {
    return (source) => source(sink, subscription);
}

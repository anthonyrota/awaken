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
 */
export function Push<T>(value: T): Push<T> {
    return { type: EventType.Push, value };
}

/**
 * Creates a Throw event.
 * @param error The error to be thrown.
 */
export function Throw(error: unknown): Throw {
    return { type: EventType.Throw, error };
}

export const End: End = { type: EventType.End };

/**
 * A Sink is what a Source subscribes to. All events emitted by the source will
 * be received by the sink that is given to the source. A Sink has two
 * parameters: the event which has been received and the subscription used to
 * subscribe to the source.
 */
export interface Sink<T> {
    (event: Event<T>, sourceSubscription: Disposable): void;
}

/**
 * A Source is a function which can be subscribed to with a sink and optionally
 * a subscription. The source will emit values to the given sink, and will stop
 * when the given subscription is disposed.
 */
export interface Source<T> {
    readonly '': unique symbol;
    (sink: Sink<T>, subscription?: Disposable): void;
}

/**
 * Creates a Source. A Source is a function which can be subscribed to with a
 * sink and optionally a subscription. The source will emit values to the given
 * sink, and will stop when the given subscription is disposed.
 * @param base This will be called with a "safeSink" and a subscription when the
 *     source is subscribed to. The safeSink is a sink which can be receive
 *     events and does not have to be called with a sourceSubscription. When the
 *     given subscription is disposed, the safeSink will ignore all events of
 *     the events it receives.
 */
export function Source<T>(
    base: (
        safeSink: (event: Event<T>) => void,
        subscription: Disposable,
    ) => void,
): Source<T> {
    function safeSource(sink: Sink<T>, subscription = new Disposable()): void {
        if (!subscription.active) {
            return;
        }

        const downstreamSubscription = new Disposable();
        subscription.add(downstreamSubscription);

        function safeSink(event: Event<T>): void {
            if (!downstreamSubscription.active) {
                return;
            }

            if (event.type !== EventType.Push) {
                downstreamSubscription.dispose();
            }

            try {
                sink(event, subscription);
            } catch (error) {
                asyncReportError(error);
            }
        }

        try {
            base(safeSink, downstreamSubscription);
        } catch (error) {
            safeSink(Throw(error));
        }
    }

    return safeSource as Source<T>;
}

/**
 * Higher order function which takes a sink and a subscription, and returns
 * another function which receives a source that will be subscribed to using the
 * given sink and subscription. This is useful, for example, at the end of pipe
 * calls.
 * @param sink The sink to be given to the received source.
 * @param subscription The subscription to be given to the received source.
 */
export function subscribe<T>(
    sink: Sink<T>,
    subscription: Disposable,
): (source: Source<T>) => void {
    return (source) => source(sink, subscription);
}

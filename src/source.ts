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
    (sink: Sink<T>, subscription?: Disposable): void;
}

/**
 * Creates a Source. A Source is a function which can be subscribed to with a
 * sink and optionally a subscription. The source will emit values to the given
 * sink, and will stop when the given subscription is disposed.
 * @param base This will be called with a "safeSink" and a subscription when the
 *     source is subscribed to. The safeSink is a modified version of a sink
 *     which takes an event and does not have to be called with a
 *     sourceSubscription. When the given subscription is disposed, the safeSink
 *     will stop taking events. If the subscription passed to the given base is
 *     disposed by the given base, then an error will be thrown.
 * @returns The created source.
 * @see {@link SubscriptionDisposedInBaseError}
 */
export function Source<T>(
    base: (
        safeSink: (event: Event<T>) => void,
        subscription: Disposable,
    ) => void,
): Source<T> {
    let isDownstreamSubscriptionDisposalExpected: true | undefined;

    function safeSource(sink: Sink<T>, subscription?: Disposable): void {
        if (subscription?.active === false) {
            return;
        }

        const downstreamSubscription = new Disposable();
        downstreamSubscription.add(() => {
            if (
                !isDownstreamSubscriptionDisposalExpected &&
                subscription?.active !== false
            ) {
                throw new SubscriptionDisposedInBaseError();
            }
        });
        subscription?.add(downstreamSubscription);

        function safeSink(event: Event<T>): void {
            // The reason why we check if the subscription is active and not
            // downstreamSubscription is in the case where a dispose method
            // queued to subscription before downstreamSubscription calls this
            // function, meaning downstreamSubscription is active but the given
            // subscription is not active.
            if (subscription?.active === false) {
                downstreamSubscription.dispose();
                return;
            }

            if (event.type !== EventType.Push) {
                isDownstreamSubscriptionDisposalExpected = true;
                downstreamSubscription.dispose();
            }

            try {
                sink(event, downstreamSubscription);
            } catch (error) {
                isDownstreamSubscriptionDisposalExpected = true;
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
 * Thrown when the "base" function passed to the Source constructor disposes the
 * subscription given to it.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SubscriptionDisposedInBaseError extends Error {}

export interface SubscriptionDisposedInBaseErrorConstructor {
    new (): SubscriptionDisposedInBaseError;
    prototype: SubscriptionDisposedInBaseError;
}

export const SubscriptionDisposedInBaseError = (function (
    this: SubscriptionDisposedInBaseError,
) {
    Error.call(this);
    this.name = 'SubscriptionDisposedInBaseError';
    this.message =
        'Unexpected disposal of the subscription passed to the base function of the Source constructor.';
    this.stack = new Error().stack;
} as unknown) as SubscriptionDisposedInBaseErrorConstructor;

SubscriptionDisposedInBaseError.prototype = Object.create(
    Error.prototype,
) as SubscriptionDisposedInBaseError;
// eslint-disable-next-line max-len
SubscriptionDisposedInBaseError.prototype.constructor = SubscriptionDisposedInBaseError;

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

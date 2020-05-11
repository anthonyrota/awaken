import { Disposable } from './disposable';
import { asyncReportError } from './utils';

export const enum EventType {
    Push = 0,
    Throw = 1,
    End = 2,
}

export interface Push<T> {
    readonly type: EventType.Push;
    readonly value: T;
}

export interface Throw {
    readonly type: EventType.Throw;
    readonly error: unknown;
}

export interface End {
    readonly type: EventType.End;
}

export type Event<T> = Push<T> | Throw | End;

export function Push<T>(value: T): Push<T> {
    return { type: EventType.Push, value };
}

export function Throw(error: unknown): Throw {
    return { type: EventType.Throw, error };
}

export const End: End = { type: EventType.End };

export interface Sink<T> {
    (event: Event<T>, sourceSubscription: Disposable): void;
}

export interface Source<T> {
    readonly '': unique symbol;
    (sink: Sink<T>, subscription?: Disposable): void;
}

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

export function subscribe<T>(
    sink: Sink<T>,
    subscription: Disposable,
): (source: Source<T>) => void {
    return (source) => source(sink, subscription);
}

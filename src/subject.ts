import { Disposable, DISPOSED } from './disposable';
import { removeOnce, asyncReportError } from './utils';
import { EventType, Event, Throw, End, Source, Sink } from './source';
import isFunction = require('lodash.isfunction');

export interface Subject<T> extends Source<T> {
    (event: Event<T>): void;
}

interface SinkInfo<T> {
    sink: Sink<T>;
    subscription: Disposable;
    didRemove: boolean;
}

export function SubjectBase<T>(subscription?: Disposable): Subject<T> {
    let sinks: SinkInfo<T>[] | null = [];

    function base(event: Event<T>): void;
    function base(sink: Sink<T>, subscription?: Disposable): void;
    function base(
        eventOrSink: Event<T> | Sink<T>,
        maybeSubscription?: Disposable,
    ): void {
        if (!sinks || subscription?.active === false) {
            return;
        }

        if (isFunction(eventOrSink)) {
            if (maybeSubscription?.active === false) {
                return;
            }

            const sinkSubscription = new Disposable();
            maybeSubscription?.add(sinkSubscription);

            const sinkInfo: SinkInfo<T> = {
                sink: eventOrSink,
                subscription: sinkSubscription,
                didRemove: false,
            };

            sinks.push(sinkInfo);
            sinkSubscription?.add(() => {
                if (sinks && !sinkInfo.didRemove) {
                    sinkInfo.didRemove = true;
                    removeOnce(sinks, sinkInfo);
                }
            });
        } else if (sinks.length > 0) {
            const copy = sinks.slice();

            if (eventOrSink.type !== EventType.Push) {
                sinks = null;
            }

            copy.forEach(({ sink, subscription }) => {
                try {
                    sink(eventOrSink, subscription);
                } catch (error) {
                    sinks = null;
                    throw error;
                }
            });
        }
    }

    return base;
}

export function Subject<T>(subscription?: Disposable): Subject<T> {
    const base: Subject<T> = SubjectBase<T>(subscription);
    let finalEvent: Throw | End | null | undefined;

    function subject(event: Event<T>): void;
    function subject(sink: Sink<T>, subscription?: Disposable): void;
    function subject(
        eventOrSink: Event<T> | Sink<T>,
        maybeSubscription?: Disposable,
    ): void {
        if (finalEvent === null) {
            return;
        }

        if (isFunction(eventOrSink)) {
            if (finalEvent) {
                if (maybeSubscription?.active !== false) {
                    eventOrSink(finalEvent, DISPOSED);
                }
            } else {
                base(eventOrSink, maybeSubscription);
            }
        } else {
            if (eventOrSink.type !== EventType.Push) {
                finalEvent = eventOrSink;
            }

            try {
                base(eventOrSink);
            } catch (error) {
                finalEvent = null;
                asyncReportError(error);
            }
        }
    }

    return subject;
}

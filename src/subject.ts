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

interface EventQueueItem<T> {
    event: Event<T>;
    sinks: SinkInfo<T>[];
}

export function SubjectBase<T>(subscription?: Disposable): Subject<T> {
    let sinks: SinkInfo<T>[] | null = [];
    let distributingEvent = false;
    const eventsQueue: EventQueueItem<T>[] = [];

    function base(event: Event<T>): void;
    function base(sink: Sink<T>, subscription?: Disposable): void;
    function base(
        eventOrSink: Event<T> | Sink<T>,
        maybeSubscription?: Disposable,
    ): void {
        if (!sinks || (subscription && !subscription.active)) {
            return;
        }

        if (isFunction(eventOrSink)) {
            if (maybeSubscription && !maybeSubscription.active) {
                return;
            }

            const sinkSubscription = new Disposable();
            maybeSubscription?.add(sinkSubscription);

            const sinkInfo: SinkInfo<T> = {
                sink: eventOrSink,
                subscription: sinkSubscription,
                didRemove: false,
            };

            sinkSubscription?.add(() => {
                if (sinks && !sinkInfo.didRemove) {
                    sinkInfo.didRemove = true;
                    removeOnce(sinks, sinkInfo);
                }
            });

            sinks.push(sinkInfo);
        } else if (sinks.length > 0) {
            const copy = sinks.slice();

            if (eventOrSink.type !== EventType.Push) {
                sinks = null;
            }

            let queueItem: EventQueueItem<T> | undefined = {
                event: eventOrSink,
                sinks: copy,
            };

            if (distributingEvent) {
                eventsQueue.push(queueItem);
                return;
            }

            distributingEvent = true;
            while (queueItem) {
                const { event, sinks: queueItemSinks } = queueItem;
                queueItemSinks.forEach(({ sink, subscription }) => {
                    try {
                        sink(event, subscription);
                    } catch (error) {
                        distributingEvent = false;
                        sinks = null;
                        eventsQueue.length = 0;
                        throw error;
                    }
                });
                queueItem = eventsQueue.shift();
            }
            distributingEvent = false;
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
                if (!(maybeSubscription && !maybeSubscription.active)) {
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

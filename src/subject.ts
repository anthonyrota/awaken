import { Disposable } from './disposable';
import { removeOnce, asyncReportError } from './utils';
import { EventType, Event, Throw, End, Source, Sink } from './source';
import isFunction = require('lodash.isfunction');

export interface Subject<T> extends Source<T>, Sink<T> {}

interface SinkInfo<T> {
    sink: Sink<T>;
    maybeSubscription?: Disposable;
    didRemove: boolean;
}

interface SubjectBasePrivateActiveState<T> {
    receivedLastEvent: boolean;
    sinkInfos: SinkInfo<T>[];
    eventsQueue: Event<T>[];
}

export function Subject<T>(subscription?: Disposable): Subject<T> {
    let distributingEvent = false;
    let state: SubjectBasePrivateActiveState<T> | null = {
        receivedLastEvent: false,
        sinkInfos: [],
        eventsQueue: [],
    };

    function disposeState(): void {
        if (state) {
            const { sinkInfos, eventsQueue } = state;
            sinkInfos.length = 0;
            eventsQueue.length = 0;
            state = null;
        }
    }

    subscription?.add(disposeState);

    function base(event: Event<T>): void;
    function base(sink: Sink<T>, subscription?: Disposable): void;
    function base(
        eventOrSink: Event<T> | Sink<T>,
        maybeSubscription?: Disposable,
    ): void {
        if (state === null) {
            return;
        }

        // If a dispose method queued before the function added to the
        // subscription above calls this function, then the subscription will
        // not be active but the state will still exist.
        if (subscription?.active === false) {
            disposeState();
            return;
        }

        const { sinkInfos, eventsQueue } = state;

        if (isFunction(eventOrSink)) {
            if (maybeSubscription?.active === false) {
                return;
            }

            const sinkInfo: SinkInfo<T> = {
                sink: eventOrSink,
                maybeSubscription,
                didRemove: false,
            };

            sinkInfos.push(sinkInfo);

            maybeSubscription?.add(() => {
                if (subscription?.active !== false && !sinkInfo.didRemove) {
                    sinkInfo.didRemove = true;
                    // Only remove the sink if not currently distributing an
                    // event as removing it here will mess up the loop below.
                    if (!distributingEvent) {
                        removeOnce(sinkInfos, sinkInfo);
                    }
                }
            });
        } else if (sinkInfos.length > 0) {
            if (state.receivedLastEvent) {
                return;
            }

            if (eventOrSink.type !== EventType.Push) {
                state.receivedLastEvent = true;
            }

            if (distributingEvent) {
                eventsQueue.push(eventOrSink);
                return;
            }

            let event: Event<T> | undefined = eventOrSink;

            distributingEvent = true;
            while (event) {
                for (let i = 0; i < sinkInfos.length; i++) {
                    const sinkInfo = sinkInfos[i];
                    const { sink, maybeSubscription, didRemove } = sinkInfo;

                    if (
                        didRemove ||
                        // This check is necessary in case a dispose method
                        // queued to the given maybeSubscription before the
                        // callback which removes the sink above calls this
                        // subject with a new event, meaning this sink has not
                        // been removed from the list of sinks yet.
                        maybeSubscription?.active === false
                    ) {
                        sinkInfo.didRemove = true;
                        // Only remove if the current event is a Push event as
                        // if the current event is a Throw or End event then
                        // there is no point in removing it now as it will be
                        // removed at the end of the loop.
                        if (event.type === EventType.Push) {
                            sinkInfos.splice(i--, 1);
                        }
                    }

                    try {
                        sink(event);
                    } catch (error) {
                        asyncReportError(error);
                        sinkInfo.didRemove = true;
                    }

                    // The subscription could have been disposed in the
                    // execution of the sink.
                    if (
                        (subscription?.active as boolean | undefined) === false
                    ) {
                        return;
                    }

                    // It is possible that during the execution of the sink it
                    // was removed. This will also execute if the sink errored
                    // above.
                    if (sinkInfo.didRemove && event.type === EventType.Push) {
                        sinkInfos.splice(i--, 1);
                    }
                }

                event = eventsQueue.shift();
            }
            distributingEvent = false;

            if (state.receivedLastEvent) {
                disposeState();
            }
        }
    }

    return base;
}

export function KeepFinalEventSubject<T>(
    subscription?: Disposable,
): Subject<T> {
    const base = Subject<T>(subscription);
    let finalEvent: Throw | End | undefined;

    function subject(event: Event<T>): void;
    function subject(sink: Sink<T>, subscription?: Disposable): void;
    function subject(
        eventOrSink: Event<T> | Sink<T>,
        maybeSubscription?: Disposable,
    ): void {
        if (subscription?.active === false) {
            return;
        }

        if (isFunction(eventOrSink)) {
            if (finalEvent) {
                if (maybeSubscription?.active !== false) {
                    try {
                        eventOrSink(finalEvent);
                    } catch (error) {
                        asyncReportError(error);
                    }
                }
            } else {
                base(eventOrSink, maybeSubscription);
            }
        } else {
            if (finalEvent) {
                return;
            }

            if (eventOrSink.type !== EventType.Push) {
                finalEvent = eventOrSink;
            }

            base(eventOrSink);
        }
    }

    return subject;
}

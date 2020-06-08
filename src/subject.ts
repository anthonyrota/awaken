import { Disposable, implDisposable } from './disposable';
import { removeOnce, asyncReportError } from './utils';
import { EventType, Event, Push, Throw, End, Source, Sink } from './source';
import isFunction = require('lodash.isfunction');

export interface Subject<T> extends Source<T>, Sink<T> {}

interface SinkInfo<T> {
    sink: Sink<T>;
    didRemove: boolean;
}

interface SubjectBasePrivateActiveState<T> {
    sinkInfos: SinkInfo<T>[];
    eventsQueue: Event<T>[];
}

export function Subject<T>(subscription?: Disposable): Subject<T> {
    const disposable = Disposable();
    let distributingEvent = false;
    let state: SubjectBasePrivateActiveState<T> | null = {
        sinkInfos: [],
        eventsQueue: [],
    };

    function nullifyState(): void {
        if (state) {
            const { sinkInfos, eventsQueue } = state;
            sinkInfos.length = 0;
            eventsQueue.length = 0;
            state = null;
            disposable.dispose();
        }
    }

    disposable.add(() => {
        if (state && !distributingEvent) {
            // If we are not currently distributing an event and we are not
            // allowing future events to be distributed then we should nullify
            // the state.
            nullifyState();
        }
    });

    subscription?.add(nullifyState);

    return implDisposable((eventOrSink: Event<T> | Sink<T>): void => {
        if (!state) {
            return;
        }

        // Called in dispose method queued to subscription before nullifyState.
        if (subscription?.active === false) {
            nullifyState();
            return;
        }

        const { sinkInfos, eventsQueue } = state;

        if (isFunction(eventOrSink)) {
            if (eventOrSink.active === false) {
                return;
            }

            const sinkInfo: SinkInfo<T> = {
                sink: eventOrSink,
                didRemove: false,
            };

            sinkInfos.push(sinkInfo);

            eventOrSink?.add(() => {
                if (state && !sinkInfo.didRemove) {
                    sinkInfo.didRemove = true;
                    // Only remove the sink if not currently distributing an
                    // event as removing it here will mess up the loop below.
                    if (!distributingEvent) {
                        removeOnce(sinkInfos, sinkInfo);
                    }
                }
            });
        } else if (sinkInfos.length > 0) {
            if (!disposable.active) {
                return;
            }

            if (eventOrSink.type !== EventType.Push) {
                try {
                    disposable.dispose();
                } catch (error) {
                    // An error will be thrown synchronously, stopping the
                    // distribution of all current and future queued events.
                    // Therefore nullify state even if currently distributing an
                    // event.
                    nullifyState();
                    throw error;
                }
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
                    const { sink, didRemove } = sinkInfo;

                    if (
                        didRemove ||
                        // This check is necessary in case a dispose method
                        // queued to the sink before the callback which removes
                        // the sink above calls this subject with a new event,
                        // meaning this sink has not been removed from the list
                        // of sinks yet.
                        sink.active === false
                    ) {
                        sinkInfo.didRemove = true;
                        // Only remove if the current event is a Push event as
                        // if the current event is a Throw or End event then
                        // there is no point in removing it now as it will be
                        // removed at the end of the loop.
                        if (event.type === EventType.Push) {
                            sinkInfos.splice(i--, 1);
                        }
                        continue;
                    }

                    try {
                        sink(event);
                    } catch (error) {
                        asyncReportError(error);
                        sinkInfo.didRemove = true;
                    }

                    // We could have been disposed during the sink's execution.
                    if (!state) {
                        return;
                    }

                    // Remove if it errored or was marked for removal during
                    // it's execution.
                    if (sinkInfo.didRemove && event.type === EventType.Push) {
                        sinkInfos.splice(i--, 1);
                    }
                }

                event = eventsQueue.shift();
            }
            distributingEvent = false;

            if (!disposable.active) {
                nullifyState();
            }
        }
    }, disposable);
}

/** @todo align with queueing behaviour */
export function KeepFinalEventSubject<T>(
    subscription?: Disposable,
): Subject<T> {
    const base = Subject<T>(subscription);
    let finalEvent: Throw | End | undefined;

    return implDisposable((eventOrSink: Event<T> | Sink<T>): void => {
        if (subscription?.active === false) {
            // If this is called from a dispose method queued before base.
            base.dispose();
            return;
        }

        if (isFunction(eventOrSink)) {
            if (finalEvent) {
                eventOrSink(finalEvent);
            } else {
                base(eventOrSink);
            }
        } else {
            if (!base.active) {
                return;
            }

            if (eventOrSink.type !== EventType.Push) {
                finalEvent = eventOrSink;
            }

            base(eventOrSink);
        }
    }, base);
}

/** @todo align with queuing behaviour */
export function LastValueSubject<T>(subscription?: Disposable): Subject<T> {
    const base = Subject<T>();
    let lastPushEvent: Push<T> | undefined;
    let finalEvent: Throw | End | undefined;

    return implDisposable((eventOrSink: Event<T> | Sink<T>) => {
        if (subscription?.active === false) {
            // If this is called from a dispose method queued before base.
            base.dispose();
            return;
        }

        if (isFunction(eventOrSink)) {
            if (finalEvent) {
                if (finalEvent.type === EventType.End && lastPushEvent) {
                    eventOrSink(lastPushEvent);
                }
                eventOrSink(finalEvent);
            } else {
                base(eventOrSink);
            }
        } else {
            if (!base.active) {
                return;
            }

            if (eventOrSink.type === EventType.Push) {
                lastPushEvent = eventOrSink;
            } else {
                finalEvent = eventOrSink;
                if (finalEvent.type === EventType.End && lastPushEvent) {
                    base(lastPushEvent);
                }
                base(finalEvent);
            }
        }
    }, base);
}

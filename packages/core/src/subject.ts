import { Disposable, implDisposableMethods, DisposalError } from './disposable';
import { createCustomError, joinErrors } from './errorBase';
import {
    PushType,
    EndType,
    Event,
    Push,
    Throw,
    End,
    Source,
    Sink,
} from './source';
import { removeOnce, asyncReportError } from './util';

export interface Subject<T> extends Source<T>, Sink<T> {}

interface SinkInfo<T> {
    __sink: Sink<T>;
    __didRemove: boolean;
    __notAdded: boolean;
}

interface SubjectBasePrivateActiveState<T> {
    __sinkInfos: SinkInfo<T>[];
    __sinksToAdd: SinkInfo<T>[];
    __eventsQueue: Event<T>[];
}

export function SubjectBase<T>(): Subject<T> {
    let distributingEvent = false;
    let sinkIndex: number;
    let state: SubjectBasePrivateActiveState<T> | null = {
        __sinkInfos: [],
        __sinksToAdd: [],
        __eventsQueue: [],
    };

    function nullifyState(): void {
        if (state) {
            const {
                __sinkInfos: sinkInfos,
                __sinksToAdd: sinksToAdd,
                __eventsQueue: eventsQueue,
            } = state;
            sinkInfos.length = 0;
            sinksToAdd.length = 0;
            eventsQueue.length = 0;
            state = null;
        }
    }

    const disposable = Disposable(() => {
        if (state && !distributingEvent) {
            nullifyState();
        }
    });

    return implDisposableMethods((eventOrSink: Event<T> | Sink<T>): void => {
        if (!disposable.active) {
            return;
        }

        const {
            __sinkInfos: sinkInfos,
            __sinksToAdd: sinksToAdd,
            __eventsQueue: eventsQueue,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        } = state!;

        if (typeof eventOrSink === 'function') {
            if (!eventOrSink.active) {
                return;
            }

            const addedInDistribution = distributingEvent;
            const sinkInfo: SinkInfo<T> = {
                __sink: eventOrSink,
                __didRemove: false,
                __notAdded: addedInDistribution,
            };

            const sinkList = addedInDistribution ? sinksToAdd : sinkInfos;
            sinkList.push(sinkInfo);

            eventOrSink.add(
                Disposable(() => {
                    if (!disposable.active || sinkInfo.__didRemove) {
                        return;
                    }

                    sinkInfo.__didRemove = true;

                    if (addedInDistribution && sinkInfo.__notAdded) {
                        // The sink was added during the loop below, which is
                        // still running.
                        removeOnce(sinksToAdd, sinkInfo);
                        return;
                    }

                    if (distributingEvent) {
                        // We are in the loop below.
                        if (sinkInfos[sinkIndex] === sinkInfo) {
                            return;
                        }
                        const index = sinkInfos.indexOf(sinkInfo);
                        if (index < sinkIndex) {
                            sinkIndex--;
                        }
                        sinkInfos.splice(index, 1);
                        return;
                    }

                    // Nothing is happening in relation to this subject.
                    removeOnce(sinkInfos, sinkInfo);
                }),
            );
        } else if (sinkInfos.length > 0) {
            if (eventOrSink.type !== PushType) {
                disposable.dispose();
            }

            if (distributingEvent) {
                eventsQueue.push(eventOrSink);
                return;
            }

            let event: Event<T> | undefined = eventOrSink;

            const errors: DisposalError[] = [];

            distributingEvent = true;
            while (event) {
                for (sinkIndex = 0; sinkIndex < sinkInfos.length; sinkIndex++) {
                    const sinkInfo = sinkInfos[sinkIndex];
                    const { __sink: sink } = sinkInfo;

                    let active = false;
                    try {
                        active = sink.active;
                    } catch (error) {
                        errors.push(error as DisposalError);
                    }

                    if (!active) {
                        // Only remove if the current event is a Push event as
                        // if the current event is a Throw or End event then
                        // there is no point in removing it now as it will be
                        // removed at the end of the loop.
                        if (event.type === PushType) {
                            sinkInfos.splice(sinkIndex--, 1);
                        }
                        continue;
                    }

                    try {
                        sink(event);
                    } catch (error) {
                        asyncReportError(error);
                        sinkInfo.__didRemove = true;
                    }

                    // Remove if it errored or was marked for removal during
                    // it's execution.
                    if (sinkInfo.__didRemove && event.type === PushType) {
                        sinkInfos.splice(sinkIndex--, 1);
                    }
                }

                if (event.type !== PushType) {
                    break;
                }

                for (let i = 0; i < sinksToAdd.length; i++) {
                    const sinkToAdd = sinksToAdd[i];
                    sinkToAdd.__notAdded = false;
                }
                Array.prototype.push.apply(sinkInfos, sinksToAdd);
                sinksToAdd.length = 0;

                event = eventsQueue.shift();
            }
            distributingEvent = false;

            if (
                // Cannot throw.
                !disposable.active
            ) {
                nullifyState();
            }

            if (errors.length > 0) {
                throw new SubjectDistributionSinkDisposalError(errors);
            }
        }
    }, disposable);
}

interface _SubjectDistributionSinkDisposalError extends Error {
    errors: DisposalError[];
}

export interface SubjectDistributionSinkDisposalError
    extends _SubjectDistributionSinkDisposalError {
    /**
     * The list of errors caught.
     */
    readonly errors: DisposalError[];
}

export interface SubjectDistributionSinkDisposalErrorConstructor {
    new (errors: DisposalError[]): SubjectDistributionSinkDisposalError;
    prototype: SubjectDistributionSinkDisposalError;
}

/**
 * Thrown when at least least one error is caught during the checking of whether
 * a subscribed sink is active or not.
 */
// eslint-disable-next-line max-len
export const SubjectDistributionSinkDisposalError: SubjectDistributionSinkDisposalErrorConstructor = createCustomError(
    (self: _SubjectDistributionSinkDisposalError, errors: DisposalError[]) => {
        self.message = `${errors.length} error${
            errors.length === 1 ? ' was' : 's were'
        } caught while distributing an event through a subject.${joinErrors(
            errors,
        )}`;

        self.name = 'SubjectDistributionSinkDisposalError';
        self.errors = errors;
    },
);

export function Subject<T>(): Subject<T> {
    const base = SubjectBase<T>();
    let finalEvent: Throw | End | undefined;

    return implDisposableMethods((eventOrSink: Event<T> | Sink<T>): void => {
        if (typeof eventOrSink === 'function') {
            if (finalEvent) {
                eventOrSink(finalEvent);
            } else {
                base(eventOrSink);
            }
        } else {
            if (!base.active) {
                return;
            }

            if (eventOrSink.type !== PushType) {
                finalEvent = eventOrSink;
            }

            base(eventOrSink);
        }
    }, base);
}

export function LastValueSubject<T>(): Subject<T> {
    const base = SubjectBase<T>();
    let lastPushEvent: Push<T> | undefined;
    let finalEvent: Throw | End | undefined;

    return implDisposableMethods((eventOrSink: Event<T> | Sink<T>) => {
        if (typeof eventOrSink === 'function') {
            if (finalEvent) {
                if (lastPushEvent) {
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

            if (eventOrSink.type === PushType) {
                lastPushEvent = eventOrSink;
            } else {
                finalEvent = eventOrSink;
                if (finalEvent.type === EndType && lastPushEvent) {
                    base(lastPushEvent);
                } else {
                    lastPushEvent = undefined;
                }
                base(finalEvent);
            }
        }
    }, base);
}

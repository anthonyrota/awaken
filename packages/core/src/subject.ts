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
    isSource,
    Sink,
    isSink,
    ThrowType,
} from './source';
import { $$Sink, $$Source } from './symbols';
import {
    removeOnce,
    asyncReportError,
    identity,
    _binarySearchNextLargestIndex,
    TimeProvider,
} from './util';

/**
 * @public
 */
export interface NonMarkedSubject<T> extends Disposable {
    (eventOrSink: Event<T> | Sink<T>): void;
}

/**
 * @public
 */
export interface Subject<T> extends Source<T>, Sink<T>, NonMarkedSubject<T> {}

/**
 * @public
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function markAsSubject<T>(
    subjectFunction: NonMarkedSubject<T>,
): Subject<T> {
    subjectFunction[$$Sink] = undefined;
    subjectFunction[$$Source] = undefined;
    return subjectFunction as Subject<T>;
}

/**
 * Determines whether the given value is a Subject.
 * @param value - The value to check.
 * @returns Whether the value is a Subject.
 *
 * @example
 * ```
 * isSubject(Sink(() => {})); // false.
 * isSubject(Source(() => {})) // false.
 * isSubject(Subject()); // true.
 * isSubject(Disposable()); // false.
 * isSubject({}); // false.
 * isSubject(() => {}); // false.
 * isSubject(null); // false.
 * ```
 *
 * @see {@link (Sink:function)}
 * @see {@link (Source:function)}
 * @see {@link (Subject:function)}
 * @see {@link (Disposable:function)}
 * @see {@link isDisposable}
 * @see {@link isSink}
 * @see {@link isSource}
 *
 * @public
 */
export function isSubject(value: unknown): value is Subject<unknown> {
    return isSource(value) && isSink(value);
}

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

/**
 * @public
 */
export function SubjectBase<T>(): Subject<T> {
    let distributingEvent = false;
    let sinkIndex = 0;
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

    return markAsSubject(
        implDisposableMethods((eventOrSink: Event<T> | Sink<T>): void => {
            if (!disposable.active) {
                return;
            }

            const {
                __sinkInfos: sinkInfos,
                __sinksToAdd: sinksToAdd,
                __eventsQueue: eventsQueue,
                // eslint-disable-next-line max-len
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
                            // The sink was added during the loop below, which
                            // is still running.
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
                const _distributingEvent = distributingEvent;
                distributingEvent = true;

                if (eventOrSink.type !== PushType) {
                    disposable.dispose();
                }

                if (_distributingEvent) {
                    eventsQueue.push(eventOrSink);
                    return;
                }

                const errors: DisposalError[] = [];
                let event: Event<T> | undefined = eventOrSink;

                while (event) {
                    if (sinkInfos.length === 0) {
                        if (event.type === ThrowType) {
                            asyncReportError(event.error);
                        }
                        break;
                    }

                    for (; sinkIndex < sinkInfos.length; sinkIndex++) {
                        const sinkInfo = sinkInfos[sinkIndex];
                        const { __sink: sink } = sinkInfo;

                        let active = false;
                        try {
                            active = sink.active;
                        } catch (error) {
                            errors.push(error as DisposalError);
                        }

                        if (!active) {
                            // Only remove if the current event is a Push event
                            // as if the current event is a Throw or End event
                            // then there is no point in removing it now as it
                            // will be removed at the end of the loop.
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

                        // Remove if it was marked for removal during it's
                        // execution.
                        if (sinkInfo.__didRemove && event.type === PushType) {
                            sinkInfos.splice(sinkIndex--, 1);
                        }
                    }

                    sinkIndex = 0;

                    if (event.type !== PushType) {
                        break;
                    }

                    for (let i = 0; i < sinksToAdd.length; i++) {
                        sinksToAdd[i].__notAdded = false;
                    }
                    // eslint-disable-next-line prefer-spread
                    sinkInfos.push.apply(sinkInfos, sinksToAdd);
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
            } else if (eventOrSink.type !== PushType) {
                if (eventOrSink.type === ThrowType) {
                    asyncReportError(eventOrSink.error);
                }
                disposable.dispose();
            }
        }, disposable),
    );
}

interface SubjectDistributionSinkDisposalErrorImplementation extends Error {
    errors: DisposalError[];
}

/**
 * @public
 */
export interface SubjectDistributionSinkDisposalError
    extends SubjectDistributionSinkDisposalErrorImplementation {
    /**
     * The list of errors caught.
     */
    readonly errors: DisposalError[];
}

/**
 * @public
 */
export interface SubjectDistributionSinkDisposalErrorConstructor {
    new (errors: DisposalError[]): SubjectDistributionSinkDisposalError;
    prototype: SubjectDistributionSinkDisposalError;
}

/**
 * Thrown when at least least one error is caught during the checking of whether
 * a subscribed sink is active or not.
 *
 * @public
 */
// eslint-disable-next-line max-len
export const SubjectDistributionSinkDisposalError: SubjectDistributionSinkDisposalErrorConstructor = createCustomError(
    (
        self: SubjectDistributionSinkDisposalErrorImplementation,
        errors: DisposalError[],
    ) => {
        self.message = `${errors.length} error${
            errors.length === 1 ? ' was' : 's were'
        } caught while distributing an event through a subject.${joinErrors(
            errors,
        )}`;

        self.name = 'SubjectDistributionSinkDisposalError';
        self.errors = errors;
    },
);

/**
 * @public
 */
export function Subject<T>(): Subject<T> {
    const base = SubjectBase<T>();
    let finalEvent: Throw | End | undefined;

    return markAsSubject(
        implDisposableMethods((eventOrSink: Event<T> | Sink<T>): void => {
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
        }, base),
    );
}

/**
 * @public
 */
export interface CurrentValueSubject<T> extends Subject<T> {
    currentValue: T;
}

/**
 * @public
 */
export function CurrentValueSubject<T>(initialValue: T): Subject<T> {
    const base = Subject<T>();

    const subject: Subject<T> = markAsSubject(
        implDisposableMethods((eventOrSink: Event<T> | Sink<T>) => {
            if (typeof eventOrSink === 'function') {
                base(eventOrSink);
                if (eventOrSink.active) {
                    eventOrSink(
                        Push((subject as CurrentValueSubject<T>).currentValue),
                    );
                }
            } else {
                base(eventOrSink);
            }
        }, base),
    );

    (subject as CurrentValueSubject<T>).currentValue = initialValue;

    return subject as CurrentValueSubject<T>;
}

/**
 * @public
 */
export interface ReplaySubjectTimeoutConfig {
    maxDuration: number;
    provideTime?: TimeProvider | null;
}

/**
 * @public
 */
export function ReplaySubject<T>(
    count_?: number | null,
    timeoutConfig_?: ReplaySubjectTimeoutConfig | null,
): Subject<T> {
    const count = count_ == null ? Infinity : count_;
    let hasTimeout: boolean | undefined;
    let timeout: number;
    let provideTime: TimeProvider;
    if (timeoutConfig_) {
        hasTimeout = true;
        timeout = timeoutConfig_.maxDuration;
        provideTime = timeoutConfig_.provideTime || Date.now;
    }
    const base = SubjectBase<T>();
    const buffer: Push<T>[] = [];
    const deadlines: number[] = [];
    let finalEvent: End | Throw | undefined;
    let isDistributing = false;
    let firstValidIndex = 0;

    function trimCount(): void {
        const overflow = buffer.length - count;

        if (overflow <= 0) {
            return;
        }

        if (isDistributing) {
            firstValidIndex = Math.max(firstValidIndex, overflow);
        } else {
            buffer.splice(0, overflow);
            deadlines.splice(0, overflow);
        }
    }

    function trimTime(): void {
        const currentTime = provideTime();
        const firstValidIndex_ = _binarySearchNextLargestIndex(
            deadlines,
            identity,
            currentTime,
            firstValidIndex,
        );

        if (isDistributing) {
            firstValidIndex = firstValidIndex_;
        } else if (firstValidIndex_ > 0) {
            buffer.splice(0, firstValidIndex_);
            deadlines.splice(0, firstValidIndex_);
        }
    }

    return markAsSubject(
        implDisposableMethods((eventOrSink: Event<T> | Sink<T>) => {
            if (typeof eventOrSink === 'function') {
                if (!eventOrSink.active) {
                    return;
                }

                if (finalEvent && finalEvent.type === ThrowType) {
                    eventOrSink(finalEvent);
                    return;
                }

                if (hasTimeout) {
                    trimTime();
                }

                const isDistributing_ = isDistributing;
                isDistributing = true;
                for (
                    let i = firstValidIndex;
                    i < buffer.length && eventOrSink.active;
                    i++
                ) {
                    if (hasTimeout && provideTime() >= deadlines[i]) {
                        firstValidIndex = i + 1;
                        trimTime();
                        i = firstValidIndex;
                        continue;
                    }
                    eventOrSink(buffer[i]);
                }
                if (!isDistributing_) {
                    isDistributing = false;
                    buffer.splice(0, firstValidIndex);
                    deadlines.splice(0, firstValidIndex);
                    firstValidIndex = 0;
                    if (hasTimeout) {
                        trimTime();
                    }
                }

                if (finalEvent) {
                    eventOrSink(finalEvent);
                    return;
                }
            } else {
                if (eventOrSink.type === PushType) {
                    buffer.push(eventOrSink);

                    if (hasTimeout) {
                        deadlines.push(provideTime() + timeout);
                        trimTime();
                    }

                    trimCount();
                } else {
                    finalEvent = eventOrSink;
                }
            }

            base(eventOrSink);
        }, base),
    );
}

/**
 * @public
 */
export function FinalValueSubject<T>(): Subject<T> {
    const base = SubjectBase<T>();
    let lastPushEvent: Push<T> | undefined;
    let finalEvent: Throw | End | undefined;

    return markAsSubject(
        implDisposableMethods((eventOrSink: Event<T> | Sink<T>) => {
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
        }, base),
    );
}

import {
    Disposable,
    PushType,
    ThrowType,
    EndType,
    Event,
    Push,
    Throw,
    End,
    Source,
    Sink,
    SubjectBase,
    binarySearchNextLargestIndex,
} from '@awaken/core';

interface TestScheduleFunction {
    (
        callback: () => void,
        delayFrames: number,
        subscription?: Disposable,
    ): void;
}

interface _TestSchedule extends TestScheduleFunction {
    currentFrame: number;
    flush: () => void;
    reset: () => void;
}

export interface TestSchedule extends _TestSchedule {
    readonly currentFrame: number;
    readonly flush: () => void;
    readonly reset: () => void;
}

interface TestScheduleAction {
    readonly __callback: () => void;
    readonly __executionFrame: number;
    __shouldCall: boolean;
}

function getActionExecutionFrame(action: TestScheduleAction): number {
    return action.__executionFrame;
}

export function TestSchedule(): TestSchedule {
    const actions: TestScheduleAction[] = [];
    let isFlushing = false;

    const testSchedule = (((callback, delayFrames, subscription) => {
        if (subscription && !subscription.active) {
            return;
        }

        const executionFrame = testSchedule.currentFrame + delayFrames;
        const index = binarySearchNextLargestIndex(
            actions,
            getActionExecutionFrame,
            executionFrame,
        );
        const action: TestScheduleAction = {
            __callback: callback,
            __executionFrame: executionFrame,
            __shouldCall: true,
        };

        actions.splice(index, 0, action);

        if (subscription) {
            subscription.add(
                Disposable(() => {
                    action.__shouldCall = false;
                }),
            );
        }
    }) as TestScheduleFunction) as _TestSchedule;

    testSchedule.currentFrame = 0;

    function flush(): void {
        if (isFlushing) {
            return;
        }

        isFlushing = true;
        let action = actions.shift();
        while (action) {
            testSchedule.currentFrame = action.__executionFrame;
            const { __callback: callback, __shouldCall: shouldCall } = action;

            if (shouldCall) {
                try {
                    callback();
                } catch (error) {
                    reset();
                    throw error;
                }
            }

            action = actions.shift();
        }
        isFlushing = false;
    }

    testSchedule.flush = flush;

    function reset(): void {
        actions.length = 0;
        testSchedule.currentFrame = 0;
        // If reset mid-execution.
        isFlushing = false;
    }

    testSchedule.reset = reset;

    return testSchedule as TestSchedule;
}

export interface TestSubscriptionInfo {
    subscriptionStartFrame: number;
    subscriptionEndFrame: number;
}

export function TestSubscriptionInfo(
    subscriptionStartFrame: number,
    subscriptionEndFrame: number,
): TestSubscriptionInfo {
    return { subscriptionStartFrame, subscriptionEndFrame };
}

function watchSubscriptionInfo(
    testSchedule: TestSchedule,
    subscription?: Disposable,
): TestSubscriptionInfo {
    const info: TestSubscriptionInfo = TestSubscriptionInfo(
        testSchedule.currentFrame,
        Infinity,
    );

    if (subscription) {
        subscription.add(
            Disposable(() => {
                info.subscriptionEndFrame = testSchedule.currentFrame;
            }),
        );
    }

    return info;
}

export type TestSourceSubscriptions = ReadonlyArray<
    Readonly<TestSubscriptionInfo>
>;

interface WithFrameProperty {
    readonly frame: number;
}

export type TestSourceEvent<T> = Event<T> & WithFrameProperty;

export function P<T>(value: T, frame: number): Push<T> & WithFrameProperty {
    return { type: PushType, value, frame };
}

export function T(error: unknown, frame: number): Throw & WithFrameProperty {
    return { type: ThrowType, error, frame };
}

export function E(frame: number): End & WithFrameProperty {
    return { type: EndType, frame };
}

interface _TestSource<T> extends Source<T> {
    subscriptions: TestSourceSubscriptions;
}

export interface TestSource<T> extends _TestSource<T> {
    readonly subscriptions: TestSourceSubscriptions;
}

export function TestSource<T>(
    events: TestSourceEvent<T>[],
    testSchedule: TestSchedule,
): TestSource<T> {
    const subscriptions: TestSubscriptionInfo[] = [];

    const base = Source<T>((sink) => {
        subscriptions.push(watchSubscriptionInfo(testSchedule, sink));
        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            testSchedule(() => sink(event), event.frame, sink);
        }
    }) as _TestSource<T>;

    base.subscriptions = subscriptions;

    return base as TestSource<T>;
}

interface _SharedTestSource<T> extends _TestSource<T> {
    schedule: (subscription?: Disposable) => void;
}

export interface SharedTestSource<T> extends _SharedTestSource<T> {
    readonly subscriptions: TestSourceSubscriptions;
    readonly schedule: (subscription?: Disposable) => void;
}

export function SharedTestSource<T>(
    events: TestSourceEvent<T>[],
    testSchedule: TestSchedule,
): SharedTestSource<T> {
    const subscriptions: TestSubscriptionInfo[] = [];
    const subject = SubjectBase<T>();

    const base = Source<T>((sink) => {
        subscriptions.push(watchSubscriptionInfo(testSchedule, sink));
        subject(sink);
    }) as _SharedTestSource<T>;

    base.subscriptions = subscriptions;

    function schedule(subscription?: Disposable): void {
        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            testSchedule(() => subject(event), event.frame, subscription);
        }
    }

    base.schedule = schedule;

    return base as SharedTestSource<T>;
}

export function watchSourceEvents<T>(
    source: Source<T>,
    testSchedule: TestSchedule,
    subscriptionInfo: TestSubscriptionInfo = watchSubscriptionInfo(
        testSchedule,
    ),
): TestSourceEvent<T>[] {
    const subscription = Disposable();
    const events: TestSourceEvent<T>[] = [];

    testSchedule(() => {
        const sink = Sink<T>((event) => {
            events.push({ ...event, frame: testSchedule.currentFrame });
        });
        subscription.add(sink);
        source(sink);
    }, subscriptionInfo.subscriptionStartFrame);

    testSchedule(() => {
        subscription.dispose();
    }, subscriptionInfo.subscriptionEndFrame);

    return events;
}

import { Disposable } from './disposable';
import {
    requestAnimationFrame,
    queueMicrotask,
    setTimeout,
    setInterval,
    removeOnce,
} from './utils';

export interface ScheduleFunction<T extends any[] = []> {
    (callback: (...args: T) => void, subscription?: Disposable): void;
}

export const scheduleSync: ScheduleFunction = (callback, subscription) => {
    if (subscription && !subscription.active) {
        return;
    }

    callback();
};

export function ScheduleSyncQueued(): ScheduleFunction {
    let callbacks: { callback: () => void; shouldCall: boolean }[] = [];
    let isProcessingQueue = false;

    return (callback, subscription) => {
        if (subscription && !subscription.active) {
            return;
        }

        if (isProcessingQueue) {
            const task = { callback, shouldCall: true };
            callbacks.push(task);
            subscription?.add(() => {
                task.shouldCall = false;
            });
            return;
        }

        isProcessingQueue = true;

        try {
            callback();
        } catch (error) {
            isProcessingQueue = false;
            callbacks = [];
            throw error;
        }

        let callbackInfo = callbacks.shift();

        while (callbackInfo) {
            if (callbackInfo.shouldCall) {
                try {
                    const { callback } = callbackInfo;
                    callback();
                } catch (error) {
                    isProcessingQueue = false;
                    throw error;
                }
            }
            callbackInfo = callbacks.shift();
        }

        isProcessingQueue = false;
    };
}

export const scheduleSyncQueued = ScheduleSyncQueued();

export function ScheduleQueued<T extends any[] = []>(
    schedule: (
        callback: (...args: T) => void,
        subscription: Disposable,
    ) => void,
): ScheduleFunction<T> {
    const callbacks: {
        callback: () => void;
        hasBeenCalled: boolean;
    }[] = [];
    let scheduledSubscription: Disposable | undefined;

    function reschedule() {
        if (callbacks.length > 0 && !scheduledSubscription) {
            scheduledSubscription = new Disposable();
            schedule(handle, scheduledSubscription);
        }
    }

    function handle() {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        scheduledSubscription!.dispose();
        scheduledSubscription = undefined;

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const callbackInfo = callbacks.shift()!;
        callbackInfo.hasBeenCalled = true;

        let hasError = false;
        let error: any;

        try {
            const { callback } = callbackInfo;
            callback();
        } catch (error_) {
            hasError = true;
            error = error_;
        }

        reschedule();

        if (hasError) {
            throw error;
        }
    }

    return (callback, subscription) => {
        if (subscription && !subscription.active) {
            return;
        }

        const callbackInfo = { callback, hasBeenCalled: false };
        callbacks.push(callbackInfo);

        subscription?.add(() => {
            if (callbackInfo.hasBeenCalled) {
                return;
            }

            removeOnce(callbacks, callbackInfo);

            if (callbacks.length === 0) {
                scheduledSubscription?.dispose();
            }
        });

        reschedule();
    };
}

export const scheduleAnimationFrame: ScheduleFunction<Parameters<
    FrameRequestCallback
>> = requestAnimationFrame;

export function ScheduleAnimationFrameQueued(): ScheduleFunction<
    Parameters<FrameRequestCallback>
> {
    return ScheduleQueued(scheduleAnimationFrame);
}

export const scheduleAnimationFrameQueued = ScheduleAnimationFrameQueued();

export const scheduleMicrotask: ScheduleFunction = queueMicrotask;

export function ScheduleTimeout(delay: number): ScheduleFunction {
    return (callback, subscription) => {
        setTimeout(callback, delay, subscription);
    };
}

export function ScheduleTimeoutQueued(delay: number): ScheduleFunction {
    return ScheduleQueued(ScheduleTimeout(delay));
}

export function ScheduleInterval(delay: number): ScheduleFunction {
    let scheduledSubscription: Disposable | undefined;

    return ScheduleQueued((callback: () => void, subscription: Disposable) => {
        scheduledSubscription = subscription;

        if (scheduledSubscription && scheduledSubscription.active) {
            return;
        }

        setInterval(callback, delay, subscription);
    });
}

import { Disposable } from './disposable';
import {
    requestAnimationFrame,
    queueMicrotask,
    setTimeout,
    setInterval,
    removeOnce,
} from './utils';

export interface ScheduleFunction {
    (callback: () => void, subscription?: Disposable): void;
}

export const scheduleSync: ScheduleFunction = (callback, subscription) => {
    if (subscription && !subscription.active) {
        return;
    }

    callback();
};

export const scheduleAnimationFrame: ScheduleFunction = (
    callback,
    subscription,
) => {
    requestAnimationFrame(() => callback(), subscription);
};

export const scheduleMicrotask: ScheduleFunction = queueMicrotask;

export function ScheduleTimeout(delay: number): ScheduleFunction {
    return (callback, subscription) => {
        setTimeout(() => callback(), delay, subscription);
    };
}

export function ScheduleInterval(delay: number): ScheduleFunction {
    const callbacks: {
        callback: () => void;
        hasBeenCalled: boolean;
    }[] = [];
    let intervalSubscription: Disposable | undefined;

    function callFirstCallback() {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const callbackInfo = callbacks.shift()!;
        callbackInfo.hasBeenCalled = true;
        let hasError = false;
        let error: any;
        try {
            callbackInfo.callback();
        } catch (error_) {
            hasError = true;
            error = error_;
        }
        if (callbacks.length === 0) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            intervalSubscription!.dispose();
        }
        if (hasError) {
            throw error;
        }
    }

    return (callback, subscription) => {
        if (subscription && !subscription.active) {
            return;
        }

        if (callbacks.length === 0) {
            intervalSubscription = new Disposable();
            setInterval(callFirstCallback, delay, intervalSubscription);
        }

        const callbackInfo = { callback, hasBeenCalled: false };
        callbacks.push(callbackInfo);

        subscription?.add(() => {
            if (!callbackInfo.hasBeenCalled) {
                removeOnce(callbacks, callbackInfo);
                if (callbacks.length === 0) {
                    // eslint-disable-next-line max-len
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    intervalSubscription!.dispose();
                }
            }
        });
    };
}

export function ScheduleQueue(): ScheduleFunction {
    const callbacks: { callback: () => void; shouldCall: boolean }[] = [];
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
            throw error;
        }

        let callbackInfo = callbacks.shift();

        while (callbackInfo) {
            if (callbackInfo.shouldCall) {
                try {
                    callbackInfo.callback();
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

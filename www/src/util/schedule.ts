import { CancelToken } from './Cancelable';

export interface IDeadline {
    didTimeout: boolean;
    timeRemaining(): number;
}

declare global {
    function requestIdleCallback(task: (deadline: IDeadline) => void): unknown;
    function cancelIdleCallback(handle: unknown);
}

const hasNativeRequestIdleCallback = typeof requestIdleCallback === 'function';

class Deadline implements IDeadline {
    constructor(private __initialTime: number) {}

    public get didTimeout(): boolean {
        return false;
    }

    public timeRemaining(): number {
        return Math.max(0, 50 - (Date.now() - this.__initialTime));
    }
}

const requestIdleCallbackShim = (
    task: (deadline: IDeadline) => void,
): unknown => {
    const deadline = new Deadline(Date.now());
    return setTimeout(() => task(deadline), 0);
};

const cancelIdleCallbackShim = (handle: unknown) => {
    clearTimeout(handle as number);
};

const actualRequestIdleCallback = hasNativeRequestIdleCallback
    ? requestIdleCallback
    : requestIdleCallbackShim;

const actualCancelIdleCallback = hasNativeRequestIdleCallback
    ? cancelIdleCallback
    : cancelIdleCallbackShim;

export function schedule(
    cancelToken: CancelToken,
    task: (deadline: IDeadline) => void,
): void {
    if (cancelToken.canceled) {
        return;
    }
    const handle = actualRequestIdleCallback(task);
    cancelToken.onCancel(() => {
        actualCancelIdleCallback(handle);
    });
}

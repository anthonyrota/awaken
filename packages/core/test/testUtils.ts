export const throw_ = (message: string) => () => {
    throw new Error(message);
};

export interface FakeRAFUtil {
    requestAnimationFrameMock: jest.Mock<number, [FrameRequestCallback]>;
    cancelAnimationFrameMock: jest.Mock<void, [number]>;
    flushQueue: () => void;
    getActiveCount: () => number;
    resetQueue: () => void;
}

export function createFakeRAFUtil(): FakeRAFUtil {
    let isFlushing: boolean;
    let id = -23;
    let callbacks = new Map<number, FrameRequestCallback>();

    const requestAnimationFrameMock = jest.fn(
        (callback: FrameRequestCallback): number => {
            id += 23;
            callbacks.set(id, callback);
            return id;
        },
    );

    const cancelAnimationFrameMock = jest.fn((id: number): void => {
        callbacks.delete(id);
    });

    function flushQueue(): void {
        if (isFlushing) {
            return;
        }
        const _callbacks = callbacks;
        resetQueue();
        isFlushing = true;
        const errors: unknown[] = [];
        for (const [, callback] of _callbacks) {
            try {
                callback(1379161.826);
            } catch (error) {
                errors.push(error);
            }
        }
        isFlushing = false;
        if (errors.length > 0) {
            throw errors;
        }
    }

    function getActiveCount(): number {
        return callbacks.size;
    }

    function resetQueue(): void {
        if (isFlushing) {
            throw new Error('[FakeRAFUtil] Cannot reset queue while flushing.');
        }
        isFlushing = false;
        id = -23;
        callbacks = new Map<number, FrameRequestCallback>();
    }

    return {
        requestAnimationFrameMock,
        cancelAnimationFrameMock,
        flushQueue,
        getActiveCount,
        resetQueue,
    };
}

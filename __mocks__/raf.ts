import { RafMock } from '../test/mockTypes/raf';

let id = -23;
let callbacks = new Map<number, FrameRequestCallback>();

const rafMock: RafMock = Object.assign(
    jest.fn((callback: FrameRequestCallback): number => {
        id += 23;
        callbacks.set(id, callback);
        return id;
    }),
    {
        cancel: jest.fn((id: number): void => {
            callbacks.delete(id);
        }),
        _flushQueue(): void {
            const _callbacks = callbacks;
            rafMock._resetQueue();
            const errors: unknown[] = [];
            _callbacks.forEach((callback) => {
                try {
                    callback(1379161.826);
                } /* prettier-ignore */ catch (error: unknown) {
                    errors.push(error);
                }
            });
            if (errors.length > 0) {
                throw errors;
            }
        },
        _getActiveCount(): number {
            return callbacks.size;
        },
        _resetQueue(): void {
            id = -23;
            callbacks = new Map<number, FrameRequestCallback>();
        },
    },
);

export = rafMock;

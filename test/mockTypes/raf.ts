export interface RafMock extends jest.Mock<number, [FrameRequestCallback]> {
    cancel: jest.Mock<void, [number]>;
    _flushQueue: () => void;
    _getActiveCount: () => number;
    _resetQueue: () => void;
}

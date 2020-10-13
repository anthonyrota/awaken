import each from 'jest-each';
import { removeOnce, noop } from '../src/util';
import {
    Disposable,
    pipe,
    flow,
    requestAnimationFrame,
    setTimeout,
    setInterval,
    asyncReportError,
} from '@microstream/core';

type CF = (x: string) => string;
const composableFunction1: CF = (x) => x + '+f1';
const composableFunction2: CF = (x) => x + '+f2';
const composableFunction3: CF = (x) => x + '+f3';
const composableFunction4: CF = (x) => x + '+f4';
const composableFunction5: CF = (x) => x + '+f5';
const composableFunction6: CF = (x) => x + '+f6';
const composableFunction7: CF = (x) => x + '+f7';
const composableFunction8: CF = (x) => x + '+f8';
const composableFunction9: CF = (x) => x + '+f9';
const composableFunction10: CF = (x) => x + '+f10';
const composableFunction11: CF = (x) => x + '+f11';

// prettier-ignore
const composableCases: [string, ...CF[]][] = [
    [''],
    ['+f1', composableFunction1],
    ['+f1+f2', composableFunction1, composableFunction2],
    ['+f1+f2+f3', composableFunction1, composableFunction2, composableFunction3],
    ['+f1+f2+f3+f4', composableFunction1, composableFunction2, composableFunction3, composableFunction4],
    ['+f1+f2+f3+f4+f5', composableFunction1, composableFunction2, composableFunction3, composableFunction4, composableFunction5],
    ['+f1+f2+f3+f4+f5+f6', composableFunction1, composableFunction2, composableFunction3, composableFunction4, composableFunction5, composableFunction6],
    ['+f1+f2+f3+f4+f5+f6+f7', composableFunction1, composableFunction2, composableFunction3, composableFunction4, composableFunction5, composableFunction6, composableFunction7],
    ['+f1+f2+f3+f4+f5+f6+f7+f8', composableFunction1, composableFunction2, composableFunction3, composableFunction4, composableFunction5, composableFunction6, composableFunction7, composableFunction8],
    ['+f1+f2+f3+f4+f5+f6+f7+f8+f9', composableFunction1, composableFunction2, composableFunction3, composableFunction4, composableFunction5, composableFunction6, composableFunction7, composableFunction8, composableFunction9],
    ['+f1+f2+f3+f4+f5+f6+f7+f8+f9+f10', composableFunction1, composableFunction2, composableFunction3, composableFunction4, composableFunction5, composableFunction6, composableFunction7, composableFunction8, composableFunction9, composableFunction10],
    ['+f1+f2+f3+f4+f5+f6+f7+f8+f9+f10+f11', composableFunction1, composableFunction2, composableFunction3, composableFunction4, composableFunction5, composableFunction6, composableFunction7, composableFunction8, composableFunction9, composableFunction10, composableFunction11],
]

describe('pipe', () => {
    it('should be a function', () => {
        expect(pipe).toBeFunction();
    });

    each(composableCases).it(
        'should apply %# function(s) ltr',
        (expected: string, ...fns: CF[]) => {
            // eslint-disable-next-line jest/no-standalone-expect
            expect(pipe('XXX', ...fns)).toBe('XXX' + expected);
            // eslint-disable-next-line jest/no-standalone-expect
            expect(pipe('YYY', ...fns)).toBe('YYY' + expected);
        },
    );
});

describe('flow', () => {
    it('should be a function', () => {
        expect(flow).toBeFunction();
    });

    each(composableCases).it(
        'should ltr compose %# function(s)',
        (expected: string, ...fns: CF[]) => {
            const composed = flow(...fns);
            // eslint-disable-next-line jest/no-standalone-expect
            expect(composed('XXX')).toBe('XXX' + expected);
            // eslint-disable-next-line jest/no-standalone-expect
            expect(composed('YYY')).toBe('YYY' + expected);
        },
    );
});

describe('removeOnce', () => {
    it('should be a function', () => {
        expect(removeOnce).toBeFunction();
    });

    const x = 'XXX';

    it('should do nothing when given an empty array', () => {
        const array = [];
        removeOnce(array, x);
        expect(array).toEqual([]);
    });

    const A = 'A';
    const B = { foo: 'baz' };

    each([
        [[[B]], [[B]]],
        [[[A, B, B, A]], [[A, B, B, A]]],
        [[[A, B, A, A, A, B]], [[A, B, A, A, A, B]]],
    ]).it(`should do nothing when removing "${x}" from %s`, (input, copy) => {
        removeOnce(input, x);
        // eslint-disable-next-line jest/no-standalone-expect
        expect(input).toEqual(copy);
    });

    // prettier-ignore
    each([
        [[x], []],
        [[A, x], [A]],
        [[x, B], [B]],
        [[A, x, B, B, A], [A, B, B, A]],
    ]).it(`should remove the only "${x}" from %s`, (input, output) => {
        removeOnce(input, x);
        // eslint-disable-next-line jest/no-standalone-expect
        expect(input).toEqual(output);
    });

    // prettier-ignore
    each([
        [[x, x, x, x], [x, x, x]],
        [[A,x, B, x, A], [A, B, x, A]],
        [[x, B, x, A], [B, x, A]],
    ]).it(`should remove only the first "${x}" from %s`, (input, output) => {
        removeOnce(input, x);
        // eslint-disable-next-line jest/no-standalone-expect
        expect(input).toEqual(output);
    });
});

describe('requestAnimationFrame', () => {
    const _requestAnimationFrame = global.requestAnimationFrame;
    const _cancelAnimationFrame = global.cancelAnimationFrame;
    const requestAnimationFrameMock = jest.fn();
    const cancelAnimationFrameMock = jest.fn();
    beforeAll(() => {
        global.requestAnimationFrame = requestAnimationFrameMock;
        global.cancelAnimationFrame = cancelAnimationFrameMock;
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    afterAll(() => {
        global.requestAnimationFrame = _requestAnimationFrame;
        global.cancelAnimationFrame = _cancelAnimationFrame;
    });

    it('should be a function', () => {
        expect(requestAnimationFrame).toBeFunction();
    });

    it('should not call the callback immediately', () => {
        const callback = jest.fn();
        requestAnimationFrame(callback);
        expect(callback).not.toHaveBeenCalled();
    });

    it('should raf the callback', () => {
        const callback = noop;
        requestAnimationFrame(callback);
        expect(requestAnimationFrameMock).toHaveBeenCalledTimes(1);
        expect(requestAnimationFrameMock).toHaveBeenCalledWith(callback);
    });

    it('should not raf the callback when given a disposed disposable', () => {
        const callback = noop;
        const disposable = Disposable();
        disposable.dispose();
        requestAnimationFrame(callback, disposable);
        expect(requestAnimationFrameMock).not.toHaveBeenCalled();
    });

    it('should raf the callback when given an active disposable', () => {
        const callback = noop;
        const disposable = Disposable();
        requestAnimationFrame(callback, disposable);
        expect(requestAnimationFrameMock).toHaveBeenCalledTimes(1);
        expect(requestAnimationFrameMock).toHaveBeenCalledWith(callback);
    });

    it('should cancel the scheduled callback when the given disposable is disposed', () => {
        const callback = noop;
        const disposable = Disposable();
        requestAnimationFrame(callback, disposable);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const id: number = requestAnimationFrameMock.mock.results[0].value;
        disposable.dispose();
        expect(cancelAnimationFrameMock).toHaveBeenCalledTimes(1);
        expect(cancelAnimationFrameMock).toHaveBeenCalledWith(id);
    });
});

describe('setTimeout', () => {
    const _setTimeout = global.setTimeout;
    const _clearTimeout = global.clearTimeout;
    const setTimeoutMock = jest.fn();
    const clearTimeoutMock = jest.fn();
    beforeAll(() => {
        // eslint-disable-next-line max-len
        global.setTimeout = (setTimeoutMock as unknown) as typeof global.setTimeout;
        global.clearTimeout = clearTimeoutMock;
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    afterAll(() => {
        global.setTimeout = _setTimeout;
        global.clearTimeout = _clearTimeout;
    });

    it('should be a function', () => {
        expect(setTimeout).toBeFunction();
    });

    it('should not call the callback immediately', () => {
        const callback = jest.fn();
        setTimeout(callback, 29);
        expect(callback).not.toHaveBeenCalled();
    });

    it('should call native setTimeout with the callback and delay', () => {
        const callback = noop;
        const delay = 16;
        setTimeout(callback, delay);
        expect(setTimeoutMock).toHaveBeenCalledTimes(1);
        expect(setTimeoutMock).toHaveBeenCalledWith(callback, delay);
    });

    it('should call native setTimeout with any additional arguments given', () => {
        const extraArgs = [2, { foo: 'bar' }, noop, Symbol()];
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const callback = noop;
        const delay = 49;
        setTimeout<typeof extraArgs>(
            callback,
            delay,
            Disposable(),
            ...extraArgs,
        );
        expect(setTimeoutMock).toHaveBeenCalledTimes(1);
        expect(setTimeoutMock).toHaveBeenCalledWith(
            callback,
            delay,
            ...extraArgs,
        );
    });

    it('should default delay to zero', () => {
        const callback = noop;
        setTimeout(callback);
        expect(setTimeoutMock).toHaveBeenCalledTimes(1);
        expect(setTimeoutMock).toHaveBeenCalledWith(callback, 0);
    });

    it('should not call native setTimeout when given a disposed disposable', () => {
        const callback = noop;
        const delay = 13;
        const disposable = Disposable();
        disposable.dispose();
        setTimeout(callback, delay, disposable);
        expect(setTimeoutMock).not.toHaveBeenCalled();
    });

    it('should call native setTimeout with the callback and delay when given an active disposable', () => {
        const callback = noop;
        const disposable = Disposable();
        const delay = 0;
        setTimeout(callback, delay, disposable);
        expect(setTimeoutMock).toHaveBeenCalledTimes(1);
        expect(setTimeoutMock).toHaveBeenCalledWith(callback, delay);
    });

    it('should cancel the scheduled callback when the given disposable is disposed', () => {
        const callback = noop;
        const disposable = Disposable();
        const delay = 0;
        setTimeout(callback, delay, disposable);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const id: number = ((setTimeoutMock as unknown) as jest.Mock).mock
            .results[0].value;
        disposable.dispose();
        expect(clearTimeoutMock).toHaveBeenCalledTimes(1);
        expect(clearTimeoutMock).toHaveBeenCalledWith(id);
    });
});

describe('setInterval', () => {
    let _fakeSetInterval;
    let _fakeClearInterval;
    let setIntervalMock: jest.Mock;
    let clearIntervalMock: jest.Mock;
    function replaceIntervalsWithMock(): void {
        // eslint-disable-next-line max-len
        global.setInterval = (setIntervalMock as unknown) as typeof global.setInterval;
        global.clearInterval = clearIntervalMock;
    }
    function restoreFakeTimers(): void {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        global.setInterval = _fakeSetInterval;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        global.clearInterval = _fakeClearInterval;
    }
    beforeAll(() => {
        _fakeSetInterval = global.setInterval;
        _fakeClearInterval = global.clearInterval;
        setIntervalMock = jest.fn(_fakeSetInterval);
        clearIntervalMock = jest.fn(_fakeClearInterval);
        replaceIntervalsWithMock();
    });
    afterEach(() => {
        jest.clearAllMocks();
        restoreFakeTimers();
        jest.clearAllTimers();
        replaceIntervalsWithMock();
    });
    afterAll(() => {
        restoreFakeTimers();
    });

    it('should be a function', () => {
        expect(setInterval).toBeFunction();
    });

    it('should not call the callback immediately', () => {
        const callback = jest.fn();
        setInterval(callback, 43);
        expect(callback).not.toHaveBeenCalled();
    });

    it('should call native setInterval with the callback and delay', () => {
        const callback = noop;
        const delay = 16;
        setInterval(callback, delay);
        expect(setIntervalMock).toHaveBeenCalledTimes(1);
        expect(setIntervalMock).toHaveBeenCalledWith(callback, delay);
    });

    it('should call native setInterval with any additional arguments given', () => {
        const extraArgs = [2, { foo: 'bar' }, noop, Symbol()];
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const callback = noop;
        const delay = 32;
        setInterval<typeof extraArgs>(
            callback,
            delay,
            Disposable(),
            ...extraArgs,
        );
        expect(setIntervalMock).toHaveBeenCalledTimes(1);
        expect(setIntervalMock).toHaveBeenCalledWith(
            callback,
            delay,
            ...extraArgs,
        );
    });

    it('should default delay to zero', () => {
        const callback = noop;
        setInterval(callback);
        expect(setIntervalMock).toHaveBeenCalledTimes(1);
        expect(setIntervalMock).toHaveBeenCalledWith(callback, 0);
    });

    it('should not call native setInterval when given a disposed disposable', () => {
        const callback = noop;
        const delay = 13;
        const disposable = Disposable();
        disposable.dispose();
        setInterval(callback, delay, disposable);
        expect(setIntervalMock).not.toHaveBeenCalled();
    });

    it('should call native setInterval with the callback and delay when given an active disposable', () => {
        const callback = noop;
        const disposable = Disposable();
        const delay = 0;
        setInterval(callback, delay, disposable);
        expect(setIntervalMock).toHaveBeenCalledTimes(1);
        expect(setIntervalMock).toHaveBeenCalledWith(callback, delay);
    });

    it('should not cancel the interval after the scheduled callback is called if the disposable is still active', () => {
        const callback = noop;
        const disposable = Disposable();
        const delay = 29;
        setInterval(callback, delay, disposable);
        for (let i = 0; i < 5; i++) {
            jest.runOnlyPendingTimers();
            expect(setIntervalMock).toHaveBeenCalledTimes(1);
            expect(clearIntervalMock).not.toHaveBeenCalled();
        }
    });

    it('should cancel the interval when the given disposable is disposed', () => {
        const callback = noop;
        const disposable = Disposable();
        const delay = 2983;
        setInterval(callback, delay, disposable);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const id: number = setIntervalMock.mock.results[0].value;
        disposable.dispose();
        expect(clearIntervalMock).toHaveBeenCalledTimes(1);
        expect(clearIntervalMock).toHaveBeenCalledWith(id);
    });

    it('should cancel the interval when the given disposable is disposed after a few interval durations', () => {
        const callback = noop;
        const disposable = Disposable();
        const delay = 91;
        setInterval(callback, delay, disposable);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const id: number = setIntervalMock.mock.results[0].value;
        for (let i = 0; i < 5; i++) {
            jest.runOnlyPendingTimers();
        }
        disposable.dispose();
        expect(clearIntervalMock).toHaveBeenCalledTimes(1);
        expect(clearIntervalMock).toHaveBeenCalledWith(id);
    });
});

// eslint-disable-next-line jest/no-focused-tests
describe('asyncReportError', () => {
    let _fakeSetTimeout;
    let setTimeoutMock: jest.Mock;
    function replaceSetTimeoutWithMock(): void {
        // eslint-disable-next-line max-len
        global.setTimeout = (setTimeoutMock as unknown) as typeof global.setTimeout;
    }
    function restoreFakeTimers(): void {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        global.setTimeout = _fakeSetTimeout;
    }
    beforeAll(() => {
        _fakeSetTimeout = global.setTimeout;
        setTimeoutMock = jest.fn(_fakeSetTimeout);
        replaceSetTimeoutWithMock();
    });
    afterEach(() => {
        jest.clearAllMocks();
        restoreFakeTimers();
        jest.clearAllTimers();
        replaceSetTimeoutWithMock();
    });
    afterAll(() => {
        restoreFakeTimers();
    });

    it('should be a function', () => {
        expect(asyncReportError).toBeFunction();
    });

    it('should not raise the error immediately', () => {
        expect(() => asyncReportError(new Error('foo'))).not.toThrow();
    });

    it('should call setTimeout with a delay of zero', () => {
        asyncReportError(new Error('foo'));
        expect(setTimeoutMock).toHaveBeenCalledTimes(1);
        expect(setTimeoutMock).toHaveBeenCalledWith(expect.any(Function), 0);
    });

    it('should call setTimeout with a callback that throws the given error', () => {
        const error = new TypeError('Foo.');
        asyncReportError(error);
        expect(
            // eslint-disable-next-line max-len
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            setTimeoutMock.mock.calls[0][0],
        ).toThrow(error);
    });

    it('should schedule a timeout that throws the error', () => {
        const error = new Error('bar');
        asyncReportError(error);
        expect(jest.getTimerCount()).toBe(1);
        expect(() => jest.advanceTimersToNextTimer()).toThrow(error);
        expect(jest.getTimerCount()).toBe(0);
    });
});

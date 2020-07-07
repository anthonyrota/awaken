import { removeOnce } from '../src/util';
import {
    Disposable,
    pipe,
    flow,
    // requestAnimationFrame,
    setTimeout,
    setInterval,
    asyncReportError,
} from 'awakening';
import each from 'jest-each';

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

    it('should do nothing when given an empty array-like object', () => {
        const array = { length: 0 };
        removeOnce(array, x);
        expect(array).toEqual({ length: 0 });
    });

    const A = 'A';
    const B = { foo: 'baz' };

    each([
        [[[B]], [[B]]],
        [[[A, B, B, A]], [[A, B, B, A]]],
        [[[A, B, A, A, A, B]], [[A, B, A, A, A, B]]],
        [[{ length: 1, 0: A }], [{ length: 1, 0: A }]],
        [
            [{ length: 29, 4: A, 17: B, 23: A }],
            [{ length: 29, 4: A, 17: B, 23: A }],
        ],
    ]).it(`should do nothing when removing "${x}" from %s`, (input, copy) => {
        removeOnce(input, x);
        // eslint-disable-next-line jest/no-standalone-expect
        expect(input).toEqual(copy);
    });

    // prettier-ignore
    each([
        [[x], []],
        [{ length: 1, 0: x }, { length: 0 }],
        [[A, x], [A]],
        [{ length: 2, 1: x }, { length: 1 }],
        // eslint-disable-next-line max-len
        [{ length: 2, 0: A, 1: x, 2: A, 3: B }, { length: 1, 0: A, 2: A, 3: B }],
        [[x, B], [B]],
        [{ length: 2, 0: x, 1: B }, { length: 1, 0: B }],
        [[A, x, B, B, A], [A, B, B, A]],
        [{ length: 28, '-1': B, 1: x, 3: B, 16: A }, { length: 27, '-1': B, 2: B, 15: A }],
    ]).it(`should remove the only "${x}" from %s`, (input, output) => {
        removeOnce(input, x);
        // eslint-disable-next-line jest/no-standalone-expect
        expect(input).toEqual(output);
    });

    // prettier-ignore
    each([
        [[x, x, x, x], [x, x, x]],
        [{ length: 2, 0: x, 1: x, 2: x }, { length: 1, 0: x, 2: x }],
        [[A,x, B, x, A], [A, B, x, A]],
        [{ length: 3, 0: A, 1: x, 2: x }, { length: 2, 0: A, 1: x }],
        [{ length: 23, '-6': A, 3: x, 4: x, 5: B }, { length: 22, '-6': A, 3: x, 4: B }],
        [[x, B, x, A], [B, x, A]],
        [{ length: 4, 0: x, 1: B, 2: x, 3: A }, { length: 3, 0: B, 1: x, 2: A }]
    ]).it(`should remove only the first "${x}" from %s`, (input, output) => {
        removeOnce(input, x);
        // eslint-disable-next-line jest/no-standalone-expect
        expect(input).toEqual(output);
    });
});

/* eslint-disable */
// describe('requestAnimationFrame', () => {
//     afterEach(jest.clearAllMocks);
//     afterEach(rafMock._resetQueue);

//     it('should be a function', () => {
//         expect(requestAnimationFrame).toBeFunction();
//     });

//     it('should not call the callback immediately', () => {
//         const callback = jest.fn();
//         requestAnimationFrame(callback);
//         expect(callback).not.toHaveBeenCalled();
//     });

//     it('should raf the callback', () => {
//         // eslint-disable-next-line @typescript-eslint/no-empty-function
//         const callback = () => {};
//         requestAnimationFrame(callback);
//         expect(rafMock).toHaveBeenCalledTimes(1);
//         expect(rafMock).toHaveBeenCalledWith(callback);
//     });

//     it('should not raf the callback when given a disposed disposable', () => {
//         // eslint-disable-next-line @typescript-eslint/no-empty-function
//         const callback = () => {};
//         const disposable = Disposable();
//         disposable.dispose();
//         requestAnimationFrame(callback, disposable);
//         expect(rafMock).not.toHaveBeenCalled();
//     });

//     it('should raf the callback when given an active disposable', () => {
//         // eslint-disable-next-line @typescript-eslint/no-empty-function
//         const callback = () => {};
//         const disposable = Disposable();
//         requestAnimationFrame(callback, disposable);
//         expect(rafMock).toHaveBeenCalledTimes(1);
//         expect(rafMock).toHaveBeenCalledWith(callback);
//     });

//     it('should cancel the scheduled callback when the given disposable is disposed', () => {
//         // eslint-disable-next-line @typescript-eslint/no-empty-function
//         const callback = () => {};
//         const disposable = Disposable();
//         requestAnimationFrame(callback, disposable);
//         // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
//         const id: number = rafMock.mock.results[0].value;
//         disposable.dispose();
//         expect(rafMock.cancel).toHaveBeenCalledTimes(1);
//         expect(rafMock.cancel).toHaveBeenCalledWith(id);
//     });
// });
/* eslint-enable */

describe('setTimeout', () => {
    beforeEach(() => {
        jest.useFakeTimers('legacy');
    });
    afterEach(jest.useRealTimers);
    afterEach(jest.clearAllTimers);

    it('should be a function', () => {
        expect(setTimeout).toBeFunction();
    });

    it('should not call the callback immediately', () => {
        const callback = jest.fn();
        setTimeout(callback, 29);
        expect(callback).not.toHaveBeenCalled();
    });

    it('should call native setTimeout with the callback and delay', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const callback = () => {};
        const delay = 16;
        setTimeout(callback, delay);
        expect(global.setTimeout).toHaveBeenCalledTimes(1);
        expect(global.setTimeout).toHaveBeenCalledWith(callback, delay);
    });

    it('should call native setTimeout with any additional arguments given', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const extraArgs = [2, { foo: 'bar' }, () => {}, Symbol()] as const;
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
        const callback = (..._args: typeof extraArgs) => {};
        const delay = 49;
        setTimeout(callback, delay, Disposable(), ...extraArgs);
        expect(global.setTimeout).toHaveBeenCalledTimes(1);
        expect(global.setTimeout).toHaveBeenCalledWith(
            callback,
            delay,
            ...extraArgs,
        );
    });

    it('should default delay to zero', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const callback = () => {};
        setTimeout(callback);
        expect(global.setTimeout).toHaveBeenCalledTimes(1);
        expect(global.setTimeout).toHaveBeenCalledWith(callback, 0);
    });

    it('should not call native setTimeout when given a disposed disposable', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const callback = () => {};
        const delay = 13;
        const disposable = Disposable();
        disposable.dispose();
        setTimeout(callback, delay, disposable);
        expect(global.setTimeout).not.toHaveBeenCalled();
    });

    it('should call native setTimeout with the callback and delay when given an active disposable', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const callback = () => {};
        const disposable = Disposable();
        const delay = 0;
        setTimeout(callback, delay, disposable);
        expect(global.setTimeout).toHaveBeenCalledTimes(1);
        expect(global.setTimeout).toHaveBeenCalledWith(callback, delay);
    });

    it('should cancel the scheduled callback when the given disposable is disposed', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const callback = () => {};
        const disposable = Disposable();
        const delay = 0;
        setTimeout(callback, delay, disposable);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const id: number = ((global.setTimeout as unknown) as jest.Mock).mock
            .results[0].value;
        disposable.dispose();
        expect(global.clearTimeout).toHaveBeenCalledTimes(1);
        expect(global.clearTimeout).toHaveBeenCalledWith(id);
    });
});

describe('setInterval', () => {
    beforeEach(() => {
        jest.useFakeTimers('legacy');
    });
    afterEach(jest.useRealTimers);
    afterEach(jest.clearAllTimers);

    it('should be a function', () => {
        expect(setInterval).toBeFunction();
    });

    it('should not call the callback immediately', () => {
        const callback = jest.fn();
        setInterval(callback, 43);
        expect(callback).not.toHaveBeenCalled();
    });

    it('should call native setInterval with the callback and delay', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const callback = () => {};
        const delay = 16;
        setInterval(callback, delay);
        expect(global.setInterval).toHaveBeenCalledTimes(1);
        expect(global.setInterval).toHaveBeenCalledWith(callback, delay);
    });

    it('should call native setInterval with any additional arguments given', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const extraArgs = [2, { foo: 'bar' }, () => {}, Symbol()] as const;
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
        const callback = (..._args: typeof extraArgs) => {};
        const delay = 32;
        setInterval(callback, delay, Disposable(), ...extraArgs);
        expect(global.setInterval).toHaveBeenCalledTimes(1);
        expect(global.setInterval).toHaveBeenCalledWith(
            callback,
            delay,
            ...extraArgs,
        );
    });

    it('should default delay to zero', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const callback = () => {};
        setInterval(callback);
        expect(global.setInterval).toHaveBeenCalledTimes(1);
        expect(global.setInterval).toHaveBeenCalledWith(callback, 0);
    });

    it('should not call native setInterval when given a disposed disposable', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const callback = () => {};
        const delay = 13;
        const disposable = Disposable();
        disposable.dispose();
        setInterval(callback, delay, disposable);
        expect(global.setInterval).not.toHaveBeenCalled();
    });

    it('should call native setInterval with the callback and delay when given an active disposable', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const callback = () => {};
        const disposable = Disposable();
        const delay = 0;
        setInterval(callback, delay, disposable);
        expect(global.setInterval).toHaveBeenCalledTimes(1);
        expect(global.setInterval).toHaveBeenCalledWith(callback, delay);
    });

    it('should not cancel the interval after the scheduled callback is called if the disposable is still active', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const callback = () => {};
        const disposable = Disposable();
        const delay = 29;
        setInterval(callback, delay, disposable);
        for (let i = 0; i < 5; i++) {
            jest.runOnlyPendingTimers();
            expect(global.setInterval).toHaveBeenCalledTimes(1);
            expect(global.clearInterval).not.toHaveBeenCalled();
        }
    });

    it('should cancel the interval when the given disposable is disposed', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const callback = () => {};
        const disposable = Disposable();
        const delay = 2983;
        setInterval(callback, delay, disposable);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const id: number = (global.setInterval as jest.Mock).mock.results[0]
            .value;
        disposable.dispose();
        expect(global.clearInterval).toHaveBeenCalledTimes(1);
        expect(global.clearInterval).toHaveBeenCalledWith(id);
    });

    it('should cancel the interval when the given disposable is disposed after a few interval durations', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const callback = () => {};
        const disposable = Disposable();
        const delay = 91;
        setInterval(callback, delay, disposable);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const id: number = (global.setInterval as jest.Mock).mock.results[0]
            .value;
        for (let i = 0; i < 5; i++) {
            jest.runOnlyPendingTimers();
        }
        disposable.dispose();
        expect(global.clearInterval).toHaveBeenCalledTimes(1);
        expect(global.clearInterval).toHaveBeenCalledWith(id);
    });
});

describe('asyncReportError', () => {
    beforeEach(() => {
        jest.useFakeTimers('legacy');
    });
    afterEach(jest.useRealTimers);
    afterEach(jest.clearAllTimers);

    it('should be a function', () => {
        expect(asyncReportError).toBeFunction();
    });

    it('should not raise the error immediately', () => {
        expect(() => asyncReportError(new Error('foo'))).not.toThrow();
    });

    it('should call setTimeout with a delay of zero', () => {
        asyncReportError(new Error('foo'));
        expect(global.setTimeout).toHaveBeenCalledTimes(1);
        expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should call setTimeout with a callback that throws the given error', () => {
        const error = new TypeError('Foo.');
        asyncReportError(error);
        expect(
            // eslint-disable-next-line max-len
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            ((global.setTimeout as unknown) as jest.Mock).mock.calls[0][0],
        ).toThrow(error);
    });
});

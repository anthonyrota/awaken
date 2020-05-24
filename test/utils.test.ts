import {
    pipe,
    flow,
    toArray,
    removeOnce,
    getLast,
    requestAnimationFrame,
    setTimeout,
    setInterval,
    asyncReportError,
    get$$iterator,
    get$$asyncIterator,
    isIterable,
    isAsyncIterable,
    isPromiseLike,
} from '../src/utils';
import { Disposable } from '../src/disposable';
import { Tail } from './../src/types';
import cloneDeep = require('lodash.clonedeep');
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

const composableCase1 = [''] as const;
const composableCase2 = ['+f1', composableFunction1] as const;
// prettier-ignore
const composableCase3 = ['+f1+f2', composableFunction1, composableFunction2] as const;
// prettier-ignore
const composableCase4 = ['+f1+f2+f3', composableFunction1, composableFunction2, composableFunction3] as const;
// prettier-ignore
const composableCase5 = ['+f1+f2+f3+f4', composableFunction1, composableFunction2, composableFunction3, composableFunction4] as const;
// prettier-ignore
const composableCase6 = ['+f1+f2+f3+f4+f5', composableFunction1, composableFunction2, composableFunction3, composableFunction4, composableFunction5] as const;
// prettier-ignore
const composableCase7 = ['+f1+f2+f3+f4+f5+f6', composableFunction1, composableFunction2, composableFunction3, composableFunction4, composableFunction5, composableFunction6] as const;
// prettier-ignore
const composableCase8 = ['+f1+f2+f3+f4+f5+f6+f7', composableFunction1, composableFunction2, composableFunction3, composableFunction4, composableFunction5, composableFunction6, composableFunction7] as const;
// prettier-ignore
const composableCase9 = ['+f1+f2+f3+f4+f5+f6+f7+f8', composableFunction1, composableFunction2, composableFunction3, composableFunction4, composableFunction5, composableFunction6, composableFunction7, composableFunction8] as const;
// prettier-ignore
const composableCase10 = ['+f1+f2+f3+f4+f5+f6+f7+f8+f9', composableFunction1, composableFunction2, composableFunction3, composableFunction4, composableFunction5, composableFunction6, composableFunction7, composableFunction8, composableFunction9] as const;
// prettier-ignore
const composableCase11 = ['+f1+f2+f3+f4+f5+f6+f7+f8+f9+f10', composableFunction1, composableFunction2, composableFunction3, composableFunction4, composableFunction5, composableFunction6, composableFunction7, composableFunction8, composableFunction9, composableFunction10] as const;
// prettier-ignore
const composableCase12 = ['+f1+f2+f3+f4+f5+f6+f7+f8+f9+f10+f11', composableFunction1, composableFunction2, composableFunction3, composableFunction4, composableFunction5, composableFunction6, composableFunction7, composableFunction8, composableFunction9, composableFunction10, composableFunction11] as const;

// prettier-ignore
// eslint-disable-next-line max-len
type ComposableCases = [typeof composableCase1, typeof composableCase2, typeof composableCase3, typeof composableCase4, typeof composableCase5, typeof composableCase6, typeof composableCase7, typeof composableCase8, typeof composableCase9, typeof composableCase10, typeof composableCase11, typeof composableCase12];
// prettier-ignore
// eslint-disable-next-line max-len
const composableCases: ComposableCases = [composableCase1, composableCase2, composableCase3, composableCase4, composableCase5, composableCase6, composableCase7, composableCase8, composableCase9, composableCase10, composableCase11, composableCase12];

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
type _MapGetTail<T> = { [P in keyof T]: Tail<T[P]> };
// For some reason, inlining the following operation breaks it (the returned
// type is the mapping of all of the tuple's properties instead of the tuple
// itself) so this is necessary.
type ComposableCaseFunctions = _MapGetTail<ComposableCases>[number];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type _DistributeCaseTestFn<T> = T extends any[]
    ? (expected: string, ...fns: T) => void
    : never;
type ComposableCaseTestFn = _DistributeCaseTestFn<ComposableCaseFunctions>;

describe('pipe', () => {
    it('should exist', () => {
        expect(pipe).toBeFunction();
    });

    // Inlining the test function without it's type being a union of the
    // individual test cases causes a type error for some reason.
    const testPipe: ComposableCaseTestFn = (
        expected: string,
        ...fns: ComposableCaseFunctions
    ): void => {
        expect(pipe('XXX', ...fns)).toBe('XXX' + expected);
        expect(pipe('YYY', ...fns)).toBe('YYY' + expected);
    };

    each(composableCases).it('should apply %# function(s) ltr', testPipe);
});

describe('flow', () => {
    it('should exist', () => {
        expect(flow).toBeFunction();
    });

    // Inlining the test function without it's type being a union of the
    // individual test cases causes a type error for some reason.
    const testFlow: ComposableCaseTestFn = (
        expected: string,
        ...fns: ComposableCaseFunctions
    ): void => {
        const composed = flow(...fns);
        expect(composed('XXX')).toBe('XXX' + expected);
        expect(composed('YYY')).toBe('YYY' + expected);
    };

    each(composableCases).it('should ltr compose %# function(s)', testFlow);
});

describe('toArray', () => {
    it('should exist', () => {
        expect(toArray).toBeFunction();
    });

    it('should return the argument if given an empty array', () => {
        const array = [];
        expect(toArray(array)).toBe(array);
        expect(array).toEqual([]);
    });

    it('should return the argument if given an array', () => {
        const array = [0, 4, { foo: 'bar' }];
        expect(toArray(array)).toBe(array);
        expect(array).toEqual([0, 4, { foo: 'bar' }]);
    });

    it('should convert an empty iterable into an empty array', () => {
        expect(toArray([][Symbol.iterator]())).toEqual([]);
    });

    it('should convert an iterable into an array', () => {
        const object = [{ bar: 'baz' }];
        function* iter(): Generator<unknown> {
            yield 1;
            yield 'foo';
            yield [{ bar: 'baz' }];
            return 12;
        }
        expect(toArray(iter())).toEqual([1, 'foo', object]);
        expect(object).toEqual([{ bar: 'baz' }]);
    });

    it('should convert an empty array-like object into an array', () => {
        expect(toArray({ length: 0 })).toEqual([]);
    });

    it('should convert non-zero length array-like object with non-defined items into an array', () => {
        expect(toArray({ length: 5, 2: 'XXX' })).toEqual([
            undefined,
            undefined,
            'XXX',
            undefined,
            undefined,
        ]);
    });

    it('should convert an array-like object into an array', () => {
        const object = { foo: ['baz'] };
        const symbol = Symbol();
        expect(
            toArray({
                length: 6,
                0: symbol,
                1: 'foo',
                2: 6,
                3: object,
                4: true,
                5: 'bar',
            }),
        ).toEqual([symbol, 'foo', 6, object, true, 'bar']);
    });
});

describe('removeOnce', () => {
    it('should exist', () => {
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
        [[B]],
        [[A, B, B, A]],
        [[A, B, A, A, A, B]],
        [{ length: 1, 0: A }],
        [{ length: 29, 4: A, 17: B, 23: A }],
    ]).it(
        `should do nothing when removing "${x}" from %s`,
        (input: unknown[]) => {
            const copy = cloneDeep(input);
            removeOnce(copy, x);
            // eslint-disable-next-line jest/no-standalone-expect
            expect(copy).toEqual(input);
        },
    );

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

describe('getLast', () => {
    it('should exist', () => {
        expect(getLast).toBeFunction();
    });

    it('should return undefined for an empty array', () => {
        expect(getLast([])).toBeUndefined();
    });

    it('should return undefined for an empty array-like object', () => {
        expect(getLast({ length: 0 })).toBeUndefined();
    });

    it('should return undefined for an empty array-like object with key "-1" defined', () => {
        expect(getLast({ length: 0, '-1': 'XXX' })).toBeUndefined();
    });

    it('should return the only item for an array of length one', () => {
        const object = { foo: 'bar' };
        expect(getLast([object])).toBe(object);
    });

    it('should return the only item for an array-like object of length one', () => {
        const object = { foo: 'bar' };
        expect(getLast({ length: 1, 0: object })).toBe(object);
    });

    it('should return the last element of an array', () => {
        const object = { foo: 'bar' };
        expect(getLast([0, 2, ['XXX'], 6, object])).toBe(object);
    });

    it('should return the last element of an array-like object', () => {
        const object = { foo: 'bar' };
        expect(
            getLast({
                length: 6,
                1: 7,
                3: ['XXX'],
                4: 'baz',
                5: object,
                6: 'foo',
                23: 'bar',
            }),
        ).toBe(object);
    });
});

interface RafMock extends jest.Mock {
    cancel: jest.Mock;
}

jest.mock(
    'raf',
    (): RafMock => {
        let id = 61;
        return Object.assign(
            jest.fn(() => id++),
            { cancel: jest.fn() },
        );
    },
);

import raf = require('raf');
const rafMock = (raf as unknown) as RafMock;

describe('requestAnimationFrame', () => {
    afterEach(jest.resetAllMocks);

    it('should exist', () => {
        expect(requestAnimationFrame).toBeFunction();
    });

    it('should not call the callback immediately', () => {
        const callback = jest.fn();
        requestAnimationFrame(callback);
        expect(callback).not.toHaveBeenCalled();
    });

    it('should raf the callback', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const callback = () => {};
        requestAnimationFrame(callback);
        expect(rafMock).toHaveBeenCalledTimes(1);
        expect(rafMock).toHaveBeenCalledWith(callback);
    });

    it('should not raf the callback when given a disposed disposable', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const callback = () => {};
        const disposable = new Disposable();
        disposable.dispose();
        requestAnimationFrame(callback, disposable);
        expect(rafMock).not.toHaveBeenCalled();
    });

    it('should raf the callback when given an active disposable', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const callback = () => {};
        const disposable = new Disposable();
        requestAnimationFrame(callback, disposable);
        expect(rafMock).toHaveBeenCalledTimes(1);
        expect(rafMock).toHaveBeenCalledWith(callback);
    });

    it('should cancel the scheduled callback when the given disposable is disposed', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const callback = () => {};
        const disposable = new Disposable();
        requestAnimationFrame(callback, disposable);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const id: number = rafMock.mock.results[0].value;
        disposable.dispose();
        expect(rafMock.cancel).toHaveBeenCalledTimes(1);
        expect(rafMock.cancel).toHaveBeenCalledWith(id);
    });
});

describe('setTimeout', () => {
    beforeAll(jest.useFakeTimers);
    afterAll(jest.useRealTimers);
    afterEach(jest.resetAllMocks);

    it('should exist', () => {
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
        setTimeout(callback, delay, new Disposable(), ...extraArgs);
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
        const disposable = new Disposable();
        disposable.dispose();
        setTimeout(callback, delay, disposable);
        expect(global.setTimeout).not.toHaveBeenCalled();
    });

    it('should call native setTimeout with the callback and delay when given an active disposable', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const callback = () => {};
        const disposable = new Disposable();
        const delay = 0;
        setTimeout(callback, delay, disposable);
        expect(global.setTimeout).toHaveBeenCalledTimes(1);
        expect(global.setTimeout).toHaveBeenCalledWith(callback, delay);
    });

    it('should cancel the scheduled callback when the given disposable is disposed', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const callback = () => {};
        const disposable = new Disposable();
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
    beforeAll(jest.useFakeTimers);
    afterAll(jest.useRealTimers);
    afterEach(jest.resetAllMocks);

    it('should exist', () => {
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
        setInterval(callback, delay, new Disposable(), ...extraArgs);
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
        const disposable = new Disposable();
        disposable.dispose();
        setInterval(callback, delay, disposable);
        expect(global.setInterval).not.toHaveBeenCalled();
    });

    it('should call native setInterval with the callback and delay when given an active disposable', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const callback = () => {};
        const disposable = new Disposable();
        const delay = 0;
        setInterval(callback, delay, disposable);
        expect(global.setInterval).toHaveBeenCalledTimes(1);
        expect(global.setInterval).toHaveBeenCalledWith(callback, delay);
    });

    it('should not cancel the interval after the scheduled callback is called if the disposable is still active', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const callback = () => {};
        const disposable = new Disposable();
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
        const disposable = new Disposable();
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
        const disposable = new Disposable();
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
    beforeAll(jest.useFakeTimers);
    afterAll(jest.useRealTimers);
    afterEach(jest.resetAllMocks);

    it('should exist', () => {
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

describe('get$$iterator', () => {
    it('should exist', () => {
        expect(get$$iterator).toBeFunction();
    });

    it('should return Symbol.iterator', () => {
        expect(get$$iterator()).toBe(Symbol.iterator);
    });

    const _Symbol = Symbol;

    afterEach(() => {
        global.Symbol = _Symbol;
    });

    it('should return "@@iterator" if Symbol does not exist', () => {
        delete global.Symbol;
        expect(get$$iterator()).toBe('@@iterator');
    });
});

describe('get$$asyncIterator', () => {
    it('should exist', () => {
        expect(get$$asyncIterator).toBeFunction();
    });

    it('should return Symbol.asyncIterator', () => {
        expect(get$$asyncIterator()).toBe(Symbol.asyncIterator);
    });

    const _Symbol = Symbol;

    afterEach(() => {
        global.Symbol = _Symbol;
    });

    it('should return undefined if Symbol does not exist', () => {
        delete global.Symbol;
        expect(get$$asyncIterator()).toBeUndefined();
    });

    it('should return undefined if Symbol.asyncIterator does not exist', () => {
        global.Symbol = {} as typeof global.Symbol;
        expect(get$$asyncIterator()).toBeUndefined();
    });
});

const simpleFalseValues: [string, unknown][] = [
    ['undefined', undefined],
    ['null', null],
    ['a number', 17],
    ['a boolean', true],
    ['a symbol', Symbol('foo')],
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    ['a function', () => {}],
];

describe('isIterable', () => {
    it('should exist', () => {
        expect(isIterable).toBeFunction();
    });

    function getFalseValuesWithIteratorKey(
        key: string | symbol,
        keyDesc: string,
    ): [string, unknown][] {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const falseIteratorKeyFunction = Object.assign(() => {}, {
            [key]: 'foo',
        });

        // prettier-ignore
        return [
            [`an object with a non-method ${keyDesc} key`, { foo: 'bar', [key]: 'baz' }],
            [`a function with a non-method ${keyDesc} key`, falseIteratorKeyFunction]
        ];
    }

    const falseValuesWithNativeIteratorKey = getFalseValuesWithIteratorKey(
        Symbol.iterator,
        'Symbol.iterator',
    );
    const falseValuesWithCompatIteratorKey = getFalseValuesWithIteratorKey(
        '@@iterator',
        '(compat) "@@iterator"',
    );

    each([
        ...simpleFalseValues,
        ...falseValuesWithNativeIteratorKey,
        ...falseValuesWithCompatIteratorKey,
    ]).it('should return false when given %s', (_, value) => {
        // eslint-disable-next-line jest/no-standalone-expect
        expect(isIterable(value)).toBeFalse();
    });

    const _Symbol = Symbol;

    afterEach(() => {
        global.Symbol = _Symbol;
    });

    each([...simpleFalseValues, ...falseValuesWithCompatIteratorKey]).it(
        'should return false if Symbol does not exist when given %s',
        (_, value) => {
            delete global.Symbol;
            // eslint-disable-next-line jest/no-standalone-expect
            expect(isIterable(value)).toBeFalse();
        },
    );

    function getTrueValuesWithIteratorKey(
        key: string | symbol,
        keyDesc: string,
    ): [string, unknown][] {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const function1 = Object.assign(() => {}, {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            [key]() {},
        });

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const function2 = Object.assign(() => {}, {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            async [key]() {},
        });

        return [
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            [`an object with a ${keyDesc} method`, { foo: 'bar', [key]() {} }],
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            [`an object with an async ${keyDesc} method`, { async [key]() {} }],
            [`a function with a ${keyDesc} method`, function1],
            [`a function with an async ${keyDesc} method`, function2],
        ];
    }

    const trueValuesWithNativeIteratorKey = [
        ['a string', 'foo'],
        ...getTrueValuesWithIteratorKey(Symbol.iterator, 'Symbol.iterator'),
    ];
    const trueValuesWithCompatIteratorKey = getTrueValuesWithIteratorKey(
        '@@iterator',
        '(compat) "@@iterator"',
    );

    each(trueValuesWithCompatIteratorKey).it(
        'should return false if Symbol.iterator exists when given %s',
        (_, value) => {
            // eslint-disable-next-line jest/no-standalone-expect
            expect(isIterable(value)).toBeFalse();
        },
    );

    each(trueValuesWithNativeIteratorKey).it(
        'should return true when given %s',
        (_, value) => {
            // eslint-disable-next-line jest/no-standalone-expect
            expect(isIterable(value)).toBeTrue();
        },
    );

    each(trueValuesWithCompatIteratorKey).it(
        'should return true if Symbol.iterator does not exist when given %s',
        (_, value) => {
            delete global.Symbol;
            // eslint-disable-next-line jest/no-standalone-expect
            expect(isIterable(value)).toBeTrue();
        },
    );
});

describe('isAsyncIterable', () => {
    it('should exist', () => {
        expect(isAsyncIterable).toBeFunction();
    });

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const falseAsyncIteratorFunction = Object.assign(() => {}, {
        [Symbol.asyncIterator]: 'foo',
    });

    // prettier-ignore
    const falseValuesWithAsyncIteratorKey = [
        ...simpleFalseValues,
        ['a string', 'foo'],
        ['an object with a non-method Symbol.asyncIterator key', { foo: 'bar', [Symbol.asyncIterator]: 'baz' }],
        ['a function with a non-method Symbol.asyncIterator key', falseAsyncIteratorFunction],
    ];

    each(falseValuesWithAsyncIteratorKey).it(
        'should return false when given %s',
        (_, value) => {
            // eslint-disable-next-line jest/no-standalone-expect
            expect(isAsyncIterable(value)).toBeFalse();
        },
    );

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const function1 = Object.assign(() => {}, {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        [Symbol.asyncIterator]() {},
    });

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const function2 = Object.assign(() => {}, {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        async [Symbol.asyncIterator]() {},
    });

    // prettier-ignore
    const trueValuesWithAsyncIteratorKey = [
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        [`an object with a Symbol.asyncIterator method`, { foo: 'bar', [Symbol.asyncIterator]() {} }],
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        [`an object with an async Symbol.asyncIterator method`, { async [Symbol.asyncIterator]() {} }],
        [`a function with a Symbol.asyncIterator method`, function1],
        [`a function with an async Symbol.asyncIterator method`, function2],
    ];

    const _Symbol = Symbol;

    afterEach(() => {
        global.Symbol = _Symbol;
    });

    each([
        ...falseValuesWithAsyncIteratorKey,
        ...trueValuesWithAsyncIteratorKey,
    ]).it(
        'should return false if Symbol does not exist when given %s',
        (_, value) => {
            delete global.Symbol;
            // eslint-disable-next-line jest/no-standalone-expect
            expect(isAsyncIterable(value)).toBeFalse();
        },
    );

    each([
        ...falseValuesWithAsyncIteratorKey,
        ...trueValuesWithAsyncIteratorKey,
    ]).it(
        'should return false if Symbol.asyncIterator does not exist when given %s',
        (_, value) => {
            global.Symbol = {} as typeof global.Symbol;
            // eslint-disable-next-line jest/no-standalone-expect
            expect(isAsyncIterable(value)).toBeFalse();
        },
    );

    each(trueValuesWithAsyncIteratorKey).it(
        'should return true when given %s',
        (_, value) => {
            // eslint-disable-next-line jest/no-standalone-expect
            expect(isAsyncIterable(value)).toBeTrue();
        },
    );
});

describe('isPromiseLike', () => {
    it('should exist', () => {
        expect(isPromiseLike).toBeFunction();
    });

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const falsePromiseFunction = Object.assign(() => {}, {
        then: 'foo',
    });

    const falseValues = [
        ...simpleFalseValues,
        ['a string', 'foo'],
        ['an object with a non-method "then" key', { foo: 'bar', then: 'baz' }],
        ['a function with a non-method "then" key', falsePromiseFunction],
    ];

    // eslint-disable-next-line jest/no-standalone-expect
    each(falseValues).it('should return false when given %s', (_, value) => {
        // eslint-disable-next-line jest/no-standalone-expect
        expect(isPromiseLike(value)).toBeFalse();
    });

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const promise1 = Object.assign(() => {}, {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        then() {},
    });

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const promise2 = Object.assign(() => {}, {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        async then() {},
    });

    const trueValues = [
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        [`an object with a "then" method`, { foo: 'bar', then() {} }],
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        [`an object with an async a "then" method`, { async then() {} }],
        [`a function with a "then" method`, promise1],
        [`a function with an async a "then" method`, promise2],
    ];

    each(trueValues).it('should return true when given %s', (_, value) => {
        // eslint-disable-next-line jest/no-standalone-expect
        expect(isPromiseLike(value)).toBeTrue();
    });
});

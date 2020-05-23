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
import cloneDeep = require('lodash.clonedeep');
import each from 'jest-each';

const composableFunction1 = (x: string): string => x + '+f1';
const composableFunction2 = (x: string): string => x + '+f2';
const composableFunction3 = (x: string): string => x + '+f3';
const composableFunction4 = (x: string): string => x + '+f4';
const composableFunction5 = (x: string): string => x + '+f5';
const composableFunction6 = (x: string): string => x + '+f6';
const composableFunction7 = (x: string): string => x + '+f7';
const composableFunction8 = (x: string): string => x + '+f8';
const composableFunction9 = (x: string): string => x + '+f9';
const composableFunction10 = (x: string): string => x + '+f10';
const composableFunction11 = (x: string): string => x + '+f11';

// prettier-ignore
const cases: [string, ...((x: string) => string)[]][] = [
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
    it('should exist', () => {
        expect(pipe).toBeFunction();
    });

    each(cases).it('should apply %# function(s) ltr', (expected, ...fns) => {
        // eslint-disable-next-line jest/no-standalone-expect
        expect((pipe as any)('XXX', ...fns)).toBe('XXX' + expected);
        // eslint-disable-next-line jest/no-standalone-expect
        expect((pipe as any)('YYY', ...fns)).toBe('YYY' + expected);
    });
});

describe('flow', () => {
    it('should exist', () => {
        expect(flow).toBeFunction();
    });

    each(cases).it('should ltr compose %# function(s)', (expected, ...fns) => {
        const composed = (flow as any)(...fns);
        // eslint-disable-next-line jest/no-standalone-expect
        expect(composed).toBeFunction();
        // eslint-disable-next-line jest/no-standalone-expect
        expect(composed('XXX')).toBe('XXX' + expected);
        // eslint-disable-next-line jest/no-standalone-expect
        expect(composed('YYY')).toBe('YYY' + expected);
    });
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
        function* iter(): Generator<any> {
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
    ]).it(`should do nothing when removing "${x}" from %s`, (input) => {
        const copy = cloneDeep(input);
        removeOnce(copy, x);
        // eslint-disable-next-line jest/no-standalone-expect
        expect(copy).toEqual(input);
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

jest.mock('raf', () => {
    let id = 61;
    const raf = jest.fn(() => id++);
    (raf as any).cancel = jest.fn();
    return raf;
});

import raf = require('raf');
const rafMock = (raf as any) as jest.Mock & { cancel: jest.Mock };

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
        const id = rafMock.mock.results[0].value;
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
        const id = (global.setTimeout as jest.Mock).mock.results[0].value;
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
            expect(global.clearInterval).toHaveBeenCalledTimes(0);
        }
    });

    it('should cancel the interval when the given disposable is disposed', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const callback = () => {};
        const disposable = new Disposable();
        const delay = 2983;
        setInterval(callback, delay, disposable);
        const id = (global.setInterval as jest.Mock).mock.results[0].value;
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
        const id = (global.setInterval as jest.Mock).mock.results[0].value;
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
        expect((global.setTimeout as jest.Mock).mock.calls[0][0]).toThrow(
            error,
        );
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
        global.Symbol = {} as any;
        expect(get$$asyncIterator()).toBeUndefined();
    });
});

const simpleFalseValues: any[] = [
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

    function getFalseValuesWithIteratorKey(key: any, keyDesc: any): any[] {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const falseIteratorKeyFunction: any = () => {};
        falseIteratorKeyFunction[key] = 'foo';

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

    each(
        simpleFalseValues.concat(
            falseValuesWithNativeIteratorKey,
            falseValuesWithCompatIteratorKey,
        ),
    ).it('should return false when given %s', (_, value) => {
        // eslint-disable-next-line jest/no-standalone-expect
        expect(isIterable(value)).toBeFalse();
    });

    const _Symbol = Symbol;

    afterEach(() => {
        global.Symbol = _Symbol;
    });

    each(simpleFalseValues.concat(falseValuesWithCompatIteratorKey)).it(
        'should return false if Symbol does not exist when given %s',
        (_, value) => {
            delete global.Symbol;
            // eslint-disable-next-line jest/no-standalone-expect
            expect(isIterable(value)).toBeFalse();
        },
    );

    function getTrueValuesWithIteratorKey(key: any, keyDesc: string): any[] {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const function1: any = () => {};
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        function1[key] = () => {};

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const function2: any = () => {};
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        function2[key] = async function () {};

        return [
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            [`an object with a ${keyDesc} method`, { foo: 'bar', [key]() {} }],
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            [`an object with an async ${keyDesc} method`, { async [key]() {} }],
            [`a function with a ${keyDesc} method`, function1],
            [`a function with an async ${keyDesc} method`, function2],
        ];
    }

    const trueValuesWithNativeIteratorKey = [['a string', 'foo']].concat(
        getTrueValuesWithIteratorKey(Symbol.iterator, 'Symbol.iterator'),
    );
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
    const falseAsyncIteratorFunction: any = () => {};
    falseAsyncIteratorFunction[Symbol.iterator] = 'foo';

    // prettier-ignore
    const falseValuesWithAsyncIteratorKey = simpleFalseValues.concat([
        ['a string', 'foo'],
        ['an object with a non-method Symbol.asyncIterator key', { foo: 'bar', [Symbol.asyncIterator]: 'baz' }],
        ['a function with a non-method Symbol.asyncIterator key', falseAsyncIteratorFunction],
    ]);

    each(falseValuesWithAsyncIteratorKey).it(
        'should return false when given %s',
        (_, value) => {
            // eslint-disable-next-line jest/no-standalone-expect
            expect(isAsyncIterable(value)).toBeFalse();
        },
    );

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const function1: any = () => {};
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    function1[Symbol.asyncIterator] = () => {};

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const function2: any = () => {};
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    function2[Symbol.asyncIterator] = async function () {};

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

    each(
        falseValuesWithAsyncIteratorKey.concat(trueValuesWithAsyncIteratorKey),
    ).it(
        'should return false if Symbol does not exist when given %s',
        (_, value) => {
            delete global.Symbol;
            // eslint-disable-next-line jest/no-standalone-expect
            expect(isAsyncIterable(value)).toBeFalse();
        },
    );

    each(
        falseValuesWithAsyncIteratorKey.concat(trueValuesWithAsyncIteratorKey),
    ).it(
        'should return false if Symbol.asyncIterator does not exist when given %s',
        (_, value) => {
            global.Symbol = {} as any;
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
    const falsePromiseFunction: any = () => {};
    falsePromiseFunction.then = 'foo';

    const falseValues = simpleFalseValues.concat([
        ['a string', 'foo'],
        ['an object with a non-method "then" key', { foo: 'bar', then: 'baz' }],
        ['a function with a non-method "then" key', falsePromiseFunction],
    ]);

    // eslint-disable-next-line jest/no-standalone-expect
    each(falseValues).it('should return false when given %s', (_, value) => {
        // eslint-disable-next-line jest/no-standalone-expect
        expect(isPromiseLike(value)).toBeFalse();
    });

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const promise1: any = () => {};
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    promise1.then = () => {};

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const promise2: any = () => {};
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    promise2.then = async function () {};

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

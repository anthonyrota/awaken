import { Disposable } from './disposable';
import isFunction = require('lodash.isfunction');
import raf = require('raf');

function _call<T>(x: T, f: (x: T) => T): T {
    return f(x);
}

/**
 * Calls the value accumulatively against all of the functions given
 * left-to-right. The result of calling a function with the accumulated value
 * will be given to the next function, and the result of the last function will
 * be returned. If there are no functions given, the given value will be
 * returned.
 * @returns The result of accumulatively calling the given value against all of
 *     the functions given left-to-right.
 */
export function pipe<T>(x: T): T;
/* eslint-disable max-len */
/** Calls the value accumulatively against all of the functions given left-to-right. The result of calling a function with the accumulated value will be given to the next function, and the result of the last function will be returned. If there are no functions given, the given value will be returned.
 * @returns The result of accumulatively calling the given value against all of the functions given left-to-right. */
export function pipe<T, R>(x: T, f1: (x: T) => R): R;
/** Calls the value accumulatively against all of the functions given left-to-right. The result of calling a function with the accumulated value will be given to the next function, and the result of the last function will be returned. If there are no functions given, the given value will be returned.
 * @returns The result of accumulatively calling the given value against all of the functions given left-to-right. */
export function pipe<T, A, R>(x: T, f1: (x: T) => A, f2: (x: A) => R): R;
/** Calls the value accumulatively against all of the functions given left-to-right. The result of calling a function with the accumulated value will be given to the next function, and the result of the last function will be returned. If there are no functions given, the given value will be returned.
 * @returns The result of accumulatively calling the given value against all of the functions given left-to-right. */
// prettier-ignore
export function pipe<T, A, B, R>(x: T, f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => R): R;
/** Calls the value accumulatively against all of the functions given left-to-right. The result of calling a function with the accumulated value will be given to the next function, and the result of the last function will be returned. If there are no functions given, the given value will be returned.
 * @returns The result of accumulatively calling the given value against all of the functions given left-to-right. */
// prettier-ignore
export function pipe<T, A, B, C, R>(x: T, f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => R): R;
/** Calls the value accumulatively against all of the functions given left-to-right. The result of calling a function with the accumulated value will be given to the next function, and the result of the last function will be returned. If there are no functions given, the given value will be returned.
 * @returns The result of accumulatively calling the given value against all of the functions given left-to-right. */
// prettier-ignore
export function pipe<T, A, B, C, D, R>(x: T, f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => R): R;
/** Calls the value accumulatively against all of the functions given left-to-right. The result of calling a function with the accumulated value will be given to the next function, and the result of the last function will be returned. If there are no functions given, the given value will be returned.
 * @returns The result of accumulatively calling the given value against all of the functions given left-to-right. */
// prettier-ignore
export function pipe<T, A, B, C, D, E, R>(x: T, f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => E, f6: (x: E) => R): R;
/** Calls the value accumulatively against all of the functions given left-to-right. The result of calling a function with the accumulated value will be given to the next function, and the result of the last function will be returned. If there are no functions given, the given value will be returned.
 * @returns The result of accumulatively calling the given value against all of the functions given left-to-right. */
// prettier-ignore
export function pipe<T, A, B, C, D, E, F, R>(x: T, f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => E, f6: (x: E) => F, f7: (x: F) => R): R;
/** Calls the value accumulatively against all of the functions given left-to-right. The result of calling a function with the accumulated value will be given to the next function, and the result of the last function will be returned. If there are no functions given, the given value will be returned.
 * @returns The result of accumulatively calling the given value against all of the functions given left-to-right. */
// prettier-ignore
export function pipe<T, A, B, C, D, E, F, G, R>(x: T, f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => E, f6: (x: E) => F, f7: (x: F) => G, f8: (x: G) => R): R;
/** Calls the value accumulatively against all of the functions given left-to-right. The result of calling a function with the accumulated value will be given to the next function, and the result of the last function will be returned. If there are no functions given, the given value will be returned.
 * @returns The result of accumulatively calling the given value against all of the functions given left-to-right. */
// prettier-ignore
export function pipe<T, A, B, C, D, E, F, G, H, R>(x: T, f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => E, f6: (x: E) => F, f7: (x: F) => G, f8: (x: G) => H, f9: (x: H) => R): R;
/** Calls the value accumulatively against all of the functions given left-to-right. The result of calling a function with the accumulated value will be given to the next function, and the result of the last function will be returned. If there are no functions given, the given value will be returned.
 * @returns The result of accumulatively calling the given value against all of the functions given left-to-right. */
// prettier-ignore
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function pipe<T, A, B, C, D, E, F, G, H, R>(x: T, f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => E, f6: (x: E) => F, f7: (x: F) => G, f8: (x: G) => H, f9: (x: H) => R, ...funcs: Array<(x: any) => any>): R;
/** Calls the value accumulatively against all of the functions given left-to-right. The result of calling a function with the accumulated value will be given to the next function, and the result of the last function will be returned. If there are no functions given, the given value will be returned.
 * @returns The result of accumulatively calling the given value against all of the functions given left-to-right. */
/* eslint-enable max-len */
export function pipe<T>(x: T, ...fns: ((x: T) => T)[]): T;
export function pipe<T>(x: T, ...fns: ((x: T) => T)[]): T {
    return fns.reduce(_call, x);
}

/**
 * Combines all of the functions given into a single function. This function
 * takes a value and will accumulatively call it against all of the given
 * functions left-to-right. The result of calling a function with the
 * accumulated value will be given to the next function, and the result of the
 * last function will be returned. If there are no functions given, then the
 * combined function will return the value passed to it.
 * @returns A function which takes a value and will return the result of
 *     accumulatively calling the value against all of the functions given
 *     left-to-right.
 */
export function flow(): <T>(x: T) => T;
/* eslint-disable max-len */
/** Combines all of the functions given into a single function. This function takes a value and will accumulatively call it against all of the given functions left-to-right. The result of calling a function with the accumulated value will be given to the next function, and the result of the last function will be returned. If there are no functions given, then the combined function will return the value passed to it.
 * @returns A function which takes a value and will return the result of accumulatively calling the value against all of the functions given left-to-right. */
export function flow<T, R>(f1: (x: T) => R): (x: T) => R;
/** Combines all of the functions given into a single function. This function takes a value and will accumulatively call it against all of the given functions left-to-right. The result of calling a function with the accumulated value will be given to the next function, and the result of the last function will be returned. If there are no functions given, then the combined function will return the value passed to it.
 * @returns A function which takes a value and will return the result of accumulatively calling the value against all of the functions given left-to-right. */
export function flow<T, A, R>(f1: (x: T) => A, f2: (x: A) => R): (x: T) => R;
// prettier-ignore
/** Combines all of the functions given into a single function. This function takes a value and will accumulatively call it against all of the given functions left-to-right. The result of calling a function with the accumulated value will be given to the next function, and the result of the last function will be returned. If there are no functions given, then the combined function will return the value passed to it.
 * @returns A function which takes a value and will return the result of accumulatively calling the value against all of the functions given left-to-right. */
export function flow<T, A, B, R>(f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => R): (x: T) => R;
// prettier-ignore
/** Combines all of the functions given into a single function. This function takes a value and will accumulatively call it against all of the given functions left-to-right. The result of calling a function with the accumulated value will be given to the next function, and the result of the last function will be returned. If there are no functions given, then the combined function will return the value passed to it.
 * @returns A function which takes a value and will return the result of accumulatively calling the value against all of the functions given left-to-right. */
export function flow<T, A, B, C, R>(f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => R): (x: T) => R;
// prettier-ignore
/** Combines all of the functions given into a single function. This function takes a value and will accumulatively call it against all of the given functions left-to-right. The result of calling a function with the accumulated value will be given to the next function, and the result of the last function will be returned. If there are no functions given, then the combined function will return the value passed to it.
 * @returns A function which takes a value and will return the result of accumulatively calling the value against all of the functions given left-to-right. */
export function flow<T, A, B, C, D, R>(f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => R): (x: T) => R;
// prettier-ignore
/** Combines all of the functions given into a single function. This function takes a value and will accumulatively call it against all of the given functions left-to-right. The result of calling a function with the accumulated value will be given to the next function, and the result of the last function will be returned. If there are no functions given, then the combined function will return the value passed to it.
 * @returns A function which takes a value and will return the result of accumulatively calling the value against all of the functions given left-to-right. */
export function flow<T, A, B, C, D, E, R>(f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => E, f6: (x: E) => R): (x: T) => R;
// prettier-ignore
/** Combines all of the functions given into a single function. This function takes a value and will accumulatively call it against all of the given functions left-to-right. The result of calling a function with the accumulated value will be given to the next function, and the result of the last function will be returned. If there are no functions given, then the combined function will return the value passed to it.
 * @returns A function which takes a value and will return the result of accumulatively calling the value against all of the functions given left-to-right. */
export function flow<T, A, B, C, D, E, F, R>(f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => E, f6: (x: E) => F, f7: (x: F) => R): (x: T) => R;
// prettier-ignore
/** Combines all of the functions given into a single function. This function takes a value and will accumulatively call it against all of the given functions left-to-right. The result of calling a function with the accumulated value will be given to the next function, and the result of the last function will be returned. If there are no functions given, then the combined function will return the value passed to it.
 * @returns A function which takes a value and will return the result of accumulatively calling the value against all of the functions given left-to-right. */
export function flow<T, A, B, C, D, E, F, G, R>(f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => E, f6: (x: E) => F, f7: (x: F) => G, f8: (x: G) => R): (x: T) => R;
// prettier-ignore
/** Combines all of the functions given into a single function. This function takes a value and will accumulatively call it against all of the given functions left-to-right. The result of calling a function with the accumulated value will be given to the next function, and the result of the last function will be returned. If there are no functions given, then the combined function will return the value passed to it.
 * @returns A function which takes a value and will return the result of accumulatively calling the value against all of the functions given left-to-right. */
export function flow<T, A, B, C, D, E, F, G, H, R>(f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => E, f6: (x: E) => F, f7: (x: F) => G, f8: (x: G) => H, f9: (x: H) => R): (x: T) => R;
// prettier-ignore
/** Combines all of the functions given into a single function. This function takes a value and will accumulatively call it against all of the given functions left-to-right. The result of calling a function with the accumulated value will be given to the next function, and the result of the last function will be returned. If there are no functions given, then the combined function will return the value passed to it.
 * @returns A function which takes a value and will return the result of accumulatively calling the value against all of the functions given left-to-right. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function flow<T, A, B, C, D, E, F, G, H, R>(f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => E, f6: (x: E) => F, f7: (x: F) => G, f8: (x: G) => H, f9: (x: H) => R, ...funcs: Array<(x: any) => any>): (x: T) => R;
/** Combines all of the functions given into a single function. This function takes a value and will accumulatively call it against all of the given functions left-to-right. The result of calling a function with the accumulated value will be given to the next function, and the result of the last function will be returned. If there are no functions given, then the combined function will return the value passed to it.
 * @returns A function which takes a value and will return the result of accumulatively calling the value against all of the functions given left-to-right. */
/* eslint-enable max-len */
export function flow<T>(...fns: Array<(x: T) => T>): (x: T) => T;
export function flow<T>(...fns: Array<(x: T) => T>): (x: T) => T {
    return (x: T): T => fns.reduce(_call, x);
}

/**
 * Converts the given value into an array.
 * @param items The values to convert into an array.
 * @returns The converted array.
 */
export function toArray<T>(items: Iterable<T> | ArrayLike<T> | T[]): T[] {
    if (Array.isArray(items)) {
        return items;
    }

    if (isIterable(items)) {
        return [...items];
    }

    return Array.prototype.slice.call<ArrayLike<T>, [], T[]>(items);
}

/**
 * Removes the first instance of the value from the array.
 * @param array The array to remove the value from.
 * @param item The value to remove from the array.
 */
export function removeOnce<T>(array: ArrayLike<T>, item: T): void {
    const index = Array.prototype.indexOf.call(array, item);
    if (index !== -1) {
        Array.prototype.splice.call(array, index, 1);
    }
}

/**
 * Returns the last item from the given array, or `undefined` if the array has
 * no items.
 * @param array The array to get the last item from.
 * @returns The last item from the given array, or `undefined` if the array has
 *     no items.
 */
export function getLast<T>(array: ArrayLike<T>): T | undefined {
    return array.length > 0 ? array[array.length - 1] : undefined;
}

/**
 * Disposable-based alternative to built-in `requestAnimationFrame`.
 * @param callback The callback to schedule.
 * @param subscription If this is disposed then the request will be cancelled.
 */
export function requestAnimationFrame(
    callback: FrameRequestCallback,
    subscription?: Disposable,
): void {
    if (subscription?.active === false) {
        return;
    }

    const animationId = raf(callback);

    subscription?.add(() => {
        raf.cancel(animationId);
    });
}

/**
 * Disposable-based alternative to built-in `setTimeout`.
 * @param callback The callback to schedule.
 * @param delayMs The amount of delay.
 * @param subscription If this is disposed then the request will be cancelled.
 * @param args The arguments to send to the callback.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setTimeoutImplementation<T extends any[]>(
    callback: (...args: T) => void,
    delayMs = 0,
    subscription?: Disposable,
    ...args: T
): void {
    if (subscription?.active === false) {
        return;
    }

    const id = setTimeout(callback, delayMs, ...args);

    subscription?.add(() => {
        clearTimeout(id);
    });
}

export { setTimeoutImplementation as setTimeout };

/**
 * Disposable-based alternative to built-in `setInterval`.
 * @param callback The callback to schedule.
 * @param delayMs The amount of delay.
 * @param subscription If this is disposed then the request will be cancelled.
 * @param args The arguments to send to the callback.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setIntervalImplementation<T extends any[]>(
    callback: (...args: T) => void,
    delayMs = 0,
    subscription?: Disposable,
    ...args: T
): void {
    if (subscription?.active === false) {
        return;
    }

    const id = setInterval(callback, delayMs, ...args);

    subscription?.add(() => {
        clearInterval(id);
    });
}

export { setIntervalImplementation as setInterval };

/**
 * Reports the given error asynchronously.
 * @param error The error to report.
 */
export function asyncReportError(error: unknown): void {
    setTimeout(() => {
        throw error;
    });
}

/**
 * Returns the most suitable iterator symbol.
 * @returns Symbol.iterator if it exists, else a string substitute.
 */
export function get$$iterator(): symbol | '@@iterator' {
    if (
        typeof Symbol !== 'undefined' &&
        isFunction(Symbol) &&
        Symbol.iterator
    ) {
        return Symbol.iterator;
    }

    return '@@iterator';
}

/**
 * Returns `Symbol.asyncIterator` if it is defined.
 * @returns Symbol.asyncIterator if it exists, else undefined.
 */
export function get$$asyncIterator(): symbol | void {
    if (
        typeof Symbol !== 'undefined' &&
        isFunction(Symbol) &&
        Symbol.asyncIterator
    ) {
        return Symbol.asyncIterator;
    }
}

/**
 * Checks whether the given value is iterable.
 * @returns Whether the given value is an iterable.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function isIterable(value: unknown): value is Iterable<unknown> {
    return (
        value != null &&
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        isFunction((value as any)[get$$iterator()])
    );
}

/**
 * Checks whether the given value is an AsyncIterable.
 * @returns Whether the given value is an AsyncIterable.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function isAsyncIterable(
    value: unknown,
): value is AsyncIterable<unknown> {
    const $$asyncIterator = get$$asyncIterator();

    return (
        !!$$asyncIterator &&
        value != null &&
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        isFunction((value as any)[$$asyncIterator])
    );
}

/**
 * Checks whether the given value is PromiseLike, meaning it has a `then`
 * function defined.
 * @returns Whether the given value is PromiseLike.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    return !!value && isFunction((value as PromiseLike<unknown>).then);
}

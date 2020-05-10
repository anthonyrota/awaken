import { Disposable } from './disposable';
import isArray = require('lodash.isarray');
import isFunction = require('lodash.isfunction');
import raf = require('raf');

/**
 * Utility function used in `pipe` and `flow`.
 * @param x The value to be called with.
 * @param f The function to call.
 * @returns The result of calling `f(x)`.
 */
function _call(x: any, f: any): any {
    return f(x);
}

/* eslint-disable max-len */
/**
 * Acts as the identity function when no functions are given; returns the given
 * value.
 * @example
 * ```ts
 * pipe(x); // -> x
 * ```
 * @param x The value
 */
export function pipe<T>(x: T): T;
/**
 * Calls the unary function `f1` against the value given.
 * @example
 * ```ts
 * pipe(x, f); // -> f(x)
 * ```
 * @param x The value to be called with.
 * @param f1 The unary function to be called.
 * @returns The result of calling the the function against the value given.
 */
export function pipe<T, R>(x: T, f1: (x: T) => R): R;
/**
 * Calls the left-to-right composition of unary functions `f1` and `f2` against
 * the value given.
 * @example
 * ```ts
 * pipe(x, f, g); // -> g(f(x))
 * ```
 * @param x The value to be called with.
 * @param f1 The first unary function to be called.
 * @param f2 The second unary function to be called.
 * @returns The result of calling the left-to-right composition of all the
 *     functions against the value given.
 */
export function pipe<T, A, R>(x: T, f1: (x: T) => A, f2: (x: A) => R): R;
/**
 * Calls the left-to-right composition of unary functions `f1`, `f2` and `f3`
 * against the value given.
 * @example
 * ```ts
 * pipe(x, f, g, h); // -> h(g(f(x)))
 * ```
 * @param x The value to be called with.
 * @param f1 The first unary function to be called.
 * @param f2 The second unary function to be called.
 * @param f3 The third unary function to be called.
 * @returns The result of calling the left-to-right composition of all the
 *     functions against the value given.
 */
// prettier-ignore
export function pipe<T, A, B, R>(x: T, f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => R): R;
/**
 * Calls the left-to-right composition of unary functions `f1`, `f2`, `f3` and
 * `f4` against the value given.
 * @example
 * ```ts
 * pipe(x, f_1, f_2, f_3, f_4); // -> f_4(f_3(f_2(f_1(x))))
 * ```
 * @param x The value to be called with.
 * @param f1 The first unary function to be called.
 * @param f2 The second unary function to be called.
 * @param f3 The third unary function to be called.
 * @param f4 The fourth unary function to be called.
 * @returns The result of calling the left-to-right composition of all the
 *     functions against the value given.
 */
// prettier-ignore
export function pipe<T, A, B, C, R>(x: T, f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => R): R;
/**
 * Calls the left-to-right composition of unary functions `f1`, `f2`, `f3`, `f4`
 * and `f5` against the value given.
 * @example
 * ```ts
 * pipe(x, f_1, f_2, f_3, f_4, f_5); // -> f_5(f_4(f_3(f_2(f_1(x)))))
 * ```
 * @param x The value to be called with.
 * @param f1 The first unary function to be called.
 * @param f2 The second unary function to be called.
 * @param f3 The third unary function to be called.
 * @param f4 The fourth unary function to be called.
 * @param f5 The fifth unary function to be called.
 * @returns The result of calling the left-to-right composition of all the
 *     functions against the value given.
 */
// prettier-ignore
export function pipe<T, A, B, C, D, R>(x: T, f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => R): R;
/**
 * Calls the left-to-right composition of unary functions `f1`, `f2`, `f3`,
 * `f4`, `f5` and `f6` against the value given.
 * @example
 * ```ts
 * pipe(x, f_1, f_2, f_3, f_4, f_5, f_6); // -> f_6(f_5(f_4(f_3(f_2(f_1(x))))))
 * ```
 * @param x The value to be called with.
 * @param f1 The first unary function to be called.
 * @param f2 The second unary function to be called.
 * @param f3 The third unary function to be called.
 * @param f4 The fourth unary function to be called.
 * @param f5 The fifth unary function to be called.
 * @param f6 The sixth unary function to be called.
 * @returns The result of calling the left-to-right composition of all the
 *     functions against the value given.
 */
// prettier-ignore
export function pipe<T, A, B, C, D, E, R>(x: T, f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => E, f6: (x: E) => R): R;
/**
 * Calls the left-to-right composition of unary functions `f1`, `f2`, `f3`,
 * `f4`, `f5`, `f6` and `f7` against the value given.
 * @example
 * ```ts
 * pipe(x, f_1, f_2, f_3, f_4, f_5, f_6, f_7);
 * // -> f_7(f_6(f_5(f_4(f_3(f_2(f_1(x)))))))
 * ```
 * @param x The value to be called with.
 * @param f1 The first unary function to be called.
 * @param f2 The second unary function to be called.
 * @param f3 The third unary function to be called.
 * @param f4 The fourth unary function to be called.
 * @param f5 The fifth unary function to be called.
 * @param f6 The sixth unary function to be called.
 * @param f7 The seventh unary function to be called.
 * @returns The result of calling the left-to-right composition of all the
 *     functions against the value given.
 */
// prettier-ignore
export function pipe<T, A, B, C, D, E, F, R>(x: T, f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => E, f6: (x: E) => F, f7: (x: F) => R): R;
/**
 * Calls the left-to-right composition of unary functions `f1`, `f2`, `f3`,
 * `f4`, `f5`, `f6`, `f7` and `f8` against the value given.
 * @example
 * ```ts
 * pipe(x, f_1, f_2, f_3, f_4, f_5, f_6, f_7, f_8);
 * // -> f_8(f_7(f_6(f_5(f_4(f_3(f_2(f_1(x))))))))
 * ```
 * @param x The value to be called with.
 * @param f1 The first unary function to be called.
 * @param f2 The second unary function to be called.
 * @param f3 The third unary function to be called.
 * @param f4 The fourth unary function to be called.
 * @param f5 The fifth unary function to be called.
 * @param f6 The sixth unary function to be called.
 * @param f7 The seventh unary function to be called.
 * @param f8 The eighth unary function to be called.
 * @returns The result of calling the left-to-right composition of all the
 *     functions against the value given.
 */
// prettier-ignore
export function pipe<T, A, B, C, D, E, F, G, R>(x: T, f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => E, f6: (x: E) => F, f7: (x: F) => G, f8: (x: G) => R): R;
/**
 * Calls the left-to-right composition of unary functions `f1`, `f2`, `f3`,
 * `f4`, `f5`, `f6`, `f7`, `f8` and `f9` against the value given.
 * @example
 * ```ts
 * pipe(x, f_1, f_2, f_3, f_4, f_5, f_6, f_7, f_8, f_9);
 * // -> f_9(f_8(f_7(f_6(f_5(f_4(f_3(f_2(f_1(x)))))))))
 * ```
 * @param x The value to be called with.
 * @param f1 The first unary function to be called.
 * @param f2 The second unary function to be called.
 * @param f3 The third unary function to be called.
 * @param f4 The fourth unary function to be called.
 * @param f5 The fifth unary function to be called.
 * @param f6 The sixth unary function to be called.
 * @param f7 The seventh unary function to be called.
 * @param f8 The eighth unary function to be called.
 * @param f9 The ninth unary function to be called.
 * @returns The result of calling the left-to-right composition of all the
 *     functions against the value given.
 */
// prettier-ignore
export function pipe<T, A, B, C, D, E, F, G, H, R>(x: T, f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => E, f6: (x: E) => F, f7: (x: F) => G, f8: (x: G) => H, f9: (x: H) => R): R;
/**
 * Calls the left-to-right composition of unary functions `f1`, `f2`, `f3`,
 * `f4`, `f5`, `f6`, `f7`, `f8`, `f9` and `...funcs` against the value given.
 * @example
 * ```ts
 * pipe(x, f_1, f_2, f_3, f_4, f_5, f_6, f_7, f_8, f_9, ...funcs);
 * // -> (left-to-right composition of ...funcs)(
 * //      f_9(f_8(f_7(f_6(f_5(f_4(f_3(f_2(f_1(x)))))))))
 * //    )
 * ```
 * @param x The value to be called with.
 * @param f1 The first unary function to be called.
 * @param f2 The second unary function to be called.
 * @param f3 The third unary function to be called.
 * @param f4 The fourth unary function to be called.
 * @param f5 The fifth unary function to be called.
 * @param f6 The sixth unary function to be called.
 * @param f7 The seventh unary function to be called.
 * @param f8 The eighth unary function to be called.
 * @param f9 The ninth unary function to be called.
 * @param funcs The remaining unary functions to be called.
 * @returns The result of calling the left-to-right composition of all the
 *     functions against the value given.
 */
// prettier-ignore
export function pipe<T, A, B, C, D, E, F, G, H, R>(x: T, f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => E, f6: (x: E) => F, f7: (x: F) => G, f8: (x: G) => H, f9: (x: H) => R, ...funcs: Array<(x: any) => any>): R;
/* eslint-enable max-len */
export function pipe(x: any, ...funcs: Array<(x: any) => any>): any {
    return funcs.reduce<any>(_call, x);
}

/* eslint-disable max-len */
export function flow(): <T>(x: T) => T;
/**
 * Returns the given function `f1`.
 * @example
 * ```ts
 * flow(f); // -> f
 * ```
 * @param f1 The unary function.
 * @returns The given function.
 */
export function flow<T, R>(f1: (x: T) => R): (x: T) => R;
/**
 * Composes left-to-right unary functions `f1` and `f2` against
 * the value given.
 * @example
 * ```ts
 * flow(f, g); // -> x => g(f(x))
 * ```
 * @param f1 The first unary function.
 * @param f2 The second unary function.
 * @returns The left-to-right composition of all the functions.
 */
export function flow<T, A, R>(f1: (x: T) => A, f2: (x: A) => R): (x: T) => R;
/**
 * Composes left-to-right unary functions `f1`, `f2` and `f3`
 *.
 * @example
 * ```ts
 * flow(f, g, h); // -> x => h(g(f(x)))
 * ```
 * @param f1 The first unary function.
 * @param f2 The second unary function.
 * @param f3 The third unary function.
 * @returns The left-to-right composition of all the functions.
 */
// prettier-ignore
export function flow<T, A, B, R>(f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => R): (x: T) => R;
/**
 * Composes left-to-right unary functions `f1`, `f2`, `f3` and
 * `f4`.
 * @example
 * ```ts
 * flow(f_1, f_2, f_3, f_4); // -> x => f_4(f_3(f_2(f_1(x))))
 * ```
 * @param f1 The first unary function.
 * @param f2 The second unary function.
 * @param f3 The third unary function.
 * @param f4 The fourth unary function.
 * @returns The left-to-right composition of all the functions.
 */
// prettier-ignore
export function flow<T, A, B, C, R>(f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => R): (x: T) => R;
/**
 * Composes left-to-right unary functions `f1`, `f2`, `f3`, `f4`
 * and `f5`.
 * @example
 * ```ts
 * flow(f_1, f_2, f_3, f_4, f_5); // -> x => f_5(f_4(f_3(f_2(f_1(x)))))
 * ```
 * @param f1 The first unary function.
 * @param f2 The second unary function.
 * @param f3 The third unary function.
 * @param f4 The fourth unary function.
 * @param f5 The fifth unary function.
 * @returns The left-to-right composition of all the functions.
 */
// prettier-ignore
export function flow<T, A, B, C, D, R>(f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => R): (x: T) => R;
/**
 * Composes left-to-right unary functions `f1`, `f2`, `f3`,
 * `f4`, `f5` and `f6`.
 * @example
 * ```ts
 * flow(f_1, f_2, f_3, f_4, f_5, f_6); // -> x => f_6(f_5(f_4(f_3(f_2(f_1(x))))))
 * ```
 * @param f1 The first unary function.
 * @param f2 The second unary function.
 * @param f3 The third unary function.
 * @param f4 The fourth unary function.
 * @param f5 The fifth unary function.
 * @param f6 The sixth unary function.
 * @returns The left-to-right composition of all the functions.
 */
// prettier-ignore
export function flow<T, A, B, C, D, E, R>(f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => E, f6: (x: E) => R): (x: T) => R;
/**
 * Composes left-to-right unary functions `f1`, `f2`, `f3`,
 * `f4`, `f5`, `f6` and `f7`.
 * @example
 * ```ts
 * flow(f_1, f_2, f_3, f_4, f_5, f_6, f_7);
 * // -> x => f_7(f_6(f_5(f_4(f_3(f_2(f_1(x)))))))
 * ```
 * @param f1 The first unary function.
 * @param f2 The second unary function.
 * @param f3 The third unary function.
 * @param f4 The fourth unary function.
 * @param f5 The fifth unary function.
 * @param f6 The sixth unary function.
 * @param f7 The seventh unary function.
 * @returns The left-to-right composition of all the functions.
 */
// prettier-ignore
export function flow<T, A, B, C, D, E, F, R>(f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => E, f6: (x: E) => F, f7: (x: F) => R): (x: T) => R;
/**
 * Composes left-to-right unary functions `f1`, `f2`, `f3`,
 * `f4`, `f5`, `f6`, `f7` and `f8`.
 * @example
 * ```ts
 * flow(f_1, f_2, f_3, f_4, f_5, f_6, f_7, f_8);
 * // -> x => f_8(f_7(f_6(f_5(f_4(f_3(f_2(f_1(x))))))))
 * ```
 * @param f1 The first unary function.
 * @param f2 The second unary function.
 * @param f3 The third unary function.
 * @param f4 The fourth unary function.
 * @param f5 The fifth unary function.
 * @param f6 The sixth unary function.
 * @param f7 The seventh unary function.
 * @param f8 The eighth unary function.
 * @returns The left-to-right composition of all the functions.
 */
// prettier-ignore
export function flow<T, A, B, C, D, E, F, G, R>(f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => E, f6: (x: E) => F, f7: (x: F) => G, f8: (x: G) => R): (x: T) => R;
/**
 * Composes left-to-right unary functions `f1`, `f2`, `f3`,
 * `f4`, `f5`, `f6`, `f7`, `f8` and `f9`.
 * @example
 * ```ts
 * flow(f_1, f_2, f_3, f_4, f_5, f_6, f_7, f_8, f_9);
 * // -> x => f_9(f_8(f_7(f_6(f_5(f_4(f_3(f_2(f_1(x)))))))))
 * ```
 * @param f1 The first unary function.
 * @param f2 The second unary function.
 * @param f3 The third unary function.
 * @param f4 The fourth unary function.
 * @param f5 The fifth unary function.
 * @param f6 The sixth unary function.
 * @param f7 The seventh unary function.
 * @param f8 The eighth unary function.
 * @param f9 The ninth unary function.
 * @returns The left-to-right composition of all the functions.
 */
// prettier-ignore
export function flow<T, A, B, C, D, E, F, G, H, R>(f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => E, f6: (x: E) => F, f7: (x: F) => G, f8: (x: G) => H, f9: (x: H) => R): (x: T) => R;
/**
 * Composes left-to-right unary functions `f1`, `f2`, `f3`,
 * `f4`, `f5`, `f6`, `f7`, `f8`, `f9` and `...funcs`.
 * @example
 * ```ts
 * flow(f_1, f_2, f_3, f_4, f_5, f_6, f_7, f_8, f_9, ...funcs);
 * // -> x => (left-to-right composition of ...funcs)(
 * //      f_9(f_8(f_7(f_6(f_5(f_4(f_3(f_2(f_1(x)))))))))
 * //    )
 * ```
 * @param f1 The first unary function.
 * @param f2 The second unary function.
 * @param f3 The third unary function.
 * @param f4 The fourth unary function.
 * @param f5 The fifth unary function.
 * @param f6 The sixth unary function.
 * @param f7 The seventh unary function.
 * @param f8 The eighth unary function.
 * @param f9 The ninth unary function.
 * @param funcs The remaining unary functions.
 * @returns The left-to-right composition of all the functions.
 */
// prettier-ignore
export function flow<T, A, B, C, D, E, F, G, H, R>(f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => E, f6: (x: E) => F, f7: (x: F) => G, f8: (x: G) => H, f9: (x: H) => R, ...funcs: Array<(x: any) => any>): (x: T) => R;
/* eslint-enable max-len */
export function flow(...funcs: Array<(x: any) => any>): (x: any) => any {
    return (x: any): any => funcs.reduce(_call, x);
}

/**
 * Converts the given value into an `Array`. If the value is already an array,
 * it will simply be returned. If the value is an `Iterable`, an array
 * containing all the iterable's items will be returned. If the value is an
 * `ArrayLike` object, then the array form of that object will be returned.
 * @param items The items to be converted into an array.
 * @returns The converted array.
 */
export function toArray<T>(items: Iterable<T> | ArrayLike<T>): T[] {
    if (isArray(items)) {
        return items;
    }

    if (isIterable(items)) {
        return [...items];
    }

    return Array.prototype.slice.call(items);
}

/**
 * Removes the first appearance of the item from the array.
 * @param array The array to remove from.
 * @param item The item to remove from the array.
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
 * @param array The array.
 * @returns The last element of the array.
 */
export function getLast<T>(array: ArrayLike<T>): T | undefined {
    return array.length > 0 ? array[array.length - 1] : undefined;
}

/**
 * Disposable-based alternative to built-in `requestAnimationFrame`.
 * @param callback The callback to be scheduled.
 * @param subscription Disposable for this unit to attatch to. If this is
 *     disposed then so will this unit of work.
 */
export function requestAnimationFrame(
    callback: FrameRequestCallback,
    subscription?: Disposable,
): void {
    if (subscription && !subscription.active) {
        return;
    }

    const animationId = raf(callback);

    subscription?.add(() => raf.cancel(animationId));
}

/**
 * Disposable-based alternative to built-in `queueMicrotask`.
 * @param callback The callback to be scheduled.
 * @param subscription Disposable for this unit to attatch to. If this is
 *     disposed then so will this unit of work.
 */
function queueMicrotaskImplementation(
    callback: () => void,
    subscription?: Disposable,
) {
    if (subscription && !subscription.active) {
        return;
    }

    if (typeof queueMicrotask !== 'undefined' && isFunction(queueMicrotask)) {
        queueMicrotask(() => {
            if (subscription && !subscription.active) {
                return;
            }

            callback();
        });
        return;
    }

    if (typeof Promise !== 'undefined') {
        Promise.resolve()
            .then(() => {
                if (subscription && !subscription.active) {
                    return;
                }

                callback();
            })
            .then(null, asyncReportError);
        return;
    }

    setTimeoutImplementation(callback, 0, subscription);
}

export { queueMicrotaskImplementation as queueMicrotask };

/**
 * Disposable-based alternative to built-in `setTimeout`.
 * @param callback The callback to be scheduled.
 * @param delayMs The delay until `callback` is called.
 * @param subscription Disposable for this unit to attatch to. If this is
 *     disposed then so will this unit of work.
 * @param args The arguments to pass to `callback`.
 */
function setTimeoutImplementation<T extends any[]>(
    callback: (...args: T) => void,
    delayMs = 0,
    subscription?: Disposable,
    ...args: T
): void {
    if (subscription && !subscription.active) {
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
 * @param callback The callback to be scheduled.
 * @param delayMs The delay in milliseconds between each call of `callback`.
 * @param subscription Disposable for this unit to attatch to. If this is
 *     disposed then so will this unit of work.
 * @param args The arguments to pass to `callback`.
 */
function setIntervalImplementation<T extends any[]>(
    callback: (...args: T) => void,
    delayMs = 0,
    subscription?: Disposable,
    ...args: T
): void {
    if (subscription && !subscription.active) {
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
 * @returns The iterator symbol. If it does not exist, returns `"@@iterator"`.
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
 * Checks if `Symbol.asyncIterator` is defined and if so returns it.
 * @returns The asyncIterator symbol. If it does not exist, returns nothing.
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
 * Checks whether the given value is a Iterable, meaning it has a
 * `Symbol.iterable` implementation defined.
 * @param value The value to check.
 * @returns Whether the value is a Iterable.
 */
export function isIterable(value: any): value is Iterable<unknown> {
    return (
        value !== undefined &&
        value != null &&
        isFunction(value[get$$iterator()])
    );
}

/**
 * Checks whether the given value is an AsyncIterable, meaning it has a
 * `Symbol.asyncIterator` implementation defined.
 * @param value The value to check.
 * @returns Whether the value is an AsyncIterable.
 */
export function isAsyncIterable(value: any): value is AsyncIterable<unknown> {
    const $$asyncIterator = get$$asyncIterator();

    return (
        !!$$asyncIterator &&
        value !== undefined &&
        value != null &&
        isFunction(value[$$asyncIterator])
    );
}

/**
 * Checks whether the given value is PromiseLike, meaning it has a `then`
 * function defined.
 * @param value The value to check.
 * @returns Whether the value is PromiseLike.
 */
export function isPromiseLike(value: any): value is PromiseLike<unknown> {
    return !!value && isFunction(value.then);
}

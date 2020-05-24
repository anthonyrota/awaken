import { Disposable } from './disposable';
import isFunction = require('lodash.isfunction');
import raf = require('raf');

function _call<T>(x: T, f: (x: T) => T): T {
    return f(x);
}

export function pipe<T>(x: T): T;
export function pipe<T, R>(x: T, f1: (x: T) => R): R;
export function pipe<T, A, R>(x: T, f1: (x: T) => A, f2: (x: A) => R): R;
/* eslint-disable max-len */
// prettier-ignore
export function pipe<T, A, B, R>(x: T, f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => R): R;
// prettier-ignore
export function pipe<T, A, B, C, R>(x: T, f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => R): R;
// prettier-ignore
export function pipe<T, A, B, C, D, R>(x: T, f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => R): R;
// prettier-ignore
export function pipe<T, A, B, C, D, E, R>(x: T, f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => E, f6: (x: E) => R): R;
// prettier-ignore
export function pipe<T, A, B, C, D, E, F, R>(x: T, f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => E, f6: (x: E) => F, f7: (x: F) => R): R;
// prettier-ignore
export function pipe<T, A, B, C, D, E, F, G, R>(x: T, f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => E, f6: (x: E) => F, f7: (x: F) => G, f8: (x: G) => R): R;
// prettier-ignore
export function pipe<T, A, B, C, D, E, F, G, H, R>(x: T, f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => E, f6: (x: E) => F, f7: (x: F) => G, f8: (x: G) => H, f9: (x: H) => R): R;
// prettier-ignore
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function pipe<T, A, B, C, D, E, F, G, H, R>(x: T, f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => E, f6: (x: E) => F, f7: (x: F) => G, f8: (x: G) => H, f9: (x: H) => R, ...funcs: Array<(x: any) => any>): R;
/* eslint-enable max-len */
export function pipe<T>(x: T, ...fns: ((x: T) => T)[]): T;
export function pipe<T>(x: T, ...fns: ((x: T) => T)[]): T {
    return fns.reduce(_call, x);
}

export function flow(): <T>(x: T) => T;
export function flow<T, R>(f1: (x: T) => R): (x: T) => R;
export function flow<T, A, R>(f1: (x: T) => A, f2: (x: A) => R): (x: T) => R;
/* eslint-disable max-len */
// prettier-ignore
export function flow<T, A, B, R>(f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => R): (x: T) => R;
// prettier-ignore
export function flow<T, A, B, C, R>(f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => R): (x: T) => R;
// prettier-ignore
export function flow<T, A, B, C, D, R>(f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => R): (x: T) => R;
// prettier-ignore
export function flow<T, A, B, C, D, E, R>(f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => E, f6: (x: E) => R): (x: T) => R;
// prettier-ignore
export function flow<T, A, B, C, D, E, F, R>(f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => E, f6: (x: E) => F, f7: (x: F) => R): (x: T) => R;
// prettier-ignore
export function flow<T, A, B, C, D, E, F, G, R>(f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => E, f6: (x: E) => F, f7: (x: F) => G, f8: (x: G) => R): (x: T) => R;
// prettier-ignore
export function flow<T, A, B, C, D, E, F, G, H, R>(f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => E, f6: (x: E) => F, f7: (x: F) => G, f8: (x: G) => H, f9: (x: H) => R): (x: T) => R;
// prettier-ignore
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function flow<T, A, B, C, D, E, F, G, H, R>(f1: (x: T) => A, f2: (x: A) => B, f3: (x: B) => C, f4: (x: C) => D, f5: (x: D) => E, f6: (x: E) => F, f7: (x: F) => G, f8: (x: G) => H, f9: (x: H) => R, ...funcs: Array<(x: any) => any>): (x: T) => R;
/* eslint-enable max-len */
export function flow<T>(...fns: Array<(x: T) => T>): (x: T) => T;
export function flow<T>(...fns: Array<(x: T) => T>): (x: T) => T {
    return (x: T): T => fns.reduce(_call, x);
}

/**
 * Converts the given value into an array.
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
 */
export function getLast<T>(array: ArrayLike<T>): T | undefined {
    return array.length > 0 ? array[array.length - 1] : undefined;
}

/**
 * Disposable-based alternative to built-in `requestAnimationFrame`.
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
 * Disposable-based alternative to built-in `setTimeout`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
 */
export function asyncReportError(error: unknown): void {
    setTimeout(() => {
        throw error;
    });
}

/**
 * Returns the most suitable iterator symbol.
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
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function isIterable(value: unknown): value is Iterable<unknown> {
    return (
        value !== undefined &&
        value != null &&
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        isFunction((value as any)[get$$iterator()])
    );
}

/**
 * Checks whether the given value is an AsyncIterable.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function isAsyncIterable(
    value: unknown,
): value is AsyncIterable<unknown> {
    const $$asyncIterator = get$$asyncIterator();

    return (
        !!$$asyncIterator &&
        value !== undefined &&
        value != null &&
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        isFunction((value as any)[$$asyncIterator])
    );
}

/**
 * Checks whether the given value is PromiseLike, meaning it has a `then`
 * function defined.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    return !!value && isFunction((value as PromiseLike<unknown>).then);
}

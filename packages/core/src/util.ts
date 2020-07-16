import { Disposable } from './disposable';

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
 * Removes the first instance of the value from the array.
 * @param array The array to remove the value from.
 * @param item The value to remove from the array.
 */
export function removeOnce<T>(array: T[], item: T): void {
    const index = array.indexOf(item);
    if (index !== -1) {
        array.splice(index, 1);
    }
}

declare function requestAnimationFrame(callback: FrameRequestCallback): number;
declare function cancelAnimationFrame(id: number): void;

/**
 * Disposable-based alternative to built-in `requestAnimationFrame`.
 * @param callback The callback to schedule.
 * @param subscription If this is disposed then the request will be cancelled.
 */
function requestAnimationFrameImplementation(
    callback: FrameRequestCallback,
    subscription?: Disposable,
): void {
    if (subscription && !subscription.active) {
        return;
    }

    const animationId = requestAnimationFrame(callback);

    if (subscription) {
        subscription.add(
            Disposable(() => {
                cancelAnimationFrame(animationId);
            }),
        );
    }
}

export { requestAnimationFrameImplementation as requestAnimationFrame };

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
    if (subscription && !subscription.active) {
        return;
    }

    const id = setTimeout(
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-implied-eval, @typescript-eslint/no-explicit-any
        callback as (...args: any[]) => void,
        delayMs,
        ...args,
    );

    if (subscription) {
        subscription.add(
            Disposable(() => {
                clearTimeout(id);
            }),
        );
    }
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
    if (subscription && !subscription.active) {
        return;
    }

    const id = setInterval(
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-implied-eval, @typescript-eslint/no-explicit-any
        callback as (...args: any[]) => void,
        delayMs,
        ...args,
    );

    if (subscription) {
        subscription.add(
            Disposable(() => {
                clearInterval(id);
            }),
        );
    }
}

export { setIntervalImplementation as setInterval };

/**
 * Reports the given error asynchronously.
 * @param error The error to report.
 */
export function asyncReportError(error: unknown): void {
    setTimeout(() => {
        throw error;
    }, 0);
}

export function forEach<T>(array: T[], callback: (value: T) => void): void {
    for (let i = 0; i < array.length; i++) {
        callback(array[i]);
    }
}

export function identity<T>(value: T): T {
    return value;
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function noop(): void {}

export function binarySearchNextLargestIndex<T>(
    items: T[],
    getValue: (item: T) => number,
    value: number,
    offset = 0,
): number {
    const length = items.length - offset;
    let low = 0;
    let high = length - 1;

    while (low <= high) {
        let mid = ((low + high) / 2) | 0;
        const midValue = getValue(items[mid + offset]);

        if (midValue < value) {
            low = mid + 1;
        } else if (midValue > value) {
            high = mid - 1;
        } else {
            while (
                mid + 1 < length &&
                getValue(items[mid + 1 + offset]) === value
            ) {
                mid++;
            }
            return mid + 1 + offset;
        }
    }

    if (high < 0) {
        return offset; // < first
    } else if (low > length - 1) {
        return length + offset; // >= last
    } else {
        return (low < high ? low + 1 : high + 1) + offset;
    }
}

export interface TimeProvider {
    (): number;
}

export interface FrameRequestCallback {
    (time: number): void;
}

/**
 * Returns the type of the first element of an array/tuple.
 */
export type Head<T extends any[]> = T extends [infer H, ...any[]]
    ? H
    : T extends Array<infer H>
    ? H
    : never;

/**
 * Returns the type of the tail of an array/tuple.
 */
export type Tail<Tuple extends any[]> = ((...t: Tuple) => void) extends (
    h: any,
    ...rest: infer R
) => void
    ? R
    : never;

/**
 * Adds the new type to the beginning of the array/tuple.
 */
export type Unshift<Tuple extends any[], NewType> = ((
    h: NewType,
    ...t: Tuple
) => void) extends (...t: infer R) => void
    ? R
    : never;

/**
 * Converts the type to ensure it is an array/tuple. If it is not, `any[]` will
 * be returned.
 */
export type EnsureArray<T> = T extends any[] ? T : any[];

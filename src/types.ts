/**
 * Returns the type of the first element of an array/tuple.
 * @example Finding the head of a tuple.
 * ```ts
 * // Type: string
 * type H = Head<[string, number]>;
 * ```
 */
export type Head<T extends any[]> = T extends [infer H, ...any[]]
    ? H
    : T extends Array<infer H>
    ? H
    : never;

/**
 * Returns the tail type of an array/tuple.
 * @example Finding the tail of a fixed length tuple.
 * ```ts
 * // Type: [number, boolean]
 * type T = Tail<[string, number, boolean]>;
 * ```
 */
export type Tail<Tuple extends any[]> = ((...t: Tuple) => void) extends (
    h: any,
    ...rest: infer R
) => void
    ? R
    : never;

/**
 * Adds the new type to the beginning of the array/tuple.
 * @example Unshift into array type.
 * ```ts
 * // Type: [string, ...number[]]
 * type _ = Unshift<number[], string>;
 * ```
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
 * @example Given a non-array type.
 * ```ts
 * // Type: any[] | [number, ...string[]]
 * type _ = EnsureArray<[number, ...string[]] | { [key: string]: boolean }>;
 * ```
 */
export type EnsureArray<T> = T extends any[] ? T : any[];

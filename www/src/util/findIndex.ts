// Not supported in IE.
export function findIndex<T>(
    list: readonly T[],
    predicate: (value: T) => boolean,
    startIndex = 0,
    endIndex = list.length - 1,
): number {
    for (let i = startIndex; i <= endIndex; i++) {
        if (predicate(list[i])) {
            return i;
        }
    }
    return -1;
}

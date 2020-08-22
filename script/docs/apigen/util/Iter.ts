export interface Iter<T> {
    next(): T | undefined;
    peekNext(): T | undefined;
    forEach(cb: (node: T) => void): void;
}

export function Iter<T>(nodes: readonly T[]): Iter<T> {
    let idx = 0;
    const iter = {
        next(): T | undefined {
            return nodes[idx++];
        },
        peekNext(): T | undefined {
            return nodes[idx];
        },
        forEach(cb: (node: T) => void): void {
            let node: T | undefined;
            while ((node = iter.next())) {
                cb(node);
            }
        },
    };
    return iter;
}

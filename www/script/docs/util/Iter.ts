export interface Iter<T> {
    next(): T | undefined;
    peekNext(): T | undefined;
}

export function Iter<T>(nodes: readonly T[]): Iter<T> {
    let idx = 0;
    return {
        next(): T | undefined {
            return nodes[idx++];
        },
        peekNext(): T | undefined {
            return nodes[idx];
        },
    };
}

export function ConcatIter<T>(...iters: readonly Iter<T>[]): Iter<T> {
    let iterIndex = 0;
    function next(): T | undefined {
        if (iterIndex === iters.length) {
            return;
        }
        const value = iters[iterIndex].next();
        if (value !== undefined) {
            return value;
        }
        iterIndex++;
        return next();
    }
    function peekNext(): T | undefined {
        if (iterIndex === iters.length) {
            return;
        }
        const value = iters[iterIndex].peekNext();
        if (value !== undefined) {
            return value;
        }
        iterIndex++;
        return peekNext();
    }
    return {
        next,
        peekNext,
    };
}

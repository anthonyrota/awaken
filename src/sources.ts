import { Source, Push, End } from './source';

/**
 * Creates a Source from the given array/array-like. The values of the array
 * will be synchronously emitted by the created source upon each susbcription.
 * @param array The array/array-like to take the values from.
 * @returns The created source.
 */
export function fromArray<T>(array: ArrayLike<T>): Source<T> {
    return Source((sink, sub) => {
        for (let i = 0; i < array.length && sub.active; i++) {
            sink(Push(array[i]));
        }
        sink(End);
    });
}

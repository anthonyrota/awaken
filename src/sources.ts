import { Source, Push, End } from './source';

export function fromArray<T>(array: T[]): Source<T> {
    return Source((sink, sub) => {
        for (let i = 0; i < array.length && sub.active; i++) {
            sink(Push(array[i]));
        }
        sink(End);
    });
}

import { Source, EventType, Push, Throw, End } from './source';

export interface Operator<T, U> {
    (source: Source<T>): Source<U>;
}

export function map<T, U>(transform: (x: T) => U): Operator<T, U> {
    return (source) =>
        Source((sink, sub) => {
            source((event) => {
                switch (event.type) {
                    case EventType.Push: {
                        let transformed: U;
                        try {
                            transformed = transform(event.value);
                        } catch (error) {
                            sink(Throw(error));
                            return;
                        }
                        sink(Push(transformed));
                        break;
                    }
                    default:
                        sink(event);
                }
            }, sub);
        });
}

export function takeWhile<T, U extends T>(
    shouldContinue: (value: T) => value is U,
): Operator<T, U>;
export function takeWhile<T>(
    shouldContinue: (value: T) => boolean,
): Operator<T, T>;
export function takeWhile<T>(
    shouldContinue: (value: T) => boolean,
): Operator<T, T> {
    return (source) =>
        Source((sink, sub) => {
            source((event) => {
                if (event.type === EventType.Push) {
                    let keepGoing: boolean;
                    try {
                        keepGoing = shouldContinue(event.value);
                    } catch (error) {
                        sink(Throw(error));
                        return;
                    }
                    if (!keepGoing) {
                        sink(End);
                        return;
                    }
                }
                sink(event);
            }, sub);
        });
}

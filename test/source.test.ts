import {
    EventType,
    Push,
    Throw,
    End,
    Source,
    Sink,
    subscribe,
    zipSources,
} from '../src/source';
import { Disposable } from './../src/disposable';

describe('EventType', () => {
    it('should have a Push property equal to zero', () => {
        expect(EventType.Push).toBe(0);
    });

    it('should have a Throw property equal to one', () => {
        expect(EventType.Throw).toBe(1);
    });

    it('should have an End property equal to two', () => {
        expect(EventType.End).toBe(2);
    });
});

describe('Push', () => {
    it('should be a function', () => {
        expect(Push).toBeFunction();
    });

    it('should return a Push event', () => {
        const value = { foo: 'bar' };
        const event = Push(value);
        expect(event).toEqual({ type: EventType.Push, value });
    });
});

describe('Throw', () => {
    it('should be a function', () => {
        expect(Throw).toBeFunction();
    });

    it('should return a Throw event', () => {
        const error = { foo: 'bar' };
        const event = Throw(error);
        expect(event).toEqual({ type: EventType.Throw, error });
    });
});

describe('End', () => {
    it('should be an object', () => {
        expect(End).toBeObject();
    });

    it('should be an End event', () => {
        expect(End).toEqual({ type: EventType.End });
    });
});

describe('Source', () => {
    it('should be a function', () => {
        expect(Source).toBeFunction();
    });

    it('should return a function', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const source = Source(() => {});
        expect(source).toBeFunction();
    });
});

describe('Sink', () => {
    it('should be a function', () => {
        expect(Sink).toBeFunction();
    });

    it('should not take values from a previous subscriber of parent disposable', () => {
        const received: unknown[] = [];
        const parent = Disposable();
        const sink = Sink((event) => {
            received.push(event);
            parent.dispose();
        });
        parent.add(
            Disposable(() => {
                sink(Push(1));
            }),
        );
        parent.add(sink);
        sink(Push(0));
        expect(received).toEqual([Push(0)]);
    });
});

describe('subscribe', () => {
    it('should be a function', () => {
        expect(subscribe).toBeFunction();
    });
});

import {
    TestSchedule,
    P,
    T,
    E,
    TestSource,
    watchSourceEvents,
} from '../src/testing';

/** @todo actual tests */
describe('zipSources', () => {
    it('works case 1', () => {
        const testSchedule = TestSchedule();
        const source = zipSources(
            TestSource([P('a', 0), P('b', 4), P('c', 21), E(22)], testSchedule),
            TestSource([P('z', 3), P('y', 91), P('x', 102)], testSchedule),
        );
        const events = watchSourceEvents(source, testSchedule);
        testSchedule.flush();
        expect(events).toEqual([
            P(['a', 'z'], 3),
            P(['b', 'y'], 91),
            P(['c', 'x'], 102),
            E(102),
        ]);
    });

    it('works case two', () => {
        const testSchedule = TestSchedule();
        const source = zipSources(
            TestSource([P('a', 0), P('b', 4), P('c', 21), E(22)], testSchedule),
            TestSource([P('z', 3), P('y', 91), T('e', 102)], testSchedule),
        );
        const events = watchSourceEvents(source, testSchedule);
        testSchedule.flush();
        expect(events).toEqual([
            P(['a', 'z'], 3),
            P(['b', 'y'], 91),
            T('e', 102),
        ]);
    });

    it('works case three', () => {
        const testSchedule = TestSchedule();
        const source = zipSources(
            TestSource([P('a', 0), P('b', 4), P('c', 21), E(22)], testSchedule),
            TestSource([P('z', 3), P('y', 91), P('x', 102)], testSchedule),
            // prettier-ignore
            TestSource([P('1', 0), P('2', 0), E(1)], testSchedule),
        );
        const events = watchSourceEvents(source, testSchedule);
        testSchedule.flush();
        expect(events).toEqual([
            P(['a', 'z', '1'], 3),
            P(['b', 'y', '2'], 91),
            E(91),
        ]);
    });
});

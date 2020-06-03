import {
    TestSchedule,
    TestSubscriptionInfo,
    P,
    T,
    E,
    TestSource,
    SharedTestSource,
    watchSourceEvents,
} from '../src/testing';

describe('TestSource', () => {
    it('works', () => {
        const testSchedule = TestSchedule();
        const X = 'XXX';
        const Y = 'YYY';
        const error = { foo: 'bar' };
        const source = TestSource(
            [P(X, 0), P(Y, 3), P(X, 3), T(error, 4)],
            testSchedule,
        );
        const events = watchSourceEvents(source, testSchedule);
        testSchedule.flush();
        expect(events).toEqual([P(X, 0), P(Y, 3), P(X, 3), T(error, 4)]);
    });
});

describe('SharedTestSource', () => {
    it('works', () => {
        const testSchedule = TestSchedule();
        const X = 'XXX';
        const Y = 'YYY';
        const source = SharedTestSource(
            [P(X, 0), P(Y, 3), P(X, 3), E(7)],
            testSchedule,
        );
        source.schedule();
        const events = watchSourceEvents(
            source,
            testSchedule,
            TestSubscriptionInfo(2, 6),
        );
        testSchedule.flush();
        expect(events).toEqual([P(Y, 3), P(X, 3)]);
        expect(source.subscriptions).toEqual([TestSubscriptionInfo(2, 6)]);
    });
});

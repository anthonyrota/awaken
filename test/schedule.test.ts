import {
    ScheduleQueued,
    ScheduleQueuedDiscrete,
    scheduleSync,
    ScheduleSyncQueued,
    scheduleAnimationFrame,
    ScheduleAnimationFrameQueued,
    ScheduleTimeout,
    ScheduleTimeoutQueued,
    ScheduleInterval,
    ScheduleFunction,
} from '../src/schedule';
import { Disposable } from '../src/disposable';
import { throw_ } from './testUtils';
import { RafMock } from './mockTypes/raf';

import raf = require('raf');
const rafMock = (raf as unknown) as RafMock;

describe('ScheduleQueued', () => {
    it('should be a function', () => {
        expect(ScheduleQueued).toBeFunction();
    });
});

describe('ScheduleQueuedDiscrete', () => {
    it('should be a function', () => {
        expect(ScheduleQueuedDiscrete).toBeFunction();
    });
});

describe('scheduleSync', () => {
    it('should be a function', () => {
        expect(scheduleSync).toBeFunction();
    });

    it('should call the callback once with no arguments', () => {
        const callback = jest.fn();
        scheduleSync(callback);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith();
    });

    it('should call the callback once with no arguments when given an active disposable', () => {
        const callback = jest.fn();
        scheduleSync(callback, new Disposable());
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith();
    });

    it('should do nothing when given a disposed disposable', () => {
        const callback = jest.fn();
        const disposed = new Disposable();
        disposed.dispose();
        scheduleSync(callback, disposed);
        expect(callback).not.toHaveBeenCalled();
    });

    it('should throw the error that a callback throws and allow scheduling of more functions after', () => {
        const throws = jest.fn(throw_('foo'));
        expect(() => scheduleSync(throws)).toThrow('foo');
        expect(throws).toHaveBeenCalledTimes(1);
        const callback = jest.fn();
        scheduleSync(callback);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith();
    });

    it('should throw the error that a nested callback throws and allow scheduling of more functions after', () => {
        return new Promise((done) => {
            const throws = jest.fn(throw_('foo'));
            const throwsWrapped = jest.fn(() => {
                scheduleSync(throws);
                done(new Error('This should not be called.'));
            });
            expect(() => scheduleSync(throwsWrapped)).toThrow('foo');
            expect(throws).toHaveBeenCalledTimes(1);
            expect(throwsWrapped).toHaveBeenCalledTimes(1);
            const callback = jest.fn();
            scheduleSync(callback);
            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith();
            done();
        });
    });

    it('should synchronously call all nested functions', () => {
        const nested1 = jest.fn();
        const nested2 = jest.fn();
        const callback = jest.fn(() => {
            scheduleSync(nested1);
            expect(nested1).toHaveBeenCalledTimes(1);
            scheduleSync(nested2);
            expect(nested2).toHaveBeenCalledTimes(1);
        });
        scheduleSync(callback);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(nested1).toHaveBeenCalledTimes(1);
        expect(nested1).toHaveBeenCalledWith();
        expect(nested2).toHaveBeenCalledTimes(1);
        expect(nested2).toHaveBeenCalledWith();
    });
});

describe('ScheduleSyncQueued', () => {
    it('should be a function', () => {
        expect(ScheduleSyncQueued).toBeFunction();
    });

    it('should synchronously call a single callback once with no arguments', () => {
        const scheduleSyncQueued = ScheduleSyncQueued();
        const callback = jest.fn();
        scheduleSyncQueued(callback);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith();
    });

    it('should synchronously call a single callback once with no arguments when given an active disposable', () => {
        const scheduleSyncQueued = ScheduleSyncQueued();
        const callback = jest.fn();
        scheduleSyncQueued(callback, new Disposable());
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith();
    });

    it('should do nothing when given a disposed disposable', () => {
        const scheduleSyncQueued = ScheduleSyncQueued();
        const callback = jest.fn();
        const disposed = new Disposable();
        disposed.dispose();
        scheduleSyncQueued(callback, disposed);
        expect(callback).not.toHaveBeenCalled();
    });

    it('should call a single recursively given callback only after the first callback is executed', () => {
        const scheduleSyncQueued = ScheduleSyncQueued();
        const inside = jest.fn();
        const outside = jest.fn(() => {
            scheduleSyncQueued(inside);
            expect(inside).not.toHaveBeenCalled();
        });
        scheduleSyncQueued(outside);
        expect(outside).toHaveBeenCalledTimes(1);
        expect(outside).toHaveBeenCalledWith();
        expect(inside).toHaveBeenCalledTimes(1);
        expect(inside).toHaveBeenCalledWith();
    });

    it('should return a different instance each time', () => {
        expect(ScheduleSyncQueued()).not.toBe(ScheduleSyncQueued());
    });

    it('should use different queues for different instances', () => {
        const scheduleSyncQueued1 = ScheduleSyncQueued();
        const scheduleSyncQueued2 = ScheduleSyncQueued();
        const nested = jest.fn();
        const callback = jest.fn(() => {
            scheduleSyncQueued2(nested);
            expect(nested).toHaveBeenCalledTimes(1);
        });
        scheduleSyncQueued1(callback);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should call multiple recursively given callbacks only after the previous ones have been executed', () => {
        const getShiftIcoToStartFromOne = jest.fn(() => {
            const zero = getShiftIcoToStartFromOne.mock.invocationCallOrder[0];
            return (fn: jest.Mock) =>
                fn.mock.invocationCallOrder.map((i) => i - zero);
        });
        const icof1 = getShiftIcoToStartFromOne();
        const scheduleSyncQueued = ScheduleSyncQueued();
        const main1_3 = jest.fn();
        const main1_1 = jest.fn(() => {
            scheduleSyncQueued(main1_3);
        });
        const main1_2 = jest.fn();
        const main1 = jest.fn(() => {
            scheduleSyncQueued(main1_1);
            scheduleSyncQueued(main1_2);
        });
        const main2_1_1 = jest.fn();
        const main2_1_2 = jest.fn();
        const main2_1_3 = jest.fn();
        const main2_1_4 = jest.fn();
        const main2_1 = jest.fn(() => {
            scheduleSyncQueued(main2_1_1);
            scheduleSyncQueued(main2_1_2);
            if (main2_1.mock.calls.length < 10) {
                scheduleSyncQueued(main2_1);
            }
            scheduleSyncQueued(main2_1_3);
            scheduleSyncQueued(main2_1_4);
        });
        const main2 = jest.fn(() => {
            if (main2.mock.calls.length < 10) {
                scheduleSyncQueued(main2);
            }
            if (main2.mock.calls.length === 1) {
                scheduleSyncQueued(main2_1);
            }
        });
        scheduleSyncQueued(main1);
        scheduleSyncQueued(main2);
        // start execution: main1
        // (1) main1();   (queue): [main_1, main1_2]
        // (2) main1_1(); (queue): [main1_2, main1_3]
        // (3) main1_2(); (4) main1_3();
        // end execution: main1
        expect(icof1(main1)).toEqual([1]);
        expect(icof1(main1_1)).toEqual([2]);
        expect(icof1(main1_2)).toEqual([3]);
        expect(icof1(main1_3)).toEqual([4]);
        /* eslint-disable max-len */
        // start execution: main2
        // (5) main2();   (queue): [main2, main2_1]
        // (6) main2();   (queue): [main2_1, main2]
        // (7) main2_1(); (queue): [main2, main2_1_1, main2_1_2, main2_1, main2_1_3, main2_1_4]
        // (8) main2();   (queue): [main2_1_1, main2_1_2, main2_1, main2_1_3, main2_1_4, main2]
        // (9) main2_1_1();  (10) main2_1_2(); (11) main2_1(); (queue): [main2_1_3, main2_1_4, main2, main2_1_1, main2_1_2, main2_1, main2_1_3, main2_1_4]
        // (12) main2_1_3(); (13) main2_1_4(); (14) main2();   (queue): [main2_1_1, main2_1_2, main2_1, main2_1_3, main2_1_4, main2]
        // (15) main2_1_1(); (16) main2_1_2(); (17) main2_1(); (queue): [main2_1_3, main2_1_4, main2, main2_1_1, main2_1_2, main2_1, main2_1_3, main2_1_4]
        // (18) main2_1_3(); (19) main2_1_4(); (20) main2();   (queue): [main2_1_1, main2_1_2, main2_1, main2_1_3, main2_1_4, main2]
        // (21) main2_1_1(); (22) main2_1_2(); (23) main2_1(); (queue): [main2_1_3, main2_1_4, main2, main2_1_1, main2_1_2, main2_1, main2_1_3, main2_1_4]
        // (24) main2_1_3(); (25) main2_1_4(); (26) main2();   (queue): [main2_1_1, main2_1_2, main2_1, main2_1_3, main2_1_4, main2]
        // (27) main2_1_1(); (28) main2_1_2(); (29) main2_1(); (queue): [main2_1_3, main2_1_4, main2, main2_1_1, main2_1_2, main2_1, main2_1_3, main2_1_4]
        // (30) main2_1_3(); (31) main2_1_4(); (32) main2();   (queue): [main2_1_1, main2_1_2, main2_1, main2_1_3, main2_1_4, main2]
        // (33) main2_1_1(); (34) main2_1_2(); (35) main2_1(); (queue): [main2_1_3, main2_1_4, main2, main2_1_1, main2_1_2, main2_1, main2_1_3, main2_1_4]
        // (36) main2_1_3(); (37) main2_1_4(); (38) main2();   (queue): [main2_1_1, main2_1_2, main2_1, main2_1_3, main2_1_4, main2]
        // (39) main2_1_1(); (40) main2_1_2(); (41) main2_1(); (queue): [main2_1_3, main2_1_4, main2, main2_1_1, main2_1_2, main2_1, main2_1_3, main2_1_4]
        // (42) main2_1_3(); (43) main2_1_4(); (44) main2();   (queue): [main2_1_1, main2_1_2, main2_1, main2_1_3, main2_1_4, main2]
        // (45) main2_1_1(); (46) main2_1_2(); (47) main2_1(); (queue): [main2_1_3, main2_1_4, main2, main2_1_1, main2_1_2, main2_1, main2_1_3, main2_1_4]
        // (48) main2_1_3(); (49) main2_1_4(); (50) main2();   (queue): [main2_1_1, main2_1_2, main2_1, main2_1_3, main2_1_4]
        // (51) main2_1_1(); (52) main2_1_2(); (53) main2_1(); (queue): [main2_1_3, main2_1_4, main2_1_1, main2_1_2, main2_1, main2_1_3, main2_1_4]
        // (54) main2_1_3(); (55) main2_1_4(); (56) main2_1_1(); (57) main2_1_2(); (58) main2_1(); (queue): [main2_1_3, main2_1_4, main2_1_1, main2_1_2, main2_1_3, main2_1_4]
        // (59) main2_1_3(); (60) main2_1_4(); (61) main2_1_1(); (62) main2_1_2(); (63) main2_1_3(); (64) main2_1_4();
        // end execution: main2
        expect(icof1(main2)).toEqual([5, 6, 8, 14, 20, 26, 32, 38, 44, 50]);
        expect(icof1(main2_1)).toEqual([7, 11, 17, 23, 29, 35, 41, 47, 53, 58]);
        // prettier-ignore
        expect(icof1(main2_1_1)).toEqual([9, 15, 21, 27, 33, 39, 45, 51, 56, 61]);
        // prettier-ignore
        expect(icof1(main2_1_2)).toEqual([10, 16, 22, 28, 34, 40, 46, 52, 57, 62]);
        // prettier-ignore
        expect(icof1(main2_1_3)).toEqual([12, 18, 24, 30, 36, 42, 48, 54, 59, 63]);
        // prettier-ignore
        expect(icof1(main2_1_4)).toEqual([13, 19, 25, 31, 37, 43, 49, 55, 60, 64]);
        /* eslint-enable max-len */
    });

    it('should cancel a single nested callback', () => {
        const scheduleSyncQueued = ScheduleSyncQueued();
        const disposable = new Disposable();
        const nested = jest.fn();
        const callback = jest.fn(() => {
            scheduleSyncQueued(nested, disposable);
            disposable.dispose();
        });
        scheduleSyncQueued(callback);
        expect(nested).not.toHaveBeenCalled();
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should only cancel the callback whose subscription has been disposed', () => {
        const scheduleSyncQueued = ScheduleSyncQueued();
        const disposable = new Disposable();
        const nested1 = jest.fn();
        const nested2 = jest.fn();
        const nested3 = jest.fn();
        const callback = jest.fn(() => {
            scheduleSyncQueued(nested1);
            scheduleSyncQueued(nested2, disposable);
            scheduleSyncQueued(nested3);
            disposable.dispose();
            expect(nested1).not.toHaveBeenCalled();
            expect(nested3).not.toHaveBeenCalled();
        });
        scheduleSyncQueued(callback);
        expect(nested2).not.toHaveBeenCalled();
        expect(callback).toHaveBeenCalledTimes(1);
        expect(nested1).toHaveBeenCalledTimes(1);
        expect(nested1).toHaveBeenCalledWith();
        expect(nested3).toHaveBeenCalledTimes(1);
        expect(nested3).toHaveBeenCalledWith();
    });

    it('should not schedule a nested callback when given a disposed disposable', () => {
        const scheduleSyncQueued = ScheduleSyncQueued();
        const disposable = new Disposable();
        disposable.dispose();
        const nested = jest.fn();
        const callback = jest.fn(() => {
            scheduleSyncQueued(nested, disposable);
        });
        scheduleSyncQueued(callback);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(nested).not.toHaveBeenCalled();
    });

    it('should do nothing when cancelling a callback after it has been called', () => {
        const scheduleSyncQueued = ScheduleSyncQueued();
        const disposable = new Disposable();
        const nested = jest.fn();
        const callback = jest.fn(() => {
            scheduleSyncQueued(nested, disposable);
        });
        scheduleSyncQueued(callback, disposable);
        disposable.dispose();
        expect(callback).toHaveBeenCalledTimes(1);
        expect(nested).toHaveBeenCalledTimes(1);
    });

    it('should cancel multiple callbacks', () => {
        const scheduleSyncQueued = ScheduleSyncQueued();
        const disposable = new Disposable();
        const nested1_1 = jest.fn();
        const nested1_2 = jest.fn();
        const nested1 = jest.fn(() => {
            scheduleSyncQueued(nested1_1, disposable);
            scheduleSyncQueued(nested1_2);
            disposable.dispose();
            expect(nested1_2).not.toHaveBeenCalled();
            expect(nested4).not.toHaveBeenCalled();
        });
        const nested2 = jest.fn();
        const nested3 = jest.fn();
        const nested4 = jest.fn();
        const callback = jest.fn(() => {
            scheduleSyncQueued(nested1);
            scheduleSyncQueued(nested2, disposable);
            scheduleSyncQueued(nested3, disposable);
            scheduleSyncQueued(nested4);
        });
        scheduleSyncQueued(callback);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(nested1).toHaveBeenCalledTimes(1);
        expect(nested1_1).not.toHaveBeenCalled();
        expect(nested1_2).toHaveBeenCalledTimes(1);
        expect(nested1_2).toHaveBeenCalledWith();
        expect(nested2).not.toHaveBeenCalled();
        expect(nested3).not.toHaveBeenCalled();
        expect(nested4).toHaveBeenCalledTimes(1);
        expect(nested4).toHaveBeenCalledWith();
    });

    it('should throw the error thrown by the main callback scheduled', () => {
        const scheduleSyncQueued = ScheduleSyncQueued();
        const throws = jest.fn(throw_('foo'));
        expect(() => scheduleSyncQueued(throws)).toThrow('foo');
        expect(throws).toHaveBeenCalledTimes(1);
    });

    it('should throw the error thrown by a nested callback', () => {
        const scheduleSyncQueued = ScheduleSyncQueued();
        const throws = jest.fn(throw_('foo'));
        const callback = jest.fn(() => {
            scheduleSyncQueued(throws);
        });
        expect(() => scheduleSyncQueued(callback)).toThrow('foo');
        expect(callback).toHaveBeenCalledTimes(1);
        expect(throws).toHaveBeenCalledTimes(1);
    });

    it('should cancel queued callbacks when the main callback scheduled throws', () => {
        const scheduleSyncQueued = ScheduleSyncQueued();
        const nested1 = jest.fn();
        const nested2 = jest.fn();
        const callback = jest.fn(() => {
            scheduleSyncQueued(nested1);
            scheduleSyncQueued(nested2);
            throw_('foo')();
        });
        expect(() => scheduleSyncQueued(callback)).toThrow('foo');
        expect(callback).toHaveBeenCalledTimes(1);
        expect(nested1).not.toHaveBeenCalled();
        expect(nested2).not.toHaveBeenCalled();
    });

    it('should cancel queued callbacks when a nested callback throws', () => {
        const scheduleSyncQueued = ScheduleSyncQueued();
        const nested1_1 = jest.fn();
        const nested1 = jest.fn(() => {
            scheduleSyncQueued(nested1_1);
            throw_('foo')();
        });
        const nested2 = jest.fn();
        const callback = jest.fn(() => {
            scheduleSyncQueued(nested1);
            scheduleSyncQueued(nested2);
        });
        expect(() => scheduleSyncQueued(callback)).toThrow('foo');
        expect(callback).toHaveBeenCalledTimes(1);
        expect(nested1).toHaveBeenCalledTimes(1);
        expect(nested1_1).not.toHaveBeenCalled();
        expect(nested2).not.toHaveBeenCalled();
    });

    it('should be able to schedule more main callbacks after the previous one errored', () => {
        const scheduleSyncQueued = ScheduleSyncQueued();
        const throws1 = jest.fn(throw_('foo'));
        const throws2 = jest.fn(throw_('bar'));
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        expect(() => scheduleSyncQueued(throws1)).toThrow('foo');
        expect(() => scheduleSyncQueued(throws2)).toThrow('bar');
        scheduleSyncQueued(callback1);
        scheduleSyncQueued(callback2);
        expect(throws1).toHaveBeenCalledTimes(1);
        expect(throws2).toHaveBeenCalledTimes(1);
        expect(throws2).toHaveBeenCalledWith();
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback1).toHaveBeenCalledWith();
        expect(callback2).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledWith();
    });

    it('should be able to schedule more nested main callbacks after the previous one errored', () => {
        const scheduleSyncQueued = ScheduleSyncQueued();
        const throws = jest.fn(throw_('foo'));
        const nested1_1 = jest.fn();
        const nested1 = jest.fn(() => {
            scheduleSyncQueued(nested1_1);
            expect(nested1_1).not.toHaveBeenCalled();
            expect(nested2).not.toHaveBeenCalled();
        });
        const nested2 = jest.fn();
        const callback = jest.fn(() => {
            scheduleSyncQueued(nested1);
            scheduleSyncQueued(nested2);
            expect(nested1).not.toHaveBeenCalled();
            expect(nested2).not.toHaveBeenCalled();
        });
        expect(() => scheduleSyncQueued(throws)).toThrow('foo');
        scheduleSyncQueued(callback);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(nested1).toHaveBeenCalledTimes(1);
        expect(nested1_1).toHaveBeenCalledTimes(1);
        expect(nested2).toHaveBeenCalledTimes(1);
    });
});

describe('scheduleAnimationFrame', () => {
    afterEach(jest.clearAllMocks);
    afterEach(rafMock._resetQueue);

    it('should be a function', () => {
        expect(scheduleAnimationFrame).toBeFunction();
    });

    it('should not call the callback immediately', () => {
        const callback = jest.fn();
        scheduleAnimationFrame(callback);
        expect(callback).not.toHaveBeenCalled();
    });

    it('should raf the callback', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const callback = () => {};
        scheduleAnimationFrame(callback);
        expect(rafMock).toHaveBeenCalledTimes(1);
        expect(rafMock).toHaveBeenCalledWith(callback);
    });

    it('should raf the callback when given an active disposable', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const callback = () => {};
        const disposable = new Disposable();
        scheduleAnimationFrame(callback, disposable);
        expect(rafMock).toHaveBeenCalledTimes(1);
        expect(rafMock).toHaveBeenCalledWith(callback);
    });

    it('should not raf the callback when given a disposed disposable', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const callback = () => {};
        const disposable = new Disposable();
        disposable.dispose();
        scheduleAnimationFrame(callback, disposable);
        expect(rafMock).not.toHaveBeenCalled();
    });

    it('should support multiple schedules', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const callback1 = () => {};
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const callback2 = () => {};
        scheduleAnimationFrame(callback1);
        expect(rafMock).toHaveBeenCalledTimes(1);
        scheduleAnimationFrame(callback2);
        expect(rafMock).toHaveBeenCalledTimes(2);
        expect(rafMock).toHaveBeenNthCalledWith(2, callback2);
        scheduleAnimationFrame(callback1);
        expect(rafMock).toHaveBeenCalledTimes(3);
        expect(rafMock).toHaveBeenNthCalledWith(3, callback1);
    });

    it('should be able to cancel the callback', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const callback = () => {};
        const disposable = new Disposable();
        scheduleAnimationFrame(callback, disposable);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const id: number = rafMock.mock.results[0].value;
        disposable.dispose();
        expect(rafMock.cancel).toHaveBeenCalledTimes(1);
        expect(rafMock.cancel).toHaveBeenCalledWith(id);
    });
});

describe('ScheduleAnimationFrameQueued', () => {
    afterEach(jest.clearAllMocks);
    afterEach(rafMock._resetQueue);

    it('should be a function', () => {
        expect(ScheduleAnimationFrameQueued).toBeFunction();
    });

    it('should return a different instance each time', () => {
        const sAFQ1 = ScheduleAnimationFrameQueued();
        const sAFQ2 = ScheduleAnimationFrameQueued();
        expect(sAFQ1).not.toBe(sAFQ2);
    });

    it('should use different queues for different instances', () => {
        const scheduleAnimationFrameQueued1 = ScheduleAnimationFrameQueued();
        const scheduleAnimationFrameQueued2 = ScheduleAnimationFrameQueued();
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        scheduleAnimationFrameQueued1(callback1);
        scheduleAnimationFrameQueued2(callback2);
        expect(rafMock).toHaveBeenCalledTimes(2);
        expect(rafMock._getActiveCount()).toBe(2);
        rafMock._flushQueue();
        expect(rafMock).toHaveBeenCalledTimes(2);
        expect(rafMock._getActiveCount()).toBe(0);
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should not call the given callback immediately', () => {
        const scheduleAnimationFrameQueued = ScheduleAnimationFrameQueued();
        const callback = jest.fn();
        scheduleAnimationFrameQueued(callback);
        expect(callback).not.toHaveBeenCalled();
    });

    it('should call rAF', () => {
        const scheduleAnimationFrameQueued = ScheduleAnimationFrameQueued();
        expect(rafMock).not.toHaveBeenCalled();
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        scheduleAnimationFrameQueued(() => {});
        expect(rafMock._getActiveCount()).toBe(1);
        expect(rafMock).toHaveBeenCalledTimes(1);
    });

    it('should call rAF when given an active disposable', () => {
        const scheduleAnimationFrameQueued = ScheduleAnimationFrameQueued();
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        scheduleAnimationFrameQueued(() => {}, new Disposable());
        expect(rafMock._getActiveCount()).toBe(1);
        expect(rafMock).toHaveBeenCalledTimes(1);
    });

    it('should do nothing when given a disposed disposable', () => {
        const scheduleAnimationFrameQueued = ScheduleAnimationFrameQueued();
        const disposed = new Disposable();
        disposed.dispose();
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        scheduleAnimationFrameQueued(() => {}, disposed);
        expect(rafMock._getActiveCount()).toBe(0);
        expect(rafMock).not.toHaveBeenCalled();
    });

    it('should call rAF with a function calling the given callback', () => {
        const scheduleAnimationFrameQueued = ScheduleAnimationFrameQueued();
        const callback = jest.fn();
        scheduleAnimationFrameQueued(callback);
        rafMock._flushQueue();
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith(expect.any(Number));
    });

    it('should not call another rAF if only one callback is ever scheduled', () => {
        const scheduleAnimationFrameQueued = ScheduleAnimationFrameQueued();
        const callback = jest.fn();
        scheduleAnimationFrameQueued(callback);
        rafMock._flushQueue();
        expect(rafMock).toHaveBeenCalledTimes(1);
        expect(rafMock._getActiveCount()).toBe(0);
    });

    it('should cancel the main scheduled callback when the given disposable is disposed', () => {
        const scheduleAnimationFrameQueued = ScheduleAnimationFrameQueued();
        const callback = jest.fn();
        const disposable = new Disposable();
        scheduleAnimationFrameQueued(callback, disposable);
        disposable.dispose();
        expect(rafMock).toHaveBeenCalledTimes(1);
        expect(rafMock._getActiveCount()).toBe(0);
        expect(callback).not.toHaveBeenCalled();
    });

    it('should call two consecutively scheduled callbacks in separate rAF calls one after another', () => {
        const scheduleAnimationFrameQueued = ScheduleAnimationFrameQueued();
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        scheduleAnimationFrameQueued(callback1);
        scheduleAnimationFrameQueued(callback2);
        expect(rafMock._getActiveCount()).toBe(1);
        expect(rafMock).toHaveBeenCalledTimes(1);
        rafMock._flushQueue();
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback1).toHaveBeenCalledWith(expect.any(Number));
        expect(callback2).not.toHaveBeenCalled();
        expect(rafMock._getActiveCount()).toBe(1);
        expect(rafMock).toHaveBeenCalledTimes(2);
        // prettier-ignore
        // eslint-disable-next-line max-len
        rafMock._flushQueue();
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledWith(expect.any(Number));
        expect(rafMock._getActiveCount()).toBe(0);
        expect(rafMock).toHaveBeenCalledTimes(2);
    });

    it('should be able to cancel top level callbacks', () => {
        const scheduleAnimationFrameQueued = ScheduleAnimationFrameQueued();
        const disposable1 = new Disposable();
        const disposable2 = new Disposable();
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        const callback3 = jest.fn();
        const callback4 = jest.fn();
        scheduleAnimationFrameQueued(callback1);
        scheduleAnimationFrameQueued(callback2, disposable1);
        scheduleAnimationFrameQueued(callback3);
        disposable1.dispose();
        scheduleAnimationFrameQueued(callback4, disposable2);
        disposable2.dispose();
        expect(rafMock._getActiveCount()).toBe(1);
        expect(rafMock).toHaveBeenCalledTimes(1);
        rafMock._flushQueue();
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback1).toHaveBeenCalledWith(expect.any(Number));
        expect(callback2).not.toHaveBeenCalled();
        expect(callback3).not.toHaveBeenCalled();
        expect(callback4).not.toHaveBeenCalled();
        expect(rafMock).toHaveBeenCalledTimes(2);
        expect(rafMock._getActiveCount()).toBe(1);
        rafMock._flushQueue();
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).not.toHaveBeenCalled();
        expect(callback3).toHaveBeenCalledTimes(1);
        expect(callback3).toHaveBeenCalledWith(expect.any(Number));
        expect(callback4).not.toHaveBeenCalled();
        expect(rafMock).toHaveBeenCalledTimes(2);
        expect(rafMock._getActiveCount()).toBe(0);
    });

    it('should cancel the rAF if all top level callbacks are cancelled', () => {
        const scheduleAnimationFrameQueued = ScheduleAnimationFrameQueued();
        const disposable = new Disposable();
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        const callback3 = jest.fn();
        scheduleAnimationFrameQueued(callback1, disposable);
        scheduleAnimationFrameQueued(callback2, disposable);
        scheduleAnimationFrameQueued(callback3, disposable);
        disposable.dispose();
        expect(rafMock).toHaveBeenCalledTimes(1);
        expect(rafMock._getActiveCount()).toBe(0);
        expect(callback1).toHaveBeenCalledTimes(0);
        expect(callback2).toHaveBeenCalledTimes(0);
        expect(callback3).toHaveBeenCalledTimes(0);
    });

    it('should be able to cancel the rAF after a callback has been called', () => {
        const scheduleAnimationFrameQueued = ScheduleAnimationFrameQueued();
        const disposable = new Disposable();
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        scheduleAnimationFrameQueued(callback1);
        scheduleAnimationFrameQueued(callback2, disposable);
        rafMock._flushQueue();
        disposable.dispose();
        expect(rafMock).toHaveBeenCalledTimes(2);
        expect(rafMock._getActiveCount()).toBe(0);
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).not.toHaveBeenCalled();
    });

    it('should schedule nested callbacks one after another', () => {
        const scheduleAnimationFrameQueued = ScheduleAnimationFrameQueued();
        const nested = jest.fn();
        const callback = jest.fn(() => {
            scheduleAnimationFrameQueued(nested);
        });
        scheduleAnimationFrameQueued(callback);
        rafMock._flushQueue();
        expect(rafMock).toHaveBeenCalledTimes(2);
        expect(rafMock._getActiveCount()).toBe(1);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(nested).not.toHaveBeenCalled();
        rafMock._flushQueue();
        expect(rafMock).toHaveBeenCalledTimes(2);
        expect(rafMock._getActiveCount()).toBe(0);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(nested).toHaveBeenCalledTimes(1);
        expect(nested).toHaveBeenCalledWith(expect.any(Number));
    });

    function testScheduleMultipleNestedCallbacks(
        scheduleAnimationFrameQueued: ScheduleFunction,
    ): void {
        const prev = ((rafMock as unknown) as jest.Mock).mock.calls.length;
        const nested1_1 = jest.fn();
        const nested1_2_1 = jest.fn();
        const nested1_2 = jest.fn(() => {
            scheduleAnimationFrameQueued(nested1_2_1);
        });
        const nested1 = jest.fn(() => {
            scheduleAnimationFrameQueued(nested1_1);
            scheduleAnimationFrameQueued(nested1_2);
        });
        const nested2 = jest.fn();
        const nested3 = jest.fn();
        const callback1 = jest.fn(() => {
            scheduleAnimationFrameQueued(nested1);
            scheduleAnimationFrameQueued(nested2);
            scheduleAnimationFrameQueued(nested3);
        });
        const callback2 = jest.fn();
        scheduleAnimationFrameQueued(callback1);
        scheduleAnimationFrameQueued(callback2);
        expect(rafMock).toHaveBeenCalledTimes(prev + 1);
        expect(rafMock._getActiveCount()).toBe(1);
        rafMock._flushQueue();
        expect(rafMock).toHaveBeenCalledTimes(prev + 2);
        expect(rafMock._getActiveCount()).toBe(1);
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback1).toHaveBeenCalledWith(expect.any(Number));
        expect(callback2).not.toHaveBeenCalled();
        expect(nested1).not.toHaveBeenCalled();
        expect(nested2).not.toHaveBeenCalled();
        expect(nested3).not.toHaveBeenCalled();
        rafMock._flushQueue();
        expect(rafMock).toHaveBeenCalledTimes(prev + 3);
        expect(rafMock._getActiveCount()).toBe(1);
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledWith(expect.any(Number));
        expect(nested1).not.toHaveBeenCalled();
        expect(nested2).not.toHaveBeenCalled();
        expect(nested3).not.toHaveBeenCalled();
        rafMock._flushQueue();
        expect(rafMock).toHaveBeenCalledTimes(prev + 4);
        expect(rafMock._getActiveCount()).toBe(1);
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledTimes(1);
        expect(nested1).toHaveBeenCalledTimes(1);
        expect(nested1).toHaveBeenCalledWith(expect.any(Number));
        for (const c of [nested2, nested3, nested1_1, nested1_2]) {
            expect(c).not.toHaveBeenCalled();
        }
        rafMock._flushQueue();
        expect(rafMock).toHaveBeenCalledTimes(prev + 5);
        expect(rafMock._getActiveCount()).toBe(1);
        for (const c of [callback1, callback2, nested1, nested2]) {
            expect(c).toHaveBeenCalledTimes(1);
        }
        expect(nested2).toHaveBeenCalledWith(expect.any(Number));
        expect(nested3).not.toHaveBeenCalled();
        expect(nested1_1).not.toHaveBeenCalled();
        expect(nested1_2).not.toHaveBeenCalled();
        rafMock._flushQueue();
        expect(rafMock).toHaveBeenCalledTimes(prev + 6);
        expect(rafMock._getActiveCount()).toBe(1);
        for (const c of [callback1, callback2, nested1, nested2, nested3]) {
            expect(c).toHaveBeenCalledTimes(1);
        }
        expect(nested3).toHaveBeenCalledWith(expect.any(Number));
        expect(nested1_1).not.toHaveBeenCalled();
        expect(nested1_2).not.toHaveBeenCalled();
        rafMock._flushQueue();
        expect(rafMock).toHaveBeenCalledTimes(prev + 7);
        expect(rafMock._getActiveCount()).toBe(1);
        // prettier-ignore
        // eslint-disable-next-line max-len
        for (const c of [callback1, callback2, nested1, nested2, nested3, nested1_1]) {
            expect(c).toHaveBeenCalledTimes(1);
        }
        expect(nested1_1).toHaveBeenCalledWith(expect.any(Number));
        expect(nested1_2).not.toHaveBeenCalled();
        rafMock._flushQueue();
        expect(rafMock).toHaveBeenCalledTimes(prev + 8);
        expect(rafMock._getActiveCount()).toBe(1);
        // prettier-ignore
        // eslint-disable-next-line max-len
        for (const c of [callback1, callback2, nested1, nested2, nested3, nested1_1, nested1_2]) {
            expect(c).toHaveBeenCalledTimes(1)
        }
        expect(nested1_2).toHaveBeenCalledWith(expect.any(Number));
        expect(nested1_2_1).not.toHaveBeenCalled();
        rafMock._flushQueue();
        expect(rafMock).toHaveBeenCalledTimes(prev + 8);
        expect(rafMock._getActiveCount()).toBe(0);
        // prettier-ignore
        // eslint-disable-next-line max-len
        for (const c of [callback1, callback2, nested1, nested2, nested3, nested1_1, nested1_2, nested1_2_1]) {
            expect(c).toHaveBeenCalledTimes(1)
        }
        expect(nested1_2_1).toHaveBeenCalledWith(expect.any(Number));
    }

    // eslint-disable-next-line jest/expect-expect
    it('should schedule multiple nested callbacks in a queue one after another', () => {
        const scheduleAnimationFrameQueued = ScheduleAnimationFrameQueued();
        testScheduleMultipleNestedCallbacks(scheduleAnimationFrameQueued);
    });

    // eslint-disable-next-line jest/expect-expect
    it('should be able to nested schedule multiple times', () => {
        const scheduleAnimationFrameQueued = ScheduleAnimationFrameQueued();
        testScheduleMultipleNestedCallbacks(scheduleAnimationFrameQueued);
        testScheduleMultipleNestedCallbacks(scheduleAnimationFrameQueued);
        testScheduleMultipleNestedCallbacks(scheduleAnimationFrameQueued);
        testScheduleMultipleNestedCallbacks(scheduleAnimationFrameQueued);
        testScheduleMultipleNestedCallbacks(scheduleAnimationFrameQueued);
    });

    // eslint-disable-next-line jest/expect-expect
    it('should schedule again even if the previous one was cancelled', () => {
        const scheduleAnimationFrameQueued = ScheduleAnimationFrameQueued();
        const disposable = new Disposable();
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        scheduleAnimationFrameQueued(callback1);
        scheduleAnimationFrameQueued(callback2, disposable);
        rafMock._flushQueue();
        disposable.dispose();
        testScheduleMultipleNestedCallbacks(scheduleAnimationFrameQueued);
        testScheduleMultipleNestedCallbacks(scheduleAnimationFrameQueued);
        testScheduleMultipleNestedCallbacks(scheduleAnimationFrameQueued);
    });

    it('should not call rAF another time if the queue is flushed then scheduled synchronously', () => {
        const scheduleAnimationFrameQueued = ScheduleAnimationFrameQueued();
        const disposable = new Disposable();
        const nested = jest.fn();
        const callback1 = jest.fn(() => {
            disposable.dispose();
            scheduleAnimationFrameQueued(nested);
        });
        const callback2 = jest.fn();
        scheduleAnimationFrameQueued(callback1);
        scheduleAnimationFrameQueued(callback2, disposable);
        rafMock._flushQueue();
        expect(rafMock).toHaveBeenCalledTimes(2);
        expect(rafMock._getActiveCount()).toBe(1);
        expect(nested).not.toHaveBeenCalled();
        rafMock._flushQueue();
        expect(rafMock).toHaveBeenCalledTimes(2);
        expect(rafMock._getActiveCount()).toBe(0);
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).not.toHaveBeenCalled();
        expect(nested).toHaveBeenCalledTimes(1);
        expect(nested).toHaveBeenCalledWith(expect.any(Number));
    });

    it('should do nothing when cancelling after a callback has been called', () => {
        const scheduleAnimationFrameQueued = ScheduleAnimationFrameQueued();
        const disposable = new Disposable();
        const callback = jest.fn();
        scheduleAnimationFrameQueued(callback, disposable);
        rafMock._flushQueue();
        disposable.dispose();
        expect(rafMock).toHaveBeenCalledTimes(1);
        expect(rafMock._getActiveCount()).toBe(0);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should only cancel the nested callback whose subscription has been disposed', () => {
        const scheduleAnimationFrameQueued = ScheduleAnimationFrameQueued();
        const disposable = new Disposable();
        const nested1 = jest.fn();
        const nested2 = jest.fn();
        const nested3 = jest.fn();
        const callback = jest.fn(() => {
            scheduleAnimationFrameQueued(nested1);
            scheduleAnimationFrameQueued(nested2, disposable);
            scheduleAnimationFrameQueued(nested3);
            disposable.dispose();
        });
        scheduleAnimationFrameQueued(callback);
        rafMock._flushQueue();
        rafMock._flushQueue();
        rafMock._flushQueue();
        expect(rafMock).toHaveBeenCalledTimes(3);
        expect(rafMock._getActiveCount()).toBe(0);
        expect(nested2).not.toHaveBeenCalled();
        expect(callback).toHaveBeenCalledTimes(1);
        expect(nested1).toHaveBeenCalledTimes(1);
        expect(nested1).toHaveBeenCalledWith(expect.any(Number));
        expect(nested3).toHaveBeenCalledTimes(1);
        expect(nested3).toHaveBeenCalledWith(expect.any(Number));
    });

    it('should not schedule a nested callback when given a disposed disposable', () => {
        const scheduleAnimationFrameQueued = ScheduleAnimationFrameQueued();
        const disposable = new Disposable();
        disposable.dispose();
        const nested = jest.fn();
        const callback = jest.fn(() => {
            scheduleAnimationFrameQueued(nested, disposable);
        });
        scheduleAnimationFrameQueued(callback);
        rafMock._flushQueue();
        expect(rafMock).toHaveBeenCalledTimes(1);
        expect(rafMock._getActiveCount()).toBe(0);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(nested).not.toHaveBeenCalled();
    });

    it('should throw the error thrown by the main callback scheduled', () => {
        const scheduleAnimationFrameQueued = ScheduleAnimationFrameQueued();
        const throws = jest.fn(throw_('foo'));
        scheduleAnimationFrameQueued(throws);
        expect(rafMock._flushQueue).toThrow('foo');
        expect(throws).toHaveBeenCalledTimes(1);
        expect(rafMock).toHaveBeenCalledTimes(1);
        expect(rafMock._getActiveCount()).toBe(0);
    });

    it('should throw the error thrown by a nested callback', () => {
        const scheduleAnimationFrameQueued = ScheduleAnimationFrameQueued();
        const throws = jest.fn(throw_('foo'));
        const callback = jest.fn(() => {
            scheduleAnimationFrameQueued(throws);
        });
        scheduleAnimationFrameQueued(callback);
        rafMock._flushQueue();
        expect(rafMock._flushQueue).toThrow('foo');
        expect(callback).toHaveBeenCalledTimes(1);
        expect(throws).toHaveBeenCalledTimes(1);
        expect(rafMock).toHaveBeenCalledTimes(2);
        expect(rafMock._getActiveCount()).toBe(0);
    });

    it('should cancel queued callbacks when the main callback scheduled throws and allow more schedules after', () => {
        const scheduleAnimationFrameQueued = ScheduleAnimationFrameQueued();
        const nested1 = jest.fn();
        const nested2 = jest.fn();
        const callback = jest.fn(() => {
            scheduleAnimationFrameQueued(nested1);
            scheduleAnimationFrameQueued(nested2);
            throw_('foo')();
        });
        scheduleAnimationFrameQueued(callback);
        expect(() => rafMock._flushQueue()).toThrow('foo');
        expect(callback).toHaveBeenCalledTimes(1);
        expect(nested1).not.toHaveBeenCalled();
        expect(nested2).not.toHaveBeenCalled();
        expect(rafMock).toHaveBeenCalledTimes(1);
        expect(rafMock._getActiveCount()).toBe(0);
        testScheduleMultipleNestedCallbacks(scheduleAnimationFrameQueued);
        testScheduleMultipleNestedCallbacks(scheduleAnimationFrameQueued);
        testScheduleMultipleNestedCallbacks(scheduleAnimationFrameQueued);
    });

    it('should cancel queued callbacks when a nested callback throws and allow more schedules after', () => {
        const scheduleAnimationFrameQueued = ScheduleAnimationFrameQueued();
        const nested1_1 = jest.fn();
        const nested1 = jest.fn(() => {
            scheduleAnimationFrameQueued(nested1_1);
            throw_('foo')();
        });
        const nested2 = jest.fn();
        const callback = jest.fn(() => {
            scheduleAnimationFrameQueued(nested1);
            scheduleAnimationFrameQueued(nested2);
        });
        scheduleAnimationFrameQueued(callback);
        rafMock._flushQueue();
        expect(() => rafMock._flushQueue()).toThrow('foo');
        expect(callback).toHaveBeenCalledTimes(1);
        expect(nested1).toHaveBeenCalledTimes(1);
        expect(nested1_1).not.toHaveBeenCalled();
        expect(nested2).not.toHaveBeenCalled();
        expect(rafMock).toHaveBeenCalledTimes(2);
        expect(rafMock._getActiveCount()).toBe(0);
        testScheduleMultipleNestedCallbacks(scheduleAnimationFrameQueued);
        testScheduleMultipleNestedCallbacks(scheduleAnimationFrameQueued);
        testScheduleMultipleNestedCallbacks(scheduleAnimationFrameQueued);
    });
});

describe('ScheduleTimeout', () => {
    beforeEach(jest.useFakeTimers);
    afterEach(jest.useRealTimers);
    afterEach(jest.clearAllTimers);

    it('should be a function', () => {
        expect(ScheduleTimeout).toBeFunction();
    });

    it('should not call the callback immediately when the delay is not zero', () => {
        const callback = jest.fn();
        const scheduleTimeout = ScheduleTimeout(19);
        scheduleTimeout(callback);
        expect(callback).not.toHaveBeenCalled();
    });

    it('should not call the callback immediately when the delay is zero', () => {
        const callback = jest.fn();
        const scheduleTimeout = ScheduleTimeout(0);
        scheduleTimeout(callback);
        expect(callback).not.toHaveBeenCalled();
    });

    it('should call native setTimeout with the callback and delay', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const callback = () => {};
        const delay = 33;
        const scheduleTimeout = ScheduleTimeout(delay);
        scheduleTimeout(callback);
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenCalledWith(callback, delay);
    });

    it('should call native setTimeout with the callback and delay when given an active disposable', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const callback = () => {};
        const delay = 0;
        const disposable = new Disposable();
        const scheduleTimeout = ScheduleTimeout(delay);
        scheduleTimeout(callback, disposable);
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenCalledWith(callback, delay);
    });

    it('should not call native setTimeout when given a disposed disposable', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const callback = () => {};
        const disposable = new Disposable();
        disposable.dispose();
        const scheduleTimeout = ScheduleTimeout(13);
        scheduleTimeout(callback, disposable);
        expect(setTimeout).not.toHaveBeenCalled();
    });

    it('should support multiple schedules', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const callback1 = () => {};
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const callback2 = () => {};
        const delay = 4391;
        const scheduleTimeout = ScheduleTimeout(delay);
        scheduleTimeout(callback1);
        expect(setTimeout).toHaveBeenCalledTimes(1);
        scheduleTimeout(callback2);
        expect(setTimeout).toHaveBeenCalledTimes(2);
        expect(setTimeout).toHaveBeenNthCalledWith(2, callback2, delay);
        scheduleTimeout(callback1);
        expect(setTimeout).toHaveBeenCalledTimes(3);
        expect(setTimeout).toHaveBeenNthCalledWith(3, callback1, delay);
    });

    it('should cancel the scheduled callback when the given disposable is disposed', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const callback = () => {};
        const disposable = new Disposable();
        const scheduleTimeout = ScheduleTimeout(0);
        scheduleTimeout(callback, disposable);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const id: number = ((setTimeout as unknown) as jest.Mock).mock
            .results[0].value;
        disposable.dispose();
        expect(clearTimeout).toHaveBeenCalledTimes(1);
        expect(clearTimeout).toHaveBeenCalledWith(id);
    });
});

describe('ScheduleTimeoutQueued', () => {
    beforeEach(jest.useFakeTimers);
    afterEach(jest.useRealTimers);
    afterEach(jest.clearAllTimers);

    it('should be a function', () => {
        expect(ScheduleTimeoutQueued).toBeFunction();
    });

    it('should return a different instance each time', () => {
        expect(ScheduleTimeoutQueued(1)).not.toBe(ScheduleTimeoutQueued(1));
    });

    it('should use different queues for different instances', () => {
        const delay = 23;
        const scheduleTimeoutQueued1 = ScheduleTimeoutQueued(delay);
        const scheduleTimeoutQueued2 = ScheduleTimeoutQueued(delay);
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        scheduleTimeoutQueued1(callback1);
        scheduleTimeoutQueued2(callback2);
        jest.advanceTimersByTime(delay);
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenCalledTimes(2);
        // prettier-ignore
        // eslint-disable-next-line max-len
        expect(setTimeout).toHaveBeenNthCalledWith(1, expect.any(Function), delay)
        // prettier-ignore
        // eslint-disable-next-line max-len
        expect(setTimeout).toHaveBeenNthCalledWith(2, expect.any(Function), delay)
        expect(jest.getTimerCount()).toBe(0);
    });

    it('should not call the given callback immediately', () => {
        const scheduleTimeoutQueued = ScheduleTimeoutQueued(421);
        const callback = jest.fn();
        scheduleTimeoutQueued(callback);
        expect(callback).not.toHaveBeenCalled();
    });

    it('should not call the given callback immediately when the given delay is zero', () => {
        const scheduleTimeoutQueued = ScheduleTimeoutQueued(0);
        const callback = jest.fn();
        scheduleTimeoutQueued(callback);
        expect(callback).not.toHaveBeenCalled();
    });

    it('should schedule setTimeout with the given delay', () => {
        const delay = 29;
        const scheduleTimeoutQueued = ScheduleTimeoutQueued(delay);
        expect(setTimeout).not.toHaveBeenCalled();
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        scheduleTimeoutQueued(() => {});
        expect(jest.getTimerCount()).toBe(1);
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), delay);
    });

    it('should schedule setTimeout with the given delay when given an active disposable', () => {
        const delay = 0;
        const scheduleTimeoutQueued = ScheduleTimeoutQueued(delay);
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        scheduleTimeoutQueued(() => {}, new Disposable());
        expect(jest.getTimerCount()).toBe(1);
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), delay);
    });

    it('should do nothing when given a disposed disposable', () => {
        const scheduleTimeoutQueued = ScheduleTimeoutQueued(5);
        const disposed = new Disposable();
        disposed.dispose();
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        scheduleTimeoutQueued(() => {}, disposed);
        expect(jest.getTimerCount()).toBe(0);
        expect(setTimeout).not.toHaveBeenCalled();
    });

    it('should call setTimeout with a function calling the given callback', () => {
        const delay = 12;
        const scheduleTimeoutQueued = ScheduleTimeoutQueued(delay);
        const callback = jest.fn();
        scheduleTimeoutQueued(callback);
        jest.advanceTimersByTime(delay);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith();
    });

    it('should not call another setTimeout if only one callback is ever scheduled', () => {
        const delay = 41;
        const scheduleTimeoutQueued = ScheduleTimeoutQueued(delay);
        const callback = jest.fn();
        scheduleTimeoutQueued(callback);
        jest.advanceTimersByTime(delay);
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(jest.getTimerCount()).toBe(0);
    });

    it('should cancel the main scheduled callback when the given disposable is disposed', () => {
        const scheduleTimeoutQueued = ScheduleTimeoutQueued(51);
        const callback = jest.fn();
        const disposable = new Disposable();
        scheduleTimeoutQueued(callback, disposable);
        disposable.dispose();
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(jest.getTimerCount()).toBe(0);
        expect(callback).not.toHaveBeenCalled();
    });

    it('should call two consecutively scheduled callbacks in separate setTimeouts one after another', () => {
        const delay = 1;
        const scheduleTimeoutQueued = ScheduleTimeoutQueued(delay);
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        scheduleTimeoutQueued(callback1);
        scheduleTimeoutQueued(callback2);
        expect(jest.getTimerCount()).toBe(1);
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), delay);
        jest.advanceTimersByTime(delay);
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback1).toHaveBeenCalledWith();
        expect(callback2).not.toHaveBeenCalled();
        expect(jest.getTimerCount()).toBe(1);
        expect(setTimeout).toHaveBeenCalledTimes(2);
        // prettier-ignore
        // eslint-disable-next-line max-len
        expect(setTimeout).toHaveBeenNthCalledWith(2, expect.any(Function), delay)
        jest.advanceTimersByTime(delay);
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledWith();
        expect(jest.getTimerCount()).toBe(0);
        expect(setTimeout).toHaveBeenCalledTimes(2);
    });

    it('should be able to cancel top level callbacks', () => {
        const delay = 491;
        const scheduleTimeoutQueued = ScheduleTimeoutQueued(delay);
        const disposable1 = new Disposable();
        const disposable2 = new Disposable();
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        const callback3 = jest.fn();
        const callback4 = jest.fn();
        scheduleTimeoutQueued(callback1);
        scheduleTimeoutQueued(callback2, disposable1);
        scheduleTimeoutQueued(callback3);
        disposable1.dispose();
        scheduleTimeoutQueued(callback4, disposable2);
        disposable2.dispose();
        expect(jest.getTimerCount()).toBe(1);
        expect(setTimeout).toHaveBeenCalledTimes(1);
        jest.advanceTimersByTime(delay);
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback1).toHaveBeenCalledWith();
        expect(callback2).not.toHaveBeenCalled();
        expect(callback3).not.toHaveBeenCalled();
        expect(callback4).not.toHaveBeenCalled();
        expect(setTimeout).toHaveBeenCalledTimes(2);
        expect(jest.getTimerCount()).toBe(1);
        jest.advanceTimersByTime(delay);
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).not.toHaveBeenCalled();
        expect(callback3).toHaveBeenCalledTimes(1);
        expect(callback3).toHaveBeenCalledWith();
        expect(callback4).not.toHaveBeenCalled();
        expect(setTimeout).toHaveBeenCalledTimes(2);
        expect(jest.getTimerCount()).toBe(0);
    });

    it('should cancel the setTimeout if all top level callbacks are cancelled', () => {
        const scheduleTimeoutQueued = ScheduleTimeoutQueued(0);
        const disposable = new Disposable();
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        const callback3 = jest.fn();
        scheduleTimeoutQueued(callback1, disposable);
        scheduleTimeoutQueued(callback2, disposable);
        scheduleTimeoutQueued(callback3, disposable);
        disposable.dispose();
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(jest.getTimerCount()).toBe(0);
        expect(callback1).toHaveBeenCalledTimes(0);
        expect(callback2).toHaveBeenCalledTimes(0);
        expect(callback3).toHaveBeenCalledTimes(0);
    });

    it('should be able to cancel the setTimeout after a callback has been called', () => {
        const delay = 981032;
        const scheduleTimeoutQueued = ScheduleTimeoutQueued(delay);
        const disposable = new Disposable();
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        scheduleTimeoutQueued(callback1);
        scheduleTimeoutQueued(callback2, disposable);
        jest.advanceTimersByTime(delay);
        disposable.dispose();
        expect(setTimeout).toHaveBeenCalledTimes(2);
        expect(jest.getTimerCount()).toBe(0);
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).not.toHaveBeenCalled();
    });

    it('should schedule nested callbacks one after another', () => {
        const delay = 15;
        const scheduleTimeoutQueued = ScheduleTimeoutQueued(delay);
        const nested = jest.fn();
        const callback = jest.fn(() => {
            scheduleTimeoutQueued(nested);
        });
        scheduleTimeoutQueued(callback);
        jest.advanceTimersByTime(delay);
        expect(setTimeout).toHaveBeenCalledTimes(2);
        expect(jest.getTimerCount()).toBe(1);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(nested).not.toHaveBeenCalled();
        jest.advanceTimersByTime(delay);
        expect(setTimeout).toHaveBeenCalledTimes(2);
        expect(jest.getTimerCount()).toBe(0);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(nested).toHaveBeenCalledTimes(1);
        expect(nested).toHaveBeenCalledWith();
    });

    function testScheduleMultipleNestedCallbacks(
        scheduleTimeoutQueued: ScheduleFunction,
        delay: number,
    ): void {
        const prev = ((setTimeout as unknown) as jest.Mock).mock.calls.length;
        const adv = () => {
            if (delay === 0) {
                jest.runOnlyPendingTimers();
            } else {
                jest.advanceTimersByTime(delay);
            }
        };
        const nested1_1 = jest.fn();
        const nested1_2_1 = jest.fn();
        const nested1_2 = jest.fn(() => {
            scheduleTimeoutQueued(nested1_2_1);
        });
        const nested1 = jest.fn(() => {
            scheduleTimeoutQueued(nested1_1);
            scheduleTimeoutQueued(nested1_2);
        });
        const nested2 = jest.fn();
        const nested3 = jest.fn();
        const callback1 = jest.fn(() => {
            scheduleTimeoutQueued(nested1);
            scheduleTimeoutQueued(nested2);
            scheduleTimeoutQueued(nested3);
        });
        const callback2 = jest.fn();
        scheduleTimeoutQueued(callback1);
        scheduleTimeoutQueued(callback2);
        expect(setTimeout).toHaveBeenCalledTimes(prev + 1);
        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), delay);
        expect(jest.getTimerCount()).toBe(1);
        adv();
        expect(setTimeout).toHaveBeenCalledTimes(prev + 2);
        expect(jest.getTimerCount()).toBe(1);
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback1).toHaveBeenCalledWith();
        expect(callback2).not.toHaveBeenCalled();
        expect(nested1).not.toHaveBeenCalled();
        expect(nested2).not.toHaveBeenCalled();
        expect(nested3).not.toHaveBeenCalled();
        adv();
        expect(setTimeout).toHaveBeenCalledTimes(prev + 3);
        expect(jest.getTimerCount()).toBe(1);
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledWith();
        expect(nested1).not.toHaveBeenCalled();
        expect(nested2).not.toHaveBeenCalled();
        expect(nested3).not.toHaveBeenCalled();
        adv();
        expect(setTimeout).toHaveBeenCalledTimes(prev + 4);
        expect(jest.getTimerCount()).toBe(1);
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledTimes(1);
        expect(nested1).toHaveBeenCalledTimes(1);
        expect(nested1).toHaveBeenCalledWith();
        for (const c of [nested2, nested3, nested1_1, nested1_2]) {
            expect(c).not.toHaveBeenCalled();
        }
        adv();
        expect(setTimeout).toHaveBeenCalledTimes(prev + 5);
        expect(jest.getTimerCount()).toBe(1);
        for (const c of [callback1, callback2, nested1, nested2]) {
            expect(c).toHaveBeenCalledTimes(1);
        }
        expect(nested2).toHaveBeenCalledWith();
        expect(nested3).not.toHaveBeenCalled();
        expect(nested1_1).not.toHaveBeenCalled();
        expect(nested1_2).not.toHaveBeenCalled();
        adv();
        expect(setTimeout).toHaveBeenCalledTimes(prev + 6);
        expect(jest.getTimerCount()).toBe(1);
        for (const c of [callback1, callback2, nested1, nested2, nested3]) {
            expect(c).toHaveBeenCalledTimes(1);
        }
        expect(nested3).toHaveBeenCalledWith();
        expect(nested1_1).not.toHaveBeenCalled();
        expect(nested1_2).not.toHaveBeenCalled();
        adv();
        expect(setTimeout).toHaveBeenCalledTimes(prev + 7);
        expect(jest.getTimerCount()).toBe(1);
        // prettier-ignore
        // eslint-disable-next-line max-len
        for (const c of [callback1, callback2, nested1, nested2, nested3, nested1_1]) {
            expect(c).toHaveBeenCalledTimes(1);
        }
        expect(nested1_1).toHaveBeenCalledWith();
        expect(nested1_2).not.toHaveBeenCalled();
        adv();
        expect(setTimeout).toHaveBeenCalledTimes(prev + 8);
        expect(jest.getTimerCount()).toBe(1);
        // prettier-ignore
        // eslint-disable-next-line max-len
        for (const c of [callback1, callback2, nested1, nested2, nested3, nested1_1, nested1_2]) {
            expect(c).toHaveBeenCalledTimes(1)
        }
        expect(nested1_2).toHaveBeenCalledWith();
        expect(nested1_2_1).not.toHaveBeenCalled();
        adv();
        expect(setTimeout).toHaveBeenCalledTimes(prev + 8);
        expect(jest.getTimerCount()).toBe(0);
        // prettier-ignore
        // eslint-disable-next-line max-len
        for (const c of [callback1, callback2, nested1, nested2, nested3, nested1_1, nested1_2, nested1_2_1]) {
            expect(c).toHaveBeenCalledTimes(1)
        }
        expect(nested1_2_1).toHaveBeenCalledWith();
    }

    // eslint-disable-next-line jest/expect-expect
    it('should schedule multiple nested callbacks in a queue one after another', () => {
        const delay = 43;
        const scheduleTimeoutQueued = ScheduleTimeoutQueued(delay);
        testScheduleMultipleNestedCallbacks(scheduleTimeoutQueued, delay);
    });

    // eslint-disable-next-line jest/expect-expect
    it('should be able to nested schedule multiple times', () => {
        const delay = 12;
        const scheduleTimeoutQueued = ScheduleTimeoutQueued(delay);
        testScheduleMultipleNestedCallbacks(scheduleTimeoutQueued, delay);
        testScheduleMultipleNestedCallbacks(scheduleTimeoutQueued, delay);
        testScheduleMultipleNestedCallbacks(scheduleTimeoutQueued, delay);
        testScheduleMultipleNestedCallbacks(scheduleTimeoutQueued, delay);
        testScheduleMultipleNestedCallbacks(scheduleTimeoutQueued, delay);
    });

    // eslint-disable-next-line jest/expect-expect
    it('should schedule again even if the previous one was cancelled', () => {
        const delay = 0;
        const scheduleTimeoutQueued = ScheduleTimeoutQueued(delay);
        const disposable = new Disposable();
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        scheduleTimeoutQueued(callback1);
        scheduleTimeoutQueued(callback2, disposable);
        jest.runOnlyPendingTimers();
        disposable.dispose();
        testScheduleMultipleNestedCallbacks(scheduleTimeoutQueued, delay);
        testScheduleMultipleNestedCallbacks(scheduleTimeoutQueued, delay);
        testScheduleMultipleNestedCallbacks(scheduleTimeoutQueued, delay);
    });

    it('should not schedule an additional setTimeout if the queue is flushed then scheduled synchronously', () => {
        const delay = 19;
        const scheduleTimeoutQueued = ScheduleTimeoutQueued(delay);
        const disposable = new Disposable();
        const nested = jest.fn();
        const callback1 = jest.fn(() => {
            disposable.dispose();
            scheduleTimeoutQueued(nested);
        });
        const callback2 = jest.fn();
        scheduleTimeoutQueued(callback1);
        scheduleTimeoutQueued(callback2, disposable);
        jest.advanceTimersByTime(delay);
        expect(setTimeout).toHaveBeenCalledTimes(2);
        expect(jest.getTimerCount()).toBe(1);
        expect(nested).not.toHaveBeenCalled();
        jest.advanceTimersByTime(delay);
        expect(setTimeout).toHaveBeenCalledTimes(2);
        expect(jest.getTimerCount()).toBe(0);
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).not.toHaveBeenCalled();
        expect(nested).toHaveBeenCalledTimes(1);
        expect(nested).toHaveBeenCalledWith();
    });

    it('should do nothing when cancelling after a callback has been called', () => {
        const delay = 19;
        const scheduleTimeoutQueued = ScheduleTimeoutQueued(delay);
        const disposable = new Disposable();
        const callback = jest.fn();
        scheduleTimeoutQueued(callback, disposable);
        jest.advanceTimersByTime(delay);
        disposable.dispose();
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(jest.getTimerCount()).toBe(0);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should only cancel the nested callback whose subscription has been disposed', () => {
        const delay = 1000;
        const scheduleTimeoutQueued = ScheduleTimeoutQueued(delay);
        const disposable = new Disposable();
        const nested1 = jest.fn();
        const nested2 = jest.fn();
        const nested3 = jest.fn();
        const callback = jest.fn(() => {
            scheduleTimeoutQueued(nested1);
            scheduleTimeoutQueued(nested2, disposable);
            scheduleTimeoutQueued(nested3);
            disposable.dispose();
        });
        scheduleTimeoutQueued(callback);
        jest.advanceTimersByTime(delay * 3);
        expect(setTimeout).toHaveBeenCalledTimes(3);
        expect(jest.getTimerCount()).toBe(0);
        expect(nested2).not.toHaveBeenCalled();
        expect(callback).toHaveBeenCalledTimes(1);
        expect(nested1).toHaveBeenCalledTimes(1);
        expect(nested1).toHaveBeenCalledWith();
        expect(nested3).toHaveBeenCalledTimes(1);
        expect(nested3).toHaveBeenCalledWith();
    });

    it('should not schedule a nested callback when given a disposed disposable', () => {
        const delay = 400;
        const scheduleTimeoutQueued = ScheduleTimeoutQueued(delay);
        const disposable = new Disposable();
        disposable.dispose();
        const nested = jest.fn();
        const callback = jest.fn(() => {
            scheduleTimeoutQueued(nested, disposable);
        });
        scheduleTimeoutQueued(callback);
        jest.advanceTimersByTime(delay);
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(jest.getTimerCount()).toBe(0);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(nested).not.toHaveBeenCalled();
    });

    it('should throw the error thrown by the main callback scheduled', () => {
        const delay = 491;
        const scheduleTimeoutQueued = ScheduleTimeoutQueued(delay);
        const throws = jest.fn(throw_('foo'));
        scheduleTimeoutQueued(throws);
        expect(() => jest.advanceTimersByTime(delay)).toThrow('foo');
        expect(throws).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(jest.getTimerCount()).toBe(0);
    });

    it('should throw the error thrown by a nested callback', () => {
        const scheduleTimeoutQueued = ScheduleTimeoutQueued(0);
        const throws = jest.fn(throw_('foo'));
        const callback = jest.fn(() => {
            scheduleTimeoutQueued(throws);
        });
        scheduleTimeoutQueued(callback);
        jest.runOnlyPendingTimers();
        expect(jest.runOnlyPendingTimers).toThrow('foo');
        expect(callback).toHaveBeenCalledTimes(1);
        expect(throws).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenCalledTimes(2);
        expect(jest.getTimerCount()).toBe(0);
    });

    it('should cancel queued callbacks when the main callback scheduled throws and allow more schedules after', () => {
        const delay = 51;
        const scheduleTimeoutQueued = ScheduleTimeoutQueued(delay);
        const nested1 = jest.fn();
        const nested2 = jest.fn();
        const callback = jest.fn(() => {
            scheduleTimeoutQueued(nested1);
            scheduleTimeoutQueued(nested2);
            throw_('foo')();
        });
        scheduleTimeoutQueued(callback);
        expect(() => jest.advanceTimersByTime(delay)).toThrow('foo');
        expect(callback).toHaveBeenCalledTimes(1);
        expect(nested1).not.toHaveBeenCalled();
        expect(nested2).not.toHaveBeenCalled();
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(jest.getTimerCount()).toBe(0);
        testScheduleMultipleNestedCallbacks(scheduleTimeoutQueued, delay);
        testScheduleMultipleNestedCallbacks(scheduleTimeoutQueued, delay);
        testScheduleMultipleNestedCallbacks(scheduleTimeoutQueued, delay);
    });

    it('should cancel queued callbacks when a nested callback throws and allow more schedules after', () => {
        const delay = 721;
        const scheduleTimeoutQueued = ScheduleTimeoutQueued(delay);
        const nested1_1 = jest.fn();
        const nested1 = jest.fn(() => {
            scheduleTimeoutQueued(nested1_1);
            throw_('foo')();
        });
        const nested2 = jest.fn();
        const callback = jest.fn(() => {
            scheduleTimeoutQueued(nested1);
            scheduleTimeoutQueued(nested2);
        });
        scheduleTimeoutQueued(callback);
        jest.advanceTimersByTime(delay);
        expect(() => jest.advanceTimersByTime(delay)).toThrow('foo');
        expect(callback).toHaveBeenCalledTimes(1);
        expect(nested1).toHaveBeenCalledTimes(1);
        expect(nested1_1).not.toHaveBeenCalled();
        expect(nested2).not.toHaveBeenCalled();
        expect(setTimeout).toHaveBeenCalledTimes(2);
        expect(jest.getTimerCount()).toBe(0);
        testScheduleMultipleNestedCallbacks(scheduleTimeoutQueued, delay);
        testScheduleMultipleNestedCallbacks(scheduleTimeoutQueued, delay);
        testScheduleMultipleNestedCallbacks(scheduleTimeoutQueued, delay);
    });
});

describe('ScheduleInterval', () => {
    beforeEach(jest.useFakeTimers);
    afterEach(jest.useRealTimers);
    afterEach(jest.clearAllTimers);

    it('should be a function', () => {
        expect(ScheduleInterval).toBeFunction();
    });

    it('should return a different instance each time', () => {
        expect(ScheduleInterval(1)).not.toBe(ScheduleInterval(1));
    });

    it('should use different queues for different instances', () => {
        const delay = 4;
        const scheduleInterval1 = ScheduleInterval(delay);
        const scheduleInterval2 = ScheduleInterval(delay);
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        scheduleInterval1(callback1);
        scheduleInterval2(callback2);
        jest.advanceTimersByTime(delay);
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledTimes(1);
        expect(setInterval).toHaveBeenCalledTimes(2);
        // prettier-ignore
        // eslint-disable-next-line max-len
        expect(setInterval).toHaveBeenNthCalledWith(1, expect.any(Function), delay)
        // prettier-ignore
        // eslint-disable-next-line max-len
        expect(setInterval).toHaveBeenNthCalledWith(2, expect.any(Function), delay)
        expect(jest.getTimerCount()).toBe(0);
    });

    it('should not call the given callback immediately', () => {
        const scheduleInterval = ScheduleInterval(291);
        const callback = jest.fn();
        scheduleInterval(callback);
        expect(callback).not.toHaveBeenCalled();
    });

    it('should not call the callback immediately when given zero delay', () => {
        const scheduleInterval = ScheduleInterval(0);
        const callback = jest.fn();
        scheduleInterval(callback);
        expect(callback).not.toHaveBeenCalled();
    });

    it('should not call setTimeout', () => {
        const scheduleInterval = ScheduleInterval(39);
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        scheduleInterval(() => {});
        expect(setTimeout).not.toHaveBeenCalled();
    });

    it('should schedule an interval with the given delay', () => {
        const delay = 429;
        const scheduleInterval = ScheduleInterval(delay);
        expect(setInterval).not.toBeCalled();
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        scheduleInterval(() => {});
        expect(jest.getTimerCount()).toBe(1);
        expect(setInterval).toHaveBeenCalledTimes(1);
        expect(setInterval).toHaveBeenCalledWith(expect.any(Function), delay);
    });

    it('should schedule an interval with the given delay when given an active disposable', () => {
        const delay = 429;
        const scheduleInterval = ScheduleInterval(delay);
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        scheduleInterval(() => {}, new Disposable());
        expect(jest.getTimerCount()).toBe(1);
        expect(setInterval).toHaveBeenCalledTimes(1);
        expect(setInterval).toHaveBeenCalledWith(expect.any(Function), delay);
    });

    it('should do nothing when given a disposed disposable', () => {
        const scheduleInterval = ScheduleInterval(19423);
        const callback = jest.fn();
        const disposed = new Disposable();
        disposed.dispose();
        scheduleInterval(callback, disposed);
        expect(callback).not.toHaveBeenCalled();
        expect(setInterval).not.toHaveBeenCalled();
        expect(jest.getTimerCount()).toBe(0);
    });

    it('should schedule an interval with a function calling the given callback', () => {
        const callback = jest.fn();
        const delay = 19;
        const scheduleInterval = ScheduleInterval(delay);
        scheduleInterval(callback);
        jest.advanceTimersByTime(delay);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith();
    });

    it('should cancel the scheduled interval if only one callback is ever scheduled', () => {
        const callback = jest.fn();
        const delay = 19;
        const scheduleInterval = ScheduleInterval(delay);
        scheduleInterval(callback);
        jest.advanceTimersByTime(delay);
        expect(jest.getTimerCount()).toBe(0);
    });

    it('should cancel the main scheduled callback when the given disposable is disposed', () => {
        const callback = jest.fn();
        const disposable = new Disposable();
        const scheduleInterval = ScheduleInterval(299);
        scheduleInterval(callback, disposable);
        disposable.dispose();
        expect(jest.getTimerCount()).toBe(0);
        expect(callback).not.toHaveBeenCalled();
    });

    it('should call two consecutively scheduled callbacks in the same interval', () => {
        const delay = 1;
        const scheduleInterval = ScheduleInterval(delay);
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        scheduleInterval(callback1);
        scheduleInterval(callback2);
        expect(jest.getTimerCount()).toBe(1);
        expect(setInterval).toHaveBeenCalledTimes(1);
        jest.advanceTimersByTime(delay);
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback1).toHaveBeenCalledWith();
        expect(callback2).not.toHaveBeenCalled();
        expect(jest.getTimerCount()).toBe(1);
        expect(setInterval).toHaveBeenCalledTimes(1);
        jest.advanceTimersByTime(delay);
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledWith();
        expect(jest.getTimerCount()).toBe(0);
    });

    it('should be able to cancel top level callbacks', () => {
        const delay = 423;
        const scheduleInterval = ScheduleInterval(delay);
        const disposable1 = new Disposable();
        const disposable2 = new Disposable();
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        const callback3 = jest.fn();
        const callback4 = jest.fn();
        scheduleInterval(callback1);
        scheduleInterval(callback2, disposable1);
        scheduleInterval(callback3);
        disposable1.dispose();
        scheduleInterval(callback4, disposable2);
        disposable2.dispose();
        expect(jest.getTimerCount()).toBe(1);
        expect(setInterval).toHaveBeenCalledTimes(1);
        jest.advanceTimersByTime(delay);
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback1).toHaveBeenCalledWith();
        expect(callback2).not.toHaveBeenCalled();
        expect(callback3).not.toHaveBeenCalled();
        expect(callback4).not.toHaveBeenCalled();
        expect(jest.getTimerCount()).toBe(1);
        expect(setInterval).toHaveBeenCalledTimes(1);
        jest.advanceTimersByTime(delay);
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).not.toHaveBeenCalled();
        expect(callback3).toHaveBeenCalledTimes(1);
        expect(callback3).toHaveBeenCalledWith();
        expect(callback4).not.toHaveBeenCalled();
        expect(jest.getTimerCount()).toBe(0);
    });

    it('should cancel the interval if all top level callbacks are cancelled', () => {
        const scheduleInterval = ScheduleInterval(0);
        const disposable = new Disposable();
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        const callback3 = jest.fn();
        scheduleInterval(callback1, disposable);
        scheduleInterval(callback2, disposable);
        scheduleInterval(callback3, disposable);
        disposable.dispose();
        expect(setInterval).toHaveBeenCalledTimes(1);
        expect(jest.getTimerCount()).toBe(0);
        expect(callback1).toHaveBeenCalledTimes(0);
        expect(callback2).toHaveBeenCalledTimes(0);
        expect(callback3).toHaveBeenCalledTimes(0);
    });

    it('should be able to cancel mid interval', () => {
        const delay = 29304;
        const scheduleInterval = ScheduleInterval(delay);
        const disposable = new Disposable();
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        scheduleInterval(callback1);
        scheduleInterval(callback2, disposable);
        jest.advanceTimersByTime(delay);
        disposable.dispose();
        expect(setInterval).toHaveBeenCalledTimes(1);
        expect(jest.getTimerCount()).toBe(0);
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).not.toHaveBeenCalled();
    });

    it('should schedule nested callbacks to the same interval', () => {
        const delay = 15;
        const scheduleInterval = ScheduleInterval(delay);
        const nested = jest.fn();
        const callback = jest.fn(() => {
            scheduleInterval(nested);
        });
        scheduleInterval(callback);
        jest.advanceTimersByTime(delay);
        expect(setInterval).toHaveBeenCalledTimes(1);
        expect(jest.getTimerCount()).toBe(1);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(nested).not.toHaveBeenCalled();
        jest.advanceTimersByTime(delay);
        expect(setInterval).toHaveBeenCalledTimes(1);
        expect(jest.getTimerCount()).toBe(0);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(nested).toHaveBeenCalledTimes(1);
        expect(nested).toHaveBeenCalledWith();
    });

    function testScheduleMultipleNestedCallbacks(
        scheduleInterval: ScheduleFunction,
        delay: number,
    ): void {
        const prev = (setInterval as jest.Mock).mock.calls.length;
        const adv = () => {
            if (delay === 0) {
                jest.runOnlyPendingTimers();
            } else {
                jest.advanceTimersByTime(delay);
            }
        };
        const nested1_1 = jest.fn();
        const nested1_2_1 = jest.fn();
        const nested1_2 = jest.fn(() => {
            scheduleInterval(nested1_2_1);
        });
        const nested1 = jest.fn(() => {
            scheduleInterval(nested1_1);
            scheduleInterval(nested1_2);
        });
        const nested2 = jest.fn();
        const nested3 = jest.fn();
        const callback1 = jest.fn(() => {
            scheduleInterval(nested1);
            scheduleInterval(nested2);
            scheduleInterval(nested3);
        });
        const callback2 = jest.fn();
        scheduleInterval(callback1);
        scheduleInterval(callback2);
        expect(jest.getTimerCount()).toBe(1);
        adv();
        expect(setInterval).toHaveBeenCalledTimes(prev + 1);
        expect(jest.getTimerCount()).toBe(1);
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback1).toHaveBeenCalledWith();
        expect(callback2).not.toHaveBeenCalled();
        expect(nested1).not.toHaveBeenCalled();
        expect(nested2).not.toHaveBeenCalled();
        expect(nested3).not.toHaveBeenCalled();
        adv();
        expect(setInterval).toHaveBeenCalledTimes(prev + 1);
        expect(jest.getTimerCount()).toBe(1);
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledWith();
        expect(nested1).not.toHaveBeenCalled();
        expect(nested2).not.toHaveBeenCalled();
        expect(nested3).not.toHaveBeenCalled();
        adv();
        expect(setInterval).toHaveBeenCalledTimes(prev + 1);
        expect(jest.getTimerCount()).toBe(1);
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledTimes(1);
        expect(nested1).toHaveBeenCalledTimes(1);
        expect(nested1).toHaveBeenCalledWith();
        for (const c of [nested2, nested3, nested1_1, nested1_2]) {
            expect(c).not.toHaveBeenCalled();
        }
        adv();
        expect(setInterval).toHaveBeenCalledTimes(prev + 1);
        expect(jest.getTimerCount()).toBe(1);
        for (const c of [callback1, callback2, nested1, nested2]) {
            expect(c).toHaveBeenCalledTimes(1);
        }
        expect(nested2).toHaveBeenCalledWith();
        expect(nested3).not.toHaveBeenCalled();
        expect(nested1_1).not.toHaveBeenCalled();
        expect(nested1_2).not.toHaveBeenCalled();
        adv();
        expect(setInterval).toHaveBeenCalledTimes(prev + 1);
        expect(jest.getTimerCount()).toBe(1);
        for (const c of [callback1, callback2, nested1, nested2, nested3]) {
            expect(c).toHaveBeenCalledTimes(1);
        }
        expect(nested3).toHaveBeenCalledWith();
        expect(nested1_1).not.toHaveBeenCalled();
        expect(nested1_2).not.toHaveBeenCalled();
        adv();
        expect(setInterval).toHaveBeenCalledTimes(prev + 1);
        expect(jest.getTimerCount()).toBe(1);
        // prettier-ignore
        // eslint-disable-next-line max-len
        for (const c of [callback1, callback2, nested1, nested2, nested3, nested1_1]) {
            expect(c).toHaveBeenCalledTimes(1);
        }
        expect(nested1_1).toHaveBeenCalledWith();
        expect(nested1_2).not.toHaveBeenCalled();
        adv();
        expect(setInterval).toHaveBeenCalledTimes(prev + 1);
        expect(jest.getTimerCount()).toBe(1);
        // prettier-ignore
        // eslint-disable-next-line max-len
        for (const c of [callback1, callback2, nested1, nested2, nested3, nested1_1, nested1_2]) {
            expect(c).toHaveBeenCalledTimes(1)
        }
        expect(nested1_2).toHaveBeenCalledWith();
        expect(nested1_2_1).not.toHaveBeenCalled();
        adv();
        expect(setInterval).toHaveBeenCalledTimes(prev + 1);
        expect(jest.getTimerCount()).toBe(0);
        // prettier-ignore
        // eslint-disable-next-line max-len
        for (const c of [callback1, callback2, nested1, nested2, nested3, nested1_1, nested1_2, nested1_2_1]) {
            expect(c).toHaveBeenCalledTimes(1)
        }
        expect(nested1_2_1).toHaveBeenCalledWith();
    }

    // eslint-disable-next-line jest/expect-expect
    it('should schedule multiple nested callbacks to the same interval', () => {
        const delay = 43;
        const scheduleInterval = ScheduleInterval(delay);
        testScheduleMultipleNestedCallbacks(scheduleInterval, delay);
    });

    // eslint-disable-next-line jest/expect-expect
    it('should be able to nested schedule multiple times', () => {
        const delay = 12;
        const scheduleInterval = ScheduleInterval(delay);
        testScheduleMultipleNestedCallbacks(scheduleInterval, delay);
        testScheduleMultipleNestedCallbacks(scheduleInterval, delay);
        testScheduleMultipleNestedCallbacks(scheduleInterval, delay);
        testScheduleMultipleNestedCallbacks(scheduleInterval, delay);
        testScheduleMultipleNestedCallbacks(scheduleInterval, delay);
    });

    // eslint-disable-next-line jest/expect-expect
    it('should be able to schedule a new interval if the previous one was cancelled', () => {
        const delay = 0;
        const scheduleInterval = ScheduleInterval(delay);
        const disposable = new Disposable();
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        scheduleInterval(callback1);
        scheduleInterval(callback2, disposable);
        jest.runOnlyPendingTimers();
        disposable.dispose();
        testScheduleMultipleNestedCallbacks(scheduleInterval, delay);
        testScheduleMultipleNestedCallbacks(scheduleInterval, delay);
        testScheduleMultipleNestedCallbacks(scheduleInterval, delay);
    });

    it('should not cancel the interval if the queue is flushed then scheduled synchronously', () => {
        const delay = 19;
        const scheduleInterval = ScheduleInterval(delay);
        const disposable = new Disposable();
        const nested = jest.fn();
        const callback1 = jest.fn(() => {
            disposable.dispose();
            scheduleInterval(nested);
        });
        const callback2 = jest.fn();
        scheduleInterval(callback1);
        scheduleInterval(callback2, disposable);
        jest.advanceTimersByTime(delay);
        expect(setInterval).toHaveBeenCalledTimes(1);
        expect(jest.getTimerCount()).toBe(1);
        expect(nested).not.toHaveBeenCalled();
        jest.advanceTimersByTime(delay);
        expect(setInterval).toHaveBeenCalledTimes(1);
        expect(jest.getTimerCount()).toBe(0);
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).not.toHaveBeenCalled();
        expect(nested).toHaveBeenCalledTimes(1);
        expect(nested).toHaveBeenCalledWith();
    });

    it('should do nothing when cancelling after a callback has been called', () => {
        const delay = 19;
        const scheduleInterval = ScheduleInterval(delay);
        const disposable = new Disposable();
        const callback = jest.fn();
        scheduleInterval(callback, disposable);
        jest.advanceTimersByTime(delay);
        disposable.dispose();
        expect(setInterval).toHaveBeenCalledTimes(1);
        expect(jest.getTimerCount()).toBe(0);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should only cancel the nested callback whose subscription has been disposed', () => {
        const delay = 1000;
        const scheduleInterval = ScheduleInterval(delay);
        const disposable = new Disposable();
        const nested1 = jest.fn();
        const nested2 = jest.fn();
        const nested3 = jest.fn();
        const callback = jest.fn(() => {
            scheduleInterval(nested1);
            scheduleInterval(nested2, disposable);
            scheduleInterval(nested3);
            disposable.dispose();
        });
        scheduleInterval(callback);
        jest.advanceTimersByTime(delay * 3);
        expect(setInterval).toHaveBeenCalledTimes(1);
        expect(jest.getTimerCount()).toBe(0);
        expect(nested2).not.toHaveBeenCalled();
        expect(callback).toHaveBeenCalledTimes(1);
        expect(nested1).toHaveBeenCalledTimes(1);
        expect(nested1).toHaveBeenCalledWith();
        expect(nested3).toHaveBeenCalledTimes(1);
        expect(nested3).toHaveBeenCalledWith();
    });

    it('should not schedule a nested callback when given a disposed disposable', () => {
        const delay = 400;
        const scheduleInterval = ScheduleInterval(delay);
        const disposable = new Disposable();
        disposable.dispose();
        const nested = jest.fn();
        const callback = jest.fn(() => {
            scheduleInterval(nested, disposable);
        });
        scheduleInterval(callback);
        jest.advanceTimersByTime(delay);
        expect(setInterval).toHaveBeenCalledTimes(1);
        expect(jest.getTimerCount()).toBe(0);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(nested).not.toHaveBeenCalled();
    });

    it('should throw the error thrown by the main callback scheduled and cancel the interval', () => {
        const delay = 491;
        const scheduleInterval = ScheduleInterval(delay);
        const throws = jest.fn(throw_('foo'));
        scheduleInterval(throws);
        expect(() => jest.advanceTimersByTime(delay)).toThrow('foo');
        expect(throws).toHaveBeenCalledTimes(1);
        expect(setInterval).toHaveBeenCalledTimes(1);
        expect(jest.getTimerCount()).toBe(0);
    });

    it('should throw the error thrown by a nested callback', () => {
        const scheduleInterval = ScheduleInterval(0);
        const throws = jest.fn(throw_('foo'));
        const callback = jest.fn(() => {
            scheduleInterval(throws);
        });
        scheduleInterval(callback);
        jest.runOnlyPendingTimers();
        expect(jest.runOnlyPendingTimers).toThrow('foo');
        expect(callback).toHaveBeenCalledTimes(1);
        expect(throws).toHaveBeenCalledTimes(1);
        expect(setInterval).toHaveBeenCalledTimes(1);
        expect(jest.getTimerCount()).toBe(0);
    });

    it('should cancel queued callbacks when the main callback scheduled throws and allow more schedules after', () => {
        const delay = 51;
        const scheduleInterval = ScheduleInterval(delay);
        const nested1 = jest.fn();
        const nested2 = jest.fn();
        const callback = jest.fn(() => {
            scheduleInterval(nested1);
            scheduleInterval(nested2);
            throw_('foo')();
        });
        scheduleInterval(callback);
        expect(() => jest.advanceTimersByTime(delay)).toThrow('foo');
        expect(callback).toHaveBeenCalledTimes(1);
        expect(nested1).not.toHaveBeenCalled();
        expect(nested2).not.toHaveBeenCalled();
        expect(setInterval).toHaveBeenCalledTimes(1);
        expect(jest.getTimerCount()).toBe(0);
        testScheduleMultipleNestedCallbacks(scheduleInterval, delay);
        testScheduleMultipleNestedCallbacks(scheduleInterval, delay);
        testScheduleMultipleNestedCallbacks(scheduleInterval, delay);
    });

    it('should cancel queued callbacks when a nested callback throws and allow more schedules after', () => {
        const delay = 721;
        const scheduleInterval = ScheduleInterval(delay);
        const nested1_1 = jest.fn();
        const nested1 = jest.fn(() => {
            scheduleInterval(nested1_1);
            throw_('foo')();
        });
        const nested2 = jest.fn();
        const callback = jest.fn(() => {
            scheduleInterval(nested1);
            scheduleInterval(nested2);
        });
        scheduleInterval(callback);
        jest.advanceTimersByTime(delay);
        expect(() => jest.advanceTimersByTime(delay)).toThrow('foo');
        expect(callback).toHaveBeenCalledTimes(1);
        expect(nested1).toHaveBeenCalledTimes(1);
        expect(nested1_1).not.toHaveBeenCalled();
        expect(nested2).not.toHaveBeenCalled();
        expect(setInterval).toHaveBeenCalledTimes(1);
        expect(jest.getTimerCount()).toBe(0);
        testScheduleMultipleNestedCallbacks(scheduleInterval, delay);
        testScheduleMultipleNestedCallbacks(scheduleInterval, delay);
        testScheduleMultipleNestedCallbacks(scheduleInterval, delay);
    });
});

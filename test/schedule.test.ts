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
} from '../src/schedule';
import { Disposable } from '../src/disposable';
import { throw_ } from './testUtils';

describe('ScheduleQueued', () => {
    it('should exist', () => {
        expect(ScheduleQueued).toBeFunction();
    });
});

describe('ScheduleQueuedDiscrete', () => {
    it('should exist', () => {
        expect(ScheduleQueuedDiscrete).toBeFunction();
    });
});

describe('scheduleSync', () => {
    it('should exist', () => {
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
});

describe('ScheduleSyncQueued', () => {
    it('should exist', () => {
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
    it('should exist', () => {
        expect(scheduleAnimationFrame).toBeFunction();
    });
});

describe('ScheduleAnimationFrameQueued', () => {
    it('should exist', () => {
        expect(ScheduleAnimationFrameQueued).toBeFunction();
    });
});

describe('ScheduleTimeout', () => {
    it('should exist', () => {
        expect(ScheduleTimeout).toBeFunction();
    });
});

describe('ScheduleTimeoutQueued', () => {
    it('should exist', () => {
        expect(ScheduleTimeoutQueued).toBeFunction();
    });
});

describe('ScheduleInterval', () => {
    it('should exist', () => {
        expect(ScheduleInterval).toBeFunction();
    });
});

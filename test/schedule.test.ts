import {
    scheduleSync,
    ScheduleSyncQueued,
    scheduleSyncQueued,
    ScheduleQueued,
    scheduleAnimationFrame,
    ScheduleAnimationFrameQueued,
    scheduleAnimationFrameQueued,
    scheduleMicrotask,
    ScheduleTimeout,
    ScheduleTimeoutQueued,
    ScheduleInterval,
} from '../src/schedule';
import { Disposable } from '../src/disposable';

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
        expect(callback).toHaveBeenCalledTimes(0);
    });
});

describe('ScheduleSyncQueued', () => {
    it('should exist', () => {
        expect(ScheduleSyncQueued).toBeFunction();
    });
});

describe('scheduleSyncQueued', () => {
    it('should exist', () => {
        expect(scheduleSyncQueued).toBeFunction();
    });
});

describe('ScheduleQueued', () => {
    it('should exist', () => {
        expect(ScheduleQueued).toBeFunction();
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

describe('scheduleAnimationFrameQueued', () => {
    it('should exist', () => {
        expect(scheduleAnimationFrameQueued).toBeFunction();
    });
});

describe('scheduleMicrotask', () => {
    it('should exist', () => {
        expect(scheduleMicrotask).toBeFunction();
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

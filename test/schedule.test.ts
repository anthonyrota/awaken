import {
    scheduleSync,
    scheduleAnimationFrame,
    scheduleMicrotask,
    ScheduleTimeout,
    ScheduleInterval,
    ScheduleQueue,
} from '../src/schedule';

describe('scheduleSync', () => {
    it('should exist', () => {
        expect(scheduleSync).toBeFunction();
    });
});

describe('scheduleAnimationFrame', () => {
    it('should exist', () => {
        expect(scheduleAnimationFrame).toBeFunction();
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

describe('ScheduleInterval', () => {
    it('should exist', () => {
        expect(ScheduleInterval).toBeFunction();
    });
});

describe('ScheduleQueue', () => {
    it('should exist', () => {
        expect(ScheduleQueue).toBeFunction();
    });
});

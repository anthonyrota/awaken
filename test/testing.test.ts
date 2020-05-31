import {
    DelayType,
    Delay,
    SubscribeType,
    Subscribe,
    UnsubscribeType,
    Unsubscribe,
} from '../src/testing';
import { EventType } from '../src/source';

describe('DelayType', () => {
    it('should exist', () => {
        expect(DelayType).toBeNumber();
    });

    it('should be equal to EventType.End+1', () => {
        expect(DelayType).toBe(EventType.End + 1);
    });
});

describe('SubscribeType', () => {
    it('should exist', () => {
        expect(SubscribeType).toBeNumber();
    });

    it('should be equal to EventType.End+2', () => {
        expect(SubscribeType).toBe(EventType.End + 2);
    });
});

describe('UnsubscribeType', () => {
    it('should exist', () => {
        expect(UnsubscribeType).toBeNumber();
    });

    it('should be equal to EventType.End+3', () => {
        expect(UnsubscribeType).toBe(EventType.End + 3);
    });
});

describe('Delay', () => {
    it('should exist', () => {
        expect(Delay).toBeFunction();
    });

    it('should return a Delay event', () => {
        const ms = 15;
        const event = Delay(ms);
        expect(event).toEqual({ type: DelayType, ms });
    });

    it('should default ms to one', () => {
        const event = Delay();
        expect(event).toEqual({ type: DelayType, ms: 1 });
    });
});

describe('Subscribe', () => {
    it('should exist', () => {
        expect(Subscribe).toBeObject();
    });

    it('should have type property equal to SubscribeType', () => {
        expect(Subscribe).toEqual({ type: SubscribeType });
    });
});

describe('Unsubscribe', () => {
    it('should exist', () => {
        expect(Unsubscribe).toBeObject();
    });

    it('should have type property equal to UnsubscribeType', () => {
        expect(Unsubscribe).toEqual({ type: Unsubscribe });
    });
});

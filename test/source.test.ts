import { EventType, Push, Throw, End, Source, subscribe } from '../src/source';

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

describe('subscribe', () => {
    it('should be a function', () => {
        expect(subscribe).toBeFunction();
    });
});

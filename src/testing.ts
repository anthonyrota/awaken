import { Event, EventType } from './source';

export type DelayType = 3;
export type Delay = { type: DelayType; ms: number };
export const DelayType: DelayType = 3;
export function Delay(ms = 1): Delay {
    return { type: DelayType, ms };
}

export type SubscribeType = 4;
export type Subscribe = { type: SubscribeType };
export const SubscribeType: SubscribeType = 4;
export const Subscribe: Subscribe = { type: SubscribeType };

export type UnsubscribeType = 5;
export type Unsubscribe = { type: UnsubscribeType };
export const UnsubscribeType: UnsubscribeType = 5;
export const Unsubscribe: Unsubscribe = { type: UnsubscribeType };

export type TestSourceEventType = EventType | DelayType;
export type TestSourceEvent<T> = Event<T> | Delay;

export type TestSubscriptionEventType = DelayType | SubscribeType |UnsubscribeType;
export type TestSubscriptionEvent =
    | Delay
    | Subscribe
    | Unsubscribe;

export type
interface TestSource {
    subscriptions: TestSubscriptions
}

export function SharedTestSource<T>(...events: Test_SourceEvent<T>): 

export function assertSourceEvents<T>(
    source: Source<T>,
    events: Test_SourceEvent<T>,
): void {}

export function assertSourceSubscriptions(
    source: Source<T>,
    events: Test_SubscriptionEvent,
): void {}

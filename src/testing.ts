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

export type SourceEventType = EventType | DelayType;
export type SourceEvent<T> = Event<T> | Delay;

export type SubscriptionEventType = DelayType | SubscribeType | UnsubscribeType;
export type SubscriptionEvent = Delay | Subscribe | Unsubscribe;

---
pageTitle: Introduction
---

AwakenJS is an extensive and lightweight observable library inspired by the [callbag spec][callbag] and [rxjs][]. It provides composable utilities to build event-driven applications, allowing for the creation, transformation and consumption of event streams. This is accomplished through the core types provided by AwakenJS:

- **Source**: represents a series of future events which can be subscribed to.
- **Sink**: used to consume Sources - that is, a Sink can be used to subscribe to the events emitted by a given Source.
- **Operator**: used to transform one Source to another Source, for example: map, filter, debounce, etc.
- **Disposable**: acts as a subscription given to Sources and other actions which can be cancelled through its disposal.
- **Subject**: both a Source and Sink - allows for a controlled distribution of events to many concurrent consumers.
- **Scheduler**: used to schedule events and in general callbacks (for example, to tell a source to emit an event every 100ms).

[callbag]: https://staltz.com/why-we-need-callbags.html
[rxjs]: https://rxjs-dev.firebaseapp.com/guide/overview

<x-title>*Key points*</x-title>

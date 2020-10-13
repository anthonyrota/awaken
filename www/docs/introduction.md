---
title: Introduction
pageId: core--introduction
---

{{LibName}} is an extensive and lightweight observable library inspired by the
[callbag spec][callbag] and [rxjs][]. It provides composable utilities to build
event-driven applications, allowing for the creation, transformation and
consumption of event sources.

[callbag]: https://staltz.com/why-we-need-callbags.html
[rxjs]: https://rxjs-dev.firebaseapp.com/guide/overview

## Motivation {#motivation}

A fundamental part of programming which we use in many of the tasks we come
across is the **manipulation and transformation of lists/streams of data**.
There are various existing built-in patterns we use when programming to handle
such lists of data and events.

### Arrays

The simplest pattern is to use the built-in `Array` and it's various functional
methods, including `filter`, `map` and `reduce`.

### Iterators

When the data is **continuously generated** or the shape of the list is **not
known ahead of time**, we may go to using [Iterators][iterator]. The values of
an iterator can be *pulled* by a consumer *on demand* through the `.next()`
method.

[iterator]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators

### Asynchronous Iterators

When we start dealing with **asynchronous lists of data** the problem becomes
more complicated, and we can sometimes resort to using
[async iterators][async iterator] instead which we can once again *pull* data
from.

[async iterator]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of

### Why not use these built-in solutions?

While these previously described solutions are perfectly suitable for many
scenarios, the problem with them is that the transformation of such iterators
(both synchronous and asynchronous), combined with the managing of their
associated subscriptions (for example, cleaning up every event listener you
subscribed to, or closing all of the files you opened a connection to) **can
easily become difficult to manage and can grow out of control easily without a
solid framework to build around**.

As well as this, the problem becomes much more complicated when we introduce
lists of data (potentially asynchronous) which *cannot be pulled from* (ie. they
cannot be accessed on demand, eg. a stream containing the coordinates of mouse
movements — the user controls them, not the programmer). In this case the
production / creation of the data cannot be strictly controlled by us. This is
where the concept of **reactive programming** comes in to play, and is the
problem that {{LibName}} aims to solve, by providing an easy way to manage,
transform, and subscribe to created streams of events.

### Reactive Programming

Reactive programming with {{LibName}} provides a few new primary data
structures: the **Source**, which describes both synchronous and asynchronous
streams of events, the **Sink**, which is used to subscribe to sources, and the
**Operator**, allowing for the aggregation and transformation of sources.

This allows us to transform collections of complicated asynchronous events as
simply as we would filter the values in an array.

> In this way ~~rxjs~~<sup name="lodash-quote-footnote-link">[1](#lodash-quote-footnote)</sup>
> {{LibName}} can essentially be thought of as Lodash for events.

Built in to JavaScript there are a few fundamental representations of items and
sequences of values:

|                | **single item** | **zero, single or multiple items** |
| ---            | --------------- | ---------------------------------- |
| **pull based** | `get T`         | `Iterator<T>`                      |
| **push based** | `Promise<T>`    |                                    |

However there remains a gap for push-based streams. **Sources** fill the gap,
providing a simple representation of push-based synchronous and asynchronous
sequences of items/events:

|                | **single item** | **zero, single or multiple items** |
| ---            | --------------- | ---------------------------------- |
| **pull based** | `get T`         | `Iterator<T>`                      |
| **push based** | `Promise<T>`    | **`Source<T>`**                    |

You can essentially think of sources as being the both synchronous and
asynchronous "push"-based equivalent to iterators, whereby values/events are
"pushed" to consumers whenever they are available.

{{LibName}} fills the need for immutable, asynchronous push-based streams in
JavaScript, and utilizes concepts from the [Observer pattern][observer pattern],
the [Iterator pattern][iterator pattern] as well as patterns from
[functional programming with collections][fp collections pattern], allowing for
a simple way to manage sequences of events.

   > <details>
   >
   > <summary>1. <a href="#lodash-quote-footnote-link" name="lodash-quote-footnote">^</a></summary><br>
   >
   > This quote is shamelessly stolen from the RxJS documentation. The original
   > quote had RxJS instead of {{LibName}}... Sorry! I couldn't resist.
   >
   > </details>

[observer pattern]: https://en.wikipedia.org/wiki/Observer_pattern
[iterator pattern]: https://en.wikipedia.org/wiki/Iterator_pattern
[fp collections pattern]: https://datacadamia.com/code/fp/fp

### Why use Reactive Programming?

When programming, we often come across situations where we have to **subscribe to
and transform sequences of events out of our control** (a classic example being
when you need to react to a sequence of user keystrokes in a text input in order
to build a typeahead). Managing all of the subscriptions and data sources, the
relationship between them, their transformation and their cleanup / disposal can
**quickly become complicated and turn our code into a mess of spaghetti which
can become hard to deal with using traditional programming techniques**.

This is where *reactive programming* shines. We implement the Reactive
Programming paradigm through the following core types:

- **`Source`** - represents a series of future events which can be subscribed
  to.
- **`Sink`** - used to consume Sources - that is, a Sink can be used to
  subscribe to the events emitted by a given Source.
- **`Event`** - there are three types of events: Push events which push a value,
  Error events which carry an error and End events which are the last events
  emitted by a Source.
- **`Operator`** - used to transform one Source to another Source, for example:
  map, filter, debounce, etc.
- **`Disposable`** - acts as a subscription given to Sources and other actions
  which can be cancelled through its disposal.
- **`Subject`** - both a Source and Sink - allows for a controlled distribution
  of events to many concurrent consumers.
- **`ScheduleFunction`** - used to schedule events and in general callbacks (for
  example, to tell a source to emit an event every 100ms).

These structures all combine to allow for the **easy creation, transformation /
composition, and subscription to event streams**. The 100+ operators we provide
allow for you to efficiently filter, aggregate, transform and compose sources of
events, and much more.

Using reactive programming with {{LibName}} has the following advantages:

- {{LibName}} provides a model to **drastically simplify dealing with
  asynchronous data**.
- {{LibName}} allows your code, which handles complex ideas (such as the
  transformation and aggregation of different streams of events), to **remain
  readable and understandable** to both you and others.
- {{LibName}} **simplifies the cleanup and disposal of the subscriptions used**
  (eg. cleaning up open files, event listeners, etc.), which in the majority of
  cases is done automatically upon unsubscription.

## Motivating Concepts {#motivating-concepts}

The primary idea behind the development of {{LibName}} is the provision of a
reactive model of programming that allows you to create, transform and subscribe
to streams of events as simply as you would manage and transform a collection of
items such as an `Array`.

### Avoiding Callback Hell

We all love promises because they allow for the avoidance of so called
[callback hell][]. But the problem remains for asynchronous streams of data.
Using {{LibName}} frees you from those nasty deep callbacks, increasing the
readability of your code and thereby reducing the risk to bugs.

[callback hell]: https://en.wiktionary.org/wiki/callback_hell

### Composability

Using existing solutions such as chains of promises, event emitters and/or
simply callbacks may be straightforward for *very* simple operations, but they
quickly become non-trivial and complex when their usage is nested or extended to
more complex situations and interactions.

Furthermore, in JavaScript there exists no simple built-in solution to easily
compose and aggregate such streams of events in a simple and effective manner
while keeping track of their subscriptions and automatically cleaning them up
upon unsubscription.

This is an area in which {{LibName}} *shines*, as it is **intended** for
composing sequences of asynchronous data while abstracting away the cleanup of
all side effects involved in creating the source of data so that in most cases
you don't even have to think about it.

### Flexibility

{{LibName}} Sources are not just built for the streaming of singular values
(although they can very well be used for that purpose), but are also **used for
the streaming of multiple or even infinite values**.

Similarly, Sources can not only be used for **synchronous streams of data**, but
can also be used for **asynchronous streams of data** (such as intervals, or
user interactions).

Sources also allow for not just the transformation of values (described as
"Push") events, but also allow for the **transformation of emitted error and
complete events**, allowing for situations such as the recovery from such errors
(eg. retrying network requests), as well as for example the repetition of a
given source upon completion.

### Declarative

While traditional bare-bones callback solutions to streams of events are highly
imperative, Sources are **inherently declarative and abstract away the handling
of the underlying subscriptions** used to create the data source.

<!-- TODO: add example(s), eg. imperative vs declarative typeahead -->

### Tiny Bundle Size

We wouldn't be able to use the word *micro* in the name of our library if it
wasn't for {{LibName}}'s absurdly tiny bundle size.

The current version of `{{LibCoreImportPath}}` is
`{{LibCoreBrotliCompressedSizeKb}}Kb` large when compressed using [brotli][] at
the highest compression level<sup name="how-is-size-calculated-footnote-link">[2](#how-is-size-calculated-footnote)</sup>.

> **Note**: This size includes all of the 150+ exports provided by this library.
> In reality, your final bundle size will be a fraction of that number because
> you are unlikely to use all of the exports.

In comparison, many of the other popular libraries which provide comparable
functionality are all significantly larger in size.

   > <details>
   >
   > <summary>2. <a href="#how-is-size-calculated-footnote-link" name="how-is-size-calculated-footnote">^</a>
   > How is the size calculated?</summary><br>
   >
   > The size of this library is calculated as the size of the entire es5
   > transpiled and minified version of `{{LibCoreImportPath}}`'s es-module code
   > at brotli level 11 compression. For reference, when compressed using gzip
   > at the highest level, the size is `{{LibCoreGzipCompressedSizeKb}}Kb`.
   >
   > </details>

[brotli]: https://caniuse.com/brotli

## Installation {#installation}

Using [npm][]:

```bash
npm install {{LibCoreImportPath}}
```

Or using [yarn][]:

```bash
yarn add {{LibCoreImportPath}}
```

[npm]: https://www.npmjs.com/get-npm
[yarn]: https://classic.yarnpkg.com/en/docs/install

## Supported Languages {#supported-languages}

{{LibName}} is written in [TypeScript][typescript], a superset of JavaScript,
and provides TypeScript typings out-of-the-box. There are no flow typings as it
is a complex task to automatically generate them from the TypeScript source
files due to the fact that flow shares it's type namespace with it's variable
namespace, meaning there are several collisions after conversion.

Because TypeScript is a superset of JavaScript and conversion between the two
for small examples is trivial, the examples shown in this documentation are
written in TypeScript.

[typescript]: https://www.typescriptlang.org/

## Tree Shaking {#tree-shaking}

All of the packages are [tree shakable][tree shaking], so if your bundler
supports tree shaking then you can pull in all of the exports you need without
worrying about bundling the entire library. Bundlers which support tree shaking
include [webpack][webpack tree shaking], [rollup][rollup tree shaking],
[parcel v1][parcel v1 tree shaking] and [parcel v2][parcel v2 tree shaking].

Because this library is tree shakable, all exports for each package are exported
at the index location of that package. For example, to import some core
variables, you would simply import them from `{{LibCoreImportPath}}`:

[tree shaking]: https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking
[webpack tree shaking]: https://webpack.js.org/guides/tree-shaking/
[rollup tree shaking]: https://rollupjs.org/guide/en/#tree-shaking
[parcel v1 tree shaking]: https://parceljs.org/cli.html#enable-experimental-scope-hoisting/tree-shaking-support
[parcel v2 tree shaking]: https://v2.parceljs.org/features/scope-hoisting

```ts
import { Source, Sink, subscribe, pipe, range, takeWhile } from '{{LibCoreImportPath}}';

pipe(
    range(10),
    takeWhile(n => n <= 5),
    subscribe(event => console.log(event))
);
```

## Using {{LibName}} {#using-the-library}

Using {{LibName}} is simple: just import the methods and variables you need to
use from this package and use them. Because this package is tree-shakable, you
don't have to worry about large bundle sizes from the 100+ utilities exported by
this library because they will be stripped away by your bundler in production
(reference: [Tree Shaking](#tree-shaking)).

{{LibName}} exposes all of its methods and utilities, all of which are exported
from the root of the package:

```ts
// TypeScript / ESModules.
import { fromPromise } from '{{LibCoreImportPath}}';
// or CommonJS.
const { fromPromise } = require('{{LibCoreImportPath}}');
```

Until the [pipeline operator][] becomes standard, we expose a tiny `pipe`
utility which simply calls the input value (which is the first argument) against
the functions in the order in which they are given, and returns the output:

```ts
import { pipe, interval, map, take, subscribe } from '{{LibCoreImportPath}}';

pipe(
  interval(1000), // Create an interval source: 0...1...2...etc.
  map(x => x * 2), // Operate: times each push event by two: 0...2...4...etc.
  take(3), // Only take three values: 0...2...(4|)
  subscribe(event => { // Subscribe to the operated source.
    console.log(event);
    // Logs: Push(1) after 1s
    // Logs: Push(2) after 2s
    // Logs: Push(3) after 3s
    // Logs: End
  })
);
```

For reference, the above code is equivalent to the following without the `pipe`
operator:

```ts
import { interval, map, take, subscribe } from '{{LibCoreImportPath}}';

const intervalSource = interval(1000);

const mapOp = map(x => x * 2);
const takeOp = take(3);

const mappedSource = mapOp(intervalSource);
const finalSource = takeOp(mappedSource)

const consumer = subscribe(event => console.log(event))
consumer(finalSource)

// Logs: same as above
```

Furthermore, `subscribe` is simply sugar used in the pipe function that takes a
`Sink` and returns a function which will subscribe to a given source. For
reference, you can also manually subscribe to sinks:

```ts
import { fromArray, Sink, subscribe } from '{{LibCoreImportPath}}'

pipe(fromArray(1, 2, 3), subscribe(event => console.log(event)))
// Equivalent to...
const source = fromArray(1, 2, 3)
const sink = Sink(event => console.log(event))
source(sink)
// Or in a one-liner...
fromArray(1, 2, 3)(Sink(event => console.log(event)))
```

[pipeline operator]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Pipeline_operator

---
title: Introduction
pageId: core--introduction
---

{{LibName}} is an extensive and lightweight observable library inspired by the
[callbag spec][callbag] and [rxjs][]. It provides composable utilities to build
event-driven applications, allowing for the creation, transformation and
consumption of event streams. This is accomplished through the core types
provided by {{LibName}}:

[callbag]: https://staltz.com/why-we-need-callbags.html
[rxjs]: https://rxjs-dev.firebaseapp.com/guide/overview

- **`Source`** - represents a series of future events which can be subscribed to.
- **`Sink`** - used to consume Sources - that is, a Sink can be used to subscribe
  to the events emitted by a given Source.
- **`Event`** - there are three types of events: Push events which push a value,
  Error events which carry an error and End events which are the last events emitted by a Source.
- **`Operator`** - used to transform one Source to another Source, for example:
  map, filter, debounce, etc.
- **`Disposable`** - acts as a subscription given to Sources and other actions
  which can be cancelled through its disposal.
- **`Subject`** - both a Source and Sink - allows for a controlled distribution of
  events to many concurrent consumers.
- **`ScheduleFunction`** - used to schedule events and in general callbacks (for example,
  to tell a source to emit an event every 100ms).

## Motivation {#motivation}

TODO.

## Motivating Concepts {#motivating-concepts}

TODO.

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

{{LibName}} is written in [TypeScript][], a superset of JavaScript, and provides
TypeScript typings out-of-the-box. There are no flow typings as it is a
complex task to automatically generate them from the TypeScript source files
due to the fact that flow shares it's type namespace with it's variable
namespace, meaning there are several collisions after conversion.

Because TypeScript is a superset of JavaScript and conversion between the two
for small examples is trivial, the examples shown in this documentation are
written in TypeScript.

[TypeScript]: https://www.typescriptlang.org/

## Size {#bundle-size}

The current version of {{LibCoreImportPath}} is
`{{LibCoreBrotliCompressedSizeKb}}Kb` large when compressed using [brotli][] at
the highest compression level.

> **Note**: This size includes all of the 100+ exports provided by this library.
> In reality, your final bundle size will be a fraction of that number because
> you are unlikely to use all of the exports.

[brotli]: https://caniuse.com/brotli

All of the packages are [tree shakeable][Tree Shaking], so if your bundler
supports tree shaking then you can pull all in the exports you need without
worrying about bundling the entire library. Because this library is tree
shakable, all exports for each package are exported at the index location of
that package. For example, to import some core variables, you would simply
import them from `{{LibCoreImportPath}}`:

```ts
import { Source, Sink, subscribe, pipe, range, takeWhile } from '{{LibCoreImportPath}}';

pipe(
    range(10),
    takeWhile(n => n <= 5),
    subscribe(Sink(event => console.log(event)))
);
```

[Tree Shaking]: https://webpack.js.org/guides/tree-shaking/

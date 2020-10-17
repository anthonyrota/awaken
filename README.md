# Microstream JS

A fast and extremely lightweight reactive programming library for TypeScript,
inspired by [callbags](https://github.com/callbag/callbag) and
[RxJS](https://github.com/ReactiveX/rxjs).

## TODO

- Allow returning `undefined|null` in operators such as delay?
- Allow optional parameters to be equal to null?
- Look at error instances and make sure we are handling them properly (eg. some
  operators have special error handling built in, eg. reporting to subjects, and
  errors should go through that).
- Fix operators with generic overloads eg. in map.
- Subject with different in/out types, ie. `Subject<T, U>`.
- Add tsdoc labels to all overloads.
- Find a way to document overloads without repetition.

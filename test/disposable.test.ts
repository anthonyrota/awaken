import {
    dispose,
    isDisposable,
    fromTeardown,
    Disposable,
    DisposalError,
} from '../src/disposable';
import { throw_ } from './testUtils';
import each from 'jest-each';

describe('dispose', () => {
    it('should exist', () => {
        expect(dispose).toBeFunction();
    });

    it('should dispose a Disposable', () => {
        const disposable = new Disposable();
        dispose(disposable);
        expect(disposable).toHaveProperty('active', false);
    });

    it('should call the given function', () => {
        const fn = jest.fn();
        dispose(fn);
        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenCalledWith();
    });
});

describe('isDisposable', () => {
    it('should exist', () => {
        expect(isDisposable).toBeFunction();
    });

    each([
        ['undefined', undefined],
        ['null', null],
        ['a number', 17],
        ['a boolean', true],
        ['a string', 'foo'],
        ['a symbol', Symbol('foo')],
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        ['a function', () => {}],
        [
            "an object that isn't a disposable but has a `dispose` method",
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            { dispose() {} },
        ],
    ]).it('should return false when given %s', (_, value) => {
        // eslint-disable-next-line jest/no-standalone-expect
        expect(isDisposable(value)).toBeFalse();
    });

    it('should return true for a disposed disposable', () => {
        const disposable = new Disposable();
        disposable.dispose();
        expect(isDisposable(disposable)).toBeTrue();
    });

    it('should return true for an active disposable', () => {
        expect(isDisposable(new Disposable())).toBeTrue();
    });
});

describe('fromTeardown', () => {
    it('should exist', () => {
        expect(fromTeardown).toBeFunction();
    });

    it('should return a disposable with the given teardown linked', () => {
        const teardown = jest.fn();
        const disposable = fromTeardown(teardown);
        expect(teardown).not.toHaveBeenCalled();
        disposable.dispose();
        expect(teardown).toHaveBeenCalledTimes(1);
        expect(teardown).toHaveBeenCalledWith();
    });
});

describe('Disposable', () => {
    it('should exist', () => {
        expect(Disposable).toBeFunction();
    });

    it('should have a .active field describing whether the disposable is disposed or not', () => {
        [
            new Disposable(),
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            new Disposable([() => {}, new Disposable([])]),
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            new Disposable([() => {}, () => {}][Symbol.iterator]()),
        ].forEach((disposable) => {
            expect(disposable).toHaveProperty('active', true);
            const child = new Disposable();
            disposable.add(child);
            expect(disposable).toHaveProperty('active', true);
            disposable.remove(child);
            expect(disposable).toHaveProperty('active', true);
            disposable.dispose();
            expect(disposable).toHaveProperty('active', false);
        });
    });

    it('should attach a single teardown function', () => {
        const teardown = jest.fn();
        const disposable = new Disposable([teardown]);
        expect(teardown).not.toHaveBeenCalled();
        disposable.dispose();
        expect(teardown).toHaveBeenCalledTimes(1);
        expect(teardown).toHaveBeenCalledWith();
    });

    it('should attach multiple teardowns/disposables and call them in order when disposed', () => {
        const teardown1 = jest.fn();
        const teardown2 = jest.fn();
        const disposableTeardown1 = jest.fn();
        const disposableTeardown2 = jest.fn();
        const disposable1 = new Disposable([disposableTeardown1]);
        const disposable2 = new Disposable([disposableTeardown2]);
        const disposable3 = new Disposable();
        const disposable = new Disposable([
            teardown1,
            disposable1,
            disposable2,
            teardown2,
            disposable3,
        ]);
        expect(teardown1).not.toHaveBeenCalled();
        expect(teardown2).not.toHaveBeenCalled();
        expect(disposableTeardown1).not.toHaveBeenCalled();
        expect(disposableTeardown2).not.toHaveBeenCalled();
        expect(disposable3).toHaveProperty('active', true);
        disposable.dispose();
        expect(teardown1).toHaveBeenCalledTimes(1);
        expect(teardown1).toHaveBeenCalledWith();
        expect(teardown2).toHaveBeenCalledTimes(1);
        expect(teardown2).toHaveBeenCalledWith();
        expect(disposableTeardown1).toHaveBeenCalledTimes(1);
        expect(disposableTeardown1).toHaveBeenCalledWith();
        expect(disposableTeardown2).toHaveBeenCalledTimes(1);
        expect(disposableTeardown2).toHaveBeenCalledWith();
        expect(disposable3).toHaveProperty('active', false);
        expect(teardown1).toHaveBeenCalledBefore(disposableTeardown1);
        expect(disposableTeardown1).toHaveBeenCalledBefore(disposableTeardown2);
        expect(disposableTeardown2).toHaveBeenCalledBefore(teardown2);
    });

    it('should attach all the items of the given iterable and call them in order when disposed', () => {
        const teardown1 = jest.fn();
        const teardown2 = jest.fn();
        const iter: Iterable<() => void> = {
            *[Symbol.iterator]() {
                yield teardown1;
                yield teardown2;
            },
        };
        const disposable = new Disposable(iter);
        disposable.dispose();
        expect(teardown1).toHaveBeenCalledTimes(1);
        expect(teardown1).toHaveBeenCalledWith();
        expect(teardown2).toHaveBeenCalledTimes(1);
        expect(teardown2).toHaveBeenCalledWith();
        expect(teardown1).toHaveBeenCalledBefore(teardown2);
    });

    it('should be able to add a single child with the `add()` method', () => {
        const disposable = new Disposable();
        const teardown = jest.fn();
        disposable.add(teardown);
        disposable.dispose();
        expect(teardown).toHaveBeenCalledTimes(1);
        expect(teardown).toHaveBeenCalledWith();
    });

    it('should be able to remove a single child with the `remove()` method', () => {
        const teardown = jest.fn();
        const disposable = new Disposable([teardown]);
        disposable.remove(teardown);
        disposable.dispose();
        expect(teardown).not.toHaveBeenCalled();
    });

    it('should be able to add multiple children with multiple `add()` calls', () => {
        const teardown1 = jest.fn();
        const teardown2 = jest.fn();
        const disposableTeardown = jest.fn();
        const disposable1 = new Disposable([disposableTeardown]);
        const disposable = new Disposable([teardown1]);
        disposable.add(teardown2);
        disposable.add(disposable1);
        expect(teardown1).not.toHaveBeenCalled();
        expect(teardown2).not.toHaveBeenCalled();
        expect(disposableTeardown).not.toHaveBeenCalled();
        disposable.dispose();
        expect(teardown1).toHaveBeenCalledTimes(1);
        expect(teardown1).toHaveBeenCalledWith();
        expect(teardown2).toHaveBeenCalledTimes(1);
        expect(teardown2).toHaveBeenCalledWith();
        expect(disposableTeardown).toHaveBeenCalledTimes(1);
        expect(disposableTeardown).toHaveBeenCalledWith();
        expect(teardown1).toHaveBeenCalledBefore(teardown2);
        expect(teardown2).toHaveBeenCalledBefore(disposableTeardown);
    });

    it('should be able to remove multiple children with multiple `remove()` calls', () => {
        const teardown1 = jest.fn();
        const teardown2 = jest.fn();
        const disposable1 = new Disposable();
        const disposable = new Disposable([teardown1, disposable1]);
        disposable.add(teardown2);
        disposable.remove(teardown1);
        disposable.remove(teardown2);
        expect(disposable1).toHaveProperty('active', true);
        disposable.dispose();
        expect(teardown1).not.toHaveBeenCalled();
        expect(teardown2).not.toHaveBeenCalled();
        expect(disposable1).toHaveProperty('active', false);
    });

    it('should preserve the order of disposal when calling `remove()`', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const teardown1 = () => {};
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const teardown2 = () => {};
        const teardown3 = jest.fn();
        const disposableTeardown = jest.fn();
        const disposable1 = new Disposable([disposableTeardown]);
        const disposable = new Disposable([
            teardown1,
            disposable1,
            teardown2,
            teardown3,
        ]);
        disposable.remove(teardown1);
        disposable.remove(teardown2);
        disposable.dispose();
        expect(disposableTeardown).toHaveBeenCalledBefore(teardown3);
    });

    it('should do nothing if adding itself', () => {
        const teardown1 = jest.fn();
        const teardown2 = jest.fn();
        const disposable = new Disposable([teardown1, teardown2]);
        disposable.add(disposable);
        disposable.dispose();
        expect(teardown1).toHaveBeenCalledTimes(1);
        expect(teardown1).toHaveBeenCalledWith();
        expect(teardown2).toHaveBeenCalledTimes(1);
        expect(teardown2).toHaveBeenCalledWith();
        expect(teardown1).toHaveBeenCalledBefore(teardown2);
    });

    it('should not dispose itself recursively', () => {
        const teardown1 = jest.fn(() => finalDisposable1.dispose());
        const disposableTeardown1 = jest.fn(() => finalDisposable1.dispose());
        const disposable1 = new Disposable([disposableTeardown1]);
        const finalDisposable1: Disposable = new Disposable([
            teardown1,
            disposable1,
        ]);
        finalDisposable1.dispose();
        expect(teardown1).toHaveBeenCalledTimes(1);
        expect(teardown1).toHaveBeenCalledWith();
        expect(disposableTeardown1).toHaveBeenCalledTimes(1);
        expect(disposableTeardown1).toHaveBeenCalledWith();
        expect(disposable1.active).toBe(false);
        expect(finalDisposable1.active).toBe(false);
        const teardown2 = jest.fn(() => finalDisposable2.dispose());
        const disposableTeardown2 = jest.fn(() => finalDisposable2.dispose());
        const disposable2 = new Disposable([disposableTeardown2]);
        const finalDisposable2 = new Disposable();
        finalDisposable2.add(teardown2);
        finalDisposable2.add(disposable2);
        finalDisposable2.dispose();
        expect(teardown2).toHaveBeenCalledTimes(1);
        expect(teardown2).toHaveBeenCalledWith();
        expect(disposableTeardown2).toHaveBeenCalledTimes(1);
        expect(disposableTeardown2).toHaveBeenCalledWith();
        expect(disposable2.active).toBe(false);
        expect(finalDisposable2.active).toBe(false);
    });

    it('should dispose the given child when calling `add()` if currently disposed', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const disposable = new Disposable([() => {}]);
        disposable.dispose();
        const teardown = jest.fn();
        disposable.add(teardown);
        expect(teardown).toHaveBeenCalledTimes(1);
        expect(teardown).toHaveBeenCalledWith();
        const disposableTeardown = jest.fn();
        const disposable1 = new Disposable([disposableTeardown]);
        disposable.add(disposable1);
        expect(disposable1).toHaveProperty('active', false);
        expect(disposableTeardown).toHaveBeenCalledTimes(1);
        expect(disposableTeardown).toHaveBeenCalledWith();
    });

    it('should do nothing when calling `remove()` if currently disposed', () => {
        const teardown = jest.fn();
        const disposable = new Disposable([teardown]);
        disposable.dispose();
        disposable.remove(teardown);
        expect(teardown).toHaveBeenCalledTimes(1);
    });

    it('should be able to add the same teardown function multiple times', () => {
        const teardown = jest.fn();
        const disposable = new Disposable([teardown]);
        disposable.add(teardown);
        disposable.add(teardown);
        disposable.add(teardown);
        disposable.dispose();
        expect(teardown).toHaveBeenCalledTimes(4);
        expect(teardown).toHaveBeenNthCalledWith(1);
        expect(teardown).toHaveBeenNthCalledWith(2);
        expect(teardown).toHaveBeenNthCalledWith(3);
        expect(teardown).toHaveBeenNthCalledWith(4);
    });

    it('should only remove the first teardown function if there are multiple of them', () => {
        const teardown1 = jest.fn();
        const teardown2 = jest.fn();
        const teardown3 = jest.fn();
        const disposable = new Disposable([
            teardown1,
            teardown2,
            teardown3,
            teardown2,
        ]);
        disposable.add(teardown2);
        disposable.remove(teardown2);
        disposable.dispose();
        expect(teardown1).toHaveBeenCalledTimes(1);
        expect(teardown1).toHaveBeenCalledWith();
        expect(teardown2).toHaveBeenCalledTimes(2);
        expect(teardown2).toHaveBeenNthCalledWith(1);
        expect(teardown2).toHaveBeenNthCalledWith(2);
        expect(teardown3).toHaveBeenCalledTimes(1);
        expect(teardown3).toHaveBeenCalledWith();
        // call order: teardown1, teardown3, teardown2, teardown2
        expect(teardown1.mock.invocationCallOrder[0]).toBeLessThan(
            teardown3.mock.invocationCallOrder[0],
        );
        expect(teardown3.mock.invocationCallOrder[0]).toBeLessThan(
            teardown2.mock.invocationCallOrder[0],
        );
    });

    it('should do nothing when disposed multiple times', () => {
        const teardown = jest.fn();
        const disposableTeardown = jest.fn();
        const disposable = new Disposable([
            teardown,
            new Disposable([disposableTeardown]),
        ]);
        disposable.dispose();
        disposable.dispose();
        disposable.dispose();
        expect(teardown).toHaveBeenCalledTimes(1);
        expect(disposableTeardown).toHaveBeenCalledTimes(1);
    });

    it('should directly mutate the given list when adding/removing', () => {
        const list = [];
        const disposable = new Disposable(list);
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const fns = [() => {}, () => {}, () => {}, () => {}];
        disposable.add(fns[0]);
        expect(list).toEqual([fns[0]]);
        disposable.add(fns[1]);
        expect(list).toEqual([fns[0], fns[1]]);
        disposable.remove(fns[0]);
        expect(list).toEqual([fns[1]]);
        disposable.add(fns[2]);
        disposable.add(fns[3]);
        expect(list).toEqual([fns[1], fns[2], fns[3]]);
        disposable.remove(fns[2]);
        expect(list).toEqual([fns[1], fns[3]]);
    });

    it('should dispose all of the children in order even if one of them throws', () => {
        const teardown1 = jest.fn();
        const teardown2 = jest.fn();
        const disposableTeardown1 = jest.fn();
        const disposable1 = new Disposable([disposableTeardown1]);
        const throws = jest.fn(throw_('foo'));
        const disposable = new Disposable([
            teardown1,
            throws,
            disposable1,
            teardown2,
        ]);
        expect(() => disposable.dispose()).toThrow();
        expect(teardown1).toHaveBeenCalledTimes(1);
        expect(teardown1).toHaveBeenCalledWith();
        expect(teardown2).toHaveBeenCalledTimes(1);
        expect(teardown2).toHaveBeenCalledWith();
        expect(disposable1).toHaveProperty('active', false);
        expect(throws).toHaveBeenCalledTimes(1);
        expect(throws).toHaveBeenCalledWith();
        expect(teardown1).toHaveBeenCalledBefore(throws);
        expect(throws).toHaveBeenCalledBefore(disposableTeardown1);
        expect(disposableTeardown1).toHaveBeenCalledBefore(teardown2);
        expect(disposable).toHaveProperty('active', false);
    });

    it('should dispose all of the children in order even if multiple of them throw', () => {
        const teardown1 = jest.fn();
        const teardown2 = jest.fn();
        const disposableTeardown1 = jest.fn();
        const disposable1 = new Disposable([disposableTeardown1]);
        const throws1 = jest.fn(throw_('foo'));
        const throws2 = jest.fn(throw_('bar'));
        const throws3 = jest.fn(throw_('baz'));
        const disposable = new Disposable([
            teardown1,
            throws1,
            disposable1,
            new Disposable([throws2, new Disposable([throws3])]),
            teardown2,
        ]);
        expect(() => disposable.dispose()).toThrow();
        expect(teardown1).toHaveBeenCalledTimes(1);
        expect(teardown1).toHaveBeenCalledWith();
        expect(teardown2).toHaveBeenCalledTimes(1);
        expect(teardown2).toHaveBeenCalledWith();
        expect(disposable1).toHaveProperty('active', false);
        expect(throws1).toHaveBeenCalledTimes(1);
        expect(throws1).toHaveBeenCalledWith();
        expect(throws2).toHaveBeenCalledTimes(1);
        expect(throws2).toHaveBeenCalledWith();
        expect(throws3).toHaveBeenCalledTimes(1);
        expect(throws3).toHaveBeenCalledWith();
        expect(teardown1).toHaveBeenCalledBefore(throws1);
        expect(throws1).toHaveBeenCalledBefore(disposableTeardown1);
        expect(disposableTeardown1).toHaveBeenCalledBefore(throws2);
        expect(throws2).toHaveBeenCalledBefore(throws3);
        expect(throws3).toHaveBeenCalledBefore(teardown2);
        expect(disposable).toHaveProperty('active', false);
    });
});

describe('DisposalError', () => {
    it('should exist', () => {
        expect(DisposalError).toBeFunction();
    });

    it('should throw a DisposalError when disposing a disposable if one of the children throws', () => {
        expect.hasAssertions();

        const disposable = new Disposable([throw_('foo')]);

        try {
            disposable.dispose();
        } catch (error) {
            /* eslint-disable jest/no-try-expect */
            expect(error).toBeInstanceOf(DisposalError);
            expect((error as DisposalError).message).toMatchInlineSnapshot(`
                "Failed to dispose a resource. 1 error was caught.
                  [#1] Error: foo"
            `);
            expect((error as DisposalError).errors).toHaveLength(1);
            expect((error as DisposalError).errors[0]).toHaveProperty(
                'message',
                'foo',
            );
            /* eslint-enable jest/no-try-expect */
        }
    });

    it('should flatten all DisposalErrors thrown when a disposable is disposed', () => {
        expect.hasAssertions();

        const disposable = new Disposable([
            throw_('error1'),
            () => {
                new Disposable([throw_('error2')]).dispose();
            },
            new Disposable([throw_('error3')]),
            new Disposable([
                new Disposable([
                    throw_('error4'),
                    () => {
                        new Disposable([throw_('error5')]).dispose();
                    },
                ]),
                new Disposable([new Disposable([throw_('error6')])]),
            ]),
        ]);

        try {
            disposable.dispose();
        } catch (error) {
            /* eslint-disable jest/no-try-expect */
            expect(error).toBeInstanceOf(DisposalError);
            expect((error as DisposalError).message).toMatchInlineSnapshot(`
                "Failed to dispose a resource. 6 errors were caught.
                  [#1] Error: error1
                  [#2] Error: error2
                  [#3] Error: error3
                  [#4] Error: error4
                  [#5] Error: error5
                  [#6] Error: error6"
            `);
            expect((error as DisposalError).errors).toHaveLength(6);
            // prettier-ignore
            expect((error as DisposalError).errors[0]).toHaveProperty('message', 'error1');
            // prettier-ignore
            expect((error as DisposalError).errors[1]).toHaveProperty('message', 'error2');
            // prettier-ignore
            expect((error as DisposalError).errors[2]).toHaveProperty('message', 'error3');
            // prettier-ignore
            expect((error as DisposalError).errors[3]).toHaveProperty('message', 'error4');
            // prettier-ignore
            expect((error as DisposalError).errors[4]).toHaveProperty('message', 'error5');
            // prettier-ignore
            expect((error as DisposalError).errors[5]).toHaveProperty('message', 'error6');
            /* eslint-enable jest/no-try-expect */
        }
    });
});

import each from 'jest-each';
import { noop } from '../src/util';
import { throw_ } from './testUtils';
import {
    Disposable,
    DisposalError,
    isDisposable,
    DISPOSED,
    implDisposableMethods,
} from '@microstream/core';

describe('isDisposable', () => {
    it('should be a function', () => {
        expect(isDisposable).toBeFunction();
    });

    each([
        ['undefined', undefined],
        ['null', null],
        ['a number', 17],
        ['a boolean', true],
        ['a string', 'foo'],
        ['a symbol', Symbol('foo')],
        ['a function', noop],
        [
            "an object that isn't a disposable but has a `dispose` method",
            { dispose: noop },
        ],
    ]).it('should return false when given %s', (_, value) => {
        // eslint-disable-next-line jest/no-standalone-expect
        expect(isDisposable(value)).toBeFalse();
    });

    it('should return true for a disposed disposable', () => {
        const disposable = Disposable();
        disposable.dispose();
        expect(isDisposable(disposable)).toBeTrue();
    });

    it('should return true for an active disposable', () => {
        expect(isDisposable(Disposable())).toBeTrue();
    });
});

function runDisposableTests(
    Disposable: (onDispose?: () => void) => Disposable,
): void {
    it('should return a value that is a Disposable', () => {
        expect(isDisposable(Disposable())).toBe(true);
        expect(
            isDisposable(
                Disposable(() => {
                    /**/
                }),
            ),
        ).toBe(true);
    });

    it('should have a .active field describing whether the disposable is disposed or not', () => {
        [
            Disposable(),
            Disposable(() => {
                /**/
            }),
        ].forEach((disposable) => {
            expect(disposable).toHaveProperty('active', true);
            const child = Disposable();
            disposable.add(child);
            expect(disposable).toHaveProperty('active', true);
            disposable.remove(child);
            expect(disposable).toHaveProperty('active', true);
            disposable.dispose();
            expect(disposable).toHaveProperty('active', false);
            disposable.dispose();
            expect(disposable).toHaveProperty('active', false);
        });
    });

    it('should attach a primary teardown function', () => {
        const teardown = jest.fn();
        const disposable = Disposable(teardown);
        expect(teardown).not.toHaveBeenCalled();
        disposable.dispose();
        expect(teardown).toHaveBeenCalledTimes(1);
        expect(teardown).toHaveBeenCalledWith();
    });

    it('should not dispose the primary teardown function more than once', () => {
        const teardown = jest.fn();
        const disposable = Disposable(teardown);
        disposable.dispose();
        disposable.dispose();
        disposable.dispose();
        expect(teardown).toHaveBeenCalledTimes(1);
    });
}

describe('Disposable', () => {
    it('should be a function', () => {
        expect(Disposable).toBeFunction();
    });

    runDisposableTests(Disposable);
});

describe('implDisposableMethods', () => {
    function runTests(
        // eslint-disable-next-line @typescript-eslint/ban-types
        impl: <T extends object>(
            value: T,
            onDispose?: () => void,
        ) => T & Disposable,
    ): void {
        const items = [
            [
                'a function',
                () => () => {
                    /**/
                },
            ] as const,
            ['an array', () => []] as const,
            ['an object', () => ({})] as const,
            [
                'an object with a dispose method',
                () => ({
                    dispose() {
                        /**/
                    },
                }),
            ] as const,
        ];
        each(items).describe('on %s', (_, value: typeof items[number][1]) => {
            it('should return the value given', () => {
                const valueCopy = value();
                expect(
                    impl(valueCopy, () => {
                        /**/
                    }),
                ).toBe(valueCopy);
            });

            describe('the value after implementation', () => {
                runDisposableTests((onDispose) => impl(value(), onDispose));
            });
        });
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    function realImpl<T extends object>(
        value: T,
        onDispose?: () => void,
    ): T & Disposable {
        return implDisposableMethods(value, Disposable(onDispose));
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    function fakeImpl<T extends object>(
        value: T,
        onDispose?: () => void,
    ): T & Disposable {
        return implDisposableMethods(
            value,
            implDisposableMethods(
                {},
                implDisposableMethods(
                    () => {
                        /**/
                    },
                    implDisposableMethods(
                        {
                            dispose() {
                                /**/
                            },
                        },
                        implDisposableMethods([], Disposable(onDispose)),
                    ),
                ),
            ),
        );
    }

    describe('when implementing the methods of a real Disposable', () => {
        runTests(realImpl);
    });

    describe('when implementing the methods of a fake Disposable', () => {
        runTests(fakeImpl);
    });
});

describe('DisposalError', () => {
    it('should be a function', () => {
        expect(DisposalError).toBeFunction();
    });

    it('should have a constructor equal to itself', () => {
        expect(DisposalError.prototype.constructor).toBe(DisposalError);
        expect(new DisposalError([]).constructor).toBe(DisposalError);
    });

    it('should handle instanceof', () => {
        expect(new DisposalError([])).toBeInstanceOf(DisposalError);
    });

    it('should throw a DisposalError when disposing a disposable and its primary teardown function throws', () => {
        expect.hasAssertions();

        const disposable = Disposable(throw_('foo'));

        try {
            disposable.dispose();
        } catch (error) {
            /* eslint-disable jest/no-try-expect */
            expect(error).toBeInstanceOf(DisposalError);
            const { message } = error as DisposalError;
            // Cannot snapshot because message contains stack traces of each
            // individual error.
            expect(message).toMatch(
                'Failed to dispose a resource. 1 error was caught.',
            );
            expect(message).toMatch('[#1] Error: foo');
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

        const error1 = 'error1';
        const error2 = 'error2';
        const error3 = 'error3\nthis\n\nerror\nis\nmultiline';
        const error4 = 'error4';
        const error5 =
            'error5\n\n\n\nthis\n\nerror\nis\n\n\n\nalso\n\nmultiline1\n\n\n\n2';
        const error6 = 'error6';

        const disposable = Disposable(throw_(error1));
        disposable.add(
            Disposable(() => {
                Disposable(throw_(error2)).dispose();
            }),
        );
        disposable.add(Disposable(throw_(error3)));
        const inner = Disposable();
        const inner1 = Disposable(throw_(error4));
        inner1.add(Disposable(throw_(error5)));
        inner.add(inner1);
        inner.add(Disposable(throw_(error6)));
        disposable.add(inner);

        try {
            disposable.dispose();
        } catch (error) {
            /* eslint-disable jest/no-try-expect */
            expect(error).toBeInstanceOf(DisposalError);
            const { message } = error as DisposalError;
            expect(message).toMatch(
                'Failed to dispose a resource. 6 errors were caught.',
            );
            expect(message).toMatch('[#1] Error: error1');
            expect(message).toMatch('[#2] Error: error2');
            expect(message).toMatch('[#3] Error: error3');
            expect(message).toMatch('[#4] Error: error4');
            expect(message).toMatch('[#5] Error: error5');
            // Some arbitrary spacing.
            expect(message).toMatch('  this\n');
            expect(message).toMatch('  error\n');
            expect(message).toMatch('  is\n');
            expect(message).toMatch('  also\n');
            expect(message).toMatch('  multiline1\n');
            expect(message).toMatch('  2\n');
            expect(message).toMatch('[#6] Error: error6');
            /* eslint-enable jest/no-try-expect */
        }
    });
});

describe('DISPOSED', () => {
    it('should be a Disposable', () => {
        expect(isDisposable(DISPOSED)).toBe(true);
    });

    it('should be disposed', () => {
        expect(DISPOSED.active).toBe(false);
    });

    it('should dispose added disposables', () => {
        const disposable = Disposable();
        DISPOSED.add(disposable);
        expect(disposable.active).toBe(false);
    });
});

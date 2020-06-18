import { removeOnce } from './util';
import {
    setPrototypeOf,
    NativeErrorWrapped,
    createSuper,
    joinErrors,
} from './errorBase';

// eslint-disable-next-line max-len
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
const $$disposable: unique symbol = '@@__IsDisposable_Property_Indicator__@@' as any;
const $$disposable_IdentifyingValue = 'Disposable';

export interface Disposable {
    readonly [$$disposable]: typeof $$disposable_IdentifyingValue;
    readonly active: boolean;
    add(child: Disposable): void;
    remove(child: Disposable): void;
    dispose(): void;
}

interface _IDisposableImplementation extends Disposable {
    __markParentDisposed(): void;
}

class _DisposableImplementation implements _IDisposableImplementation {
    private __children: _IDisposableImplementation[] | null = [];
    private __isParentDisposed = false;
    public [$$disposable]: typeof $$disposable_IdentifyingValue;

    constructor(private __onDispose?: () => void) {}

    public get active(): boolean {
        if (!this.__children) {
            return false;
        }
        // If a disposable is determined to not be active, it should be ensured
        // that it's dispose method was called.
        if (this.__isParentDisposed) {
            this.dispose();
            return false;
        }
        return true;
    }

    public add(child: _IDisposableImplementation): void {
        if (!this.__children) {
            child.dispose();
            return;
        }

        if (child === this) {
            return;
        }

        if (this.__isParentDisposed) {
            this.__children.push(child);
            // Already marked children as disposed -> have to manually here.
            child.__markParentDisposed();
            this.dispose();
            return;
        }

        if (
            // If the child is marked for disposal this will dispose it now.
            !child.active
        ) {
            return;
        }

        this.__children.push(child);
    }

    public remove(child: _IDisposableImplementation): void {
        if (!this.active) {
            return;
        }

        if (
            // If the child is marked for disposal this will dispose it now.
            !child.active
        ) {
            return;
        }

        // Neither we nor the child are being/waiting to be disposed.
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        removeOnce(this.__children!, child);
    }

    public dispose(): void {
        const children = this.__children;

        if (!children) {
            return;
        }

        // Walk the tree of all children and mark that one of their parents
        // has been disposed.
        this.__markParentDisposed();

        const errors: unknown[] = [];

        this.__children = null;

        const onDispose = this.__onDispose;

        if (onDispose) {
            try {
                onDispose();
            } catch (error) {
                errors.push(error);
            }
        }

        for (let i = 0; i < children.length; i++) {
            try {
                children[i].dispose();
            } catch (error) {
                errors.push(error);
            }
        }

        if (errors.length > 0) {
            throw new DisposalError(errors);
        }
    }

    public __markParentDisposed(): void {
        const children = this.__children;
        if (!children || this.__isParentDisposed) {
            return;
        }
        this.__isParentDisposed = true;
        for (let i = 0; i < children.length; i++) {
            children[i].__markParentDisposed();
        }
    }
}

Object.defineProperty(_DisposableImplementation.prototype, $$disposable, {
    value: $$disposable_IdentifyingValue,
});

interface _DisposalError extends Error {
    errors: unknown[];
}

export interface DisposalError extends _DisposalError {
    /**
     * The flattened list of errors thrown during disposable.
     */
    readonly errors: unknown[];
}

export interface DisposalErrorConstructor
    extends Omit<ErrorConstructor, 'prototype'> {
    new (errors: unknown[]): DisposalError;
    prototype: DisposalError;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const DisposalErrorSuper = createSuper(_DisposalError);

function _DisposalError(this: _DisposalError, errors: unknown[]) {
    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const instance: _DisposalError = DisposalErrorSuper.apply(this);

    const flattenedErrors = flattenDisposalErrors(errors);

    instance.message = `Failed to dispose a resource. ${
        flattenedErrors.length
    } error${
        flattenedErrors.length === 1 ? ' was' : 's were'
    } caught.${joinErrors(flattenedErrors)}`;

    instance.name = 'DisposalError';
    instance.errors = flattenedErrors;

    return instance;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
_DisposalError.prototype = Object.create(NativeErrorWrapped.prototype, {
    constructor: {
        value: _DisposalError,
        writable: true,
        configurable: true,
    },
});

setPrototypeOf(_DisposalError, NativeErrorWrapped);

/**
 * Thrown when at least one error is caught during a resource's disposal.
 */
// eslint-disable-next-line max-len
export const DisposalError: DisposalErrorConstructor = (_DisposalError as unknown) as DisposalErrorConstructor;

function flattenDisposalErrors(errors: unknown[]): unknown[] {
    const flattened: unknown[] = [];

    errors.forEach((error) => {
        if (error instanceof DisposalError) {
            Array.prototype.push.apply(flattened, error.errors);
        } else {
            flattened.push(error);
        }
    });

    return flattened;
}

export function Disposable(onDispose?: () => void): Disposable {
    return new _DisposableImplementation(onDispose);
}

export function isDisposable(value: unknown): value is Disposable {
    return (
        value != null &&
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        (value as any)[$$disposable] === $$disposable_IdentifyingValue
    );
}

export const DISPOSED: Disposable = new _DisposableImplementation();
DISPOSED.dispose();

// eslint-disable-next-line max-len
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/unbound-method
const _DisposableImplementation_activeGetter = Object.getOwnPropertyDescriptor(
    _DisposableImplementation.prototype,
    'active',
)!.get!;

const {
    add: _DisposableImplementation_add,
    remove: _DisposableImplementation_remove,
    dispose: _DisposableImplementation_dispose,
    __markParentDisposed: _DisposableImplementation___markParentDisposed,
} = _DisposableImplementation.prototype;

/**
 * Implements the Disposable Interface onto the given value by proxying the
 * disposable methods & properties from the given value to the given disposable.
 * @param value The value to implement the Disposable Interface on.
 * @param disposable The disposable to proxy to.
 * @returns The given value which has been mutated. In strict javascript this is
 *     unnecessary but here it is useful as the returned value will have the
 *     type of the given value & Disposable.
 */
export function implDisposable<T>(
    value: T,
    disposable: Disposable,
): T & Disposable {
    if (disposable instanceof _DisposableImplementation) {
        Object.defineProperties(value, {
            [$$disposable]: { value: $$disposable_IdentifyingValue },
            active: {
                get: _DisposableImplementation_activeGetter.bind(disposable),
            },
            add: {
                value: _DisposableImplementation_add.bind(disposable),
            },
            remove: {
                value: _DisposableImplementation_remove.bind(disposable),
            },
            dispose: {
                value: _DisposableImplementation_dispose.bind(disposable),
            },
            __markParentDisposed: {
                value: _DisposableImplementation___markParentDisposed.bind(
                    disposable,
                ),
            },
        });
    } else {
        Object.defineProperties(value, {
            [$$disposable]: { value: $$disposable_IdentifyingValue },
            /* eslint-disable @typescript-eslint/no-non-null-assertion */
            active: Object.getOwnPropertyDescriptor(disposable, 'active')!,
            add: Object.getOwnPropertyDescriptor(disposable, 'add')!,
            remove: Object.getOwnPropertyDescriptor(disposable, 'remove')!,
            dispose: Object.getOwnPropertyDescriptor(disposable, 'dispose')!,
            __markParentDisposed: Object.getOwnPropertyDescriptor(
                disposable,
                '__markParentDisposed',
            )!,
            /* eslint-enable @typescript-eslint/no-non-null-assertion */
        });
    }
    return value as T & Disposable;
}

import { removeOnce, toArray } from './utils';

/**
 * Represents a function which when called disposes a resource.
 */
export interface Teardown {
    (): void;
}

/**
 * Disposes the given value. If it is a teardown then it will call the teardown.
 * @param value The Disposable or Teardown to dispose.
 */
export function dispose(value: Disposable | Teardown): void {
    if (isDisposable(value)) {
        value.dispose();
    } else {
        value();
    }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const $$disposable: unique symbol =
    typeof Symbol !== 'undefined'
        ? Symbol('IsDisposable_Property_Indicator')
        : // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ('@@__IsDisposable_Property_Indicator__@@' as any);

/**
 * Tests to see if the value is a Disposable.
 * @param value The value to test.
 * @returns True if the value is a Disposable, else false.
 */
export function isDisposable(value: unknown): value is Disposable {
    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    return value != null && (value as any)[$$disposable] === 'Disposable';
}

/**
 * Constructs a Disposable from a single Teardown value.
 * @param fn The Teardown to add as a child to the returned Disposable.
 * @returns The constructed Disposable, containing the given fn as a child.
 */
export function fromTeardown(fn: Teardown): Disposable {
    return new _Disposable([fn]);
}

/**
 * Represents a resource which can be disposed of using the `dispose` method.
 * Child `Disposables` / `Teardowns` can be linked/unlinked to a Disposable
 * instance through the `add` and `remove` methods, and when the instance is
 * disposed of, all of it's children will also be disposed of.
 */
export interface Disposable {
    readonly [$$disposable]: 'Disposable';
    readonly active: boolean;
    add(child: Disposable | Teardown): void;
    remove(child: Disposable | Teardown): void;
    dispose(): void;
}

export function Disposable(
    children: Iterable<Disposable | Teardown> = [],
): Disposable {
    return new _Disposable(children);
}

class _Disposable implements Disposable {
    private __children: (Disposable | Teardown)[] | null;
    public [$$disposable]: 'Disposable';

    /**
     * @param children A list/iterable of `Disposables` / `Teardowns` to be
     *     initially linked to this instance. Note: if the value given is an
     *     array, the array will be mutated inside this instance.
     */
    constructor(children: Iterable<Disposable | Teardown> = []) {
        this.__children = toArray(children);
    }

    /**
     * A readonly boolean flag representing whether this instance is still
     * active. If the value is false, then the instance has already been
     * disposed.
     * @returns Whether this instance is still active.
     */
    public get active(): boolean {
        return !!this.__children;
    }

    /**
     * Links the given value to be disposed when this instance is disposed. If
     * this Disposable is already disposed, then the given value will be
     * disposed immediately.
     *
     * In order to unlink the value from this instance, simply call this
     * instance's `remove` method with the given value as the argument.
     * @param child The Disposable/Teardown to link.
     */
    public add(child: Disposable | Teardown): void {
        if (!this.__children) {
            dispose(child);
            return;
        }

        if (child === this || (isDisposable(child) && !child.active)) {
            return;
        }

        this.__children.push(child);
    }

    /**
     * Unlinks the given value from this instance, preventing it from being
     * disposed when this instance is disposed.
     * @param child The child value to unlink.
     */
    public remove(child: Disposable | Teardown): void {
        if (!this.__children) {
            return;
        }

        removeOnce(this.__children, child);
    }

    /**
     * Disposes this instance, as well as all the linked child `Disposables` /
     * `Teardowns`.
     */
    public dispose(): void {
        const children = this.__children;

        if (!children) {
            return;
        }

        const errors: unknown[] = [];

        this.__children = null;

        children.forEach((child) => {
            try {
                dispose(child);
            } catch (error) {
                errors.push(error);
            }
        });

        if (errors.length > 0) {
            throw new DisposalError(errors);
        }
    }
}

Object.defineProperty(_Disposable.prototype, $$disposable, {
    value: 'Disposable',
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

export interface DisposalErrorConstructor {
    new (errors: unknown[]): DisposalError;
    prototype: DisposalError;
}

/**
 * Thrown when at least one error is caught during a resource's disposal.
 */
export const DisposalError = (function (
    this: _DisposalError,
    errors: unknown[],
) {
    Error.call(this);

    const flattenedErrors = flattenDisposalErrors(errors);
    const errorCount = flattenedErrors.length;

    const printedErrors = flattenedErrors
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        .map((error, index) => `\n  [#${index + 1}] ${error}`)
        .join('');

    this.message = `Failed to dispose a resource. ${errorCount} error${
        flattenedErrors.length === 1 ? ' was' : 's were'
    } caught.${printedErrors}`;

    this.name = 'DisposalError';
    this.errors = flattenedErrors;
    this.stack = new Error().stack;
} as unknown) as DisposalErrorConstructor;

DisposalError.prototype = Object.create(Error.prototype) as DisposalError;
DisposalError.prototype.constructor = DisposalError;

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

export const DISPOSED = new _Disposable();
DISPOSED.dispose();

// Used in implementing Sinks.
export function implDisposable<T>(
    value: T,
    disposable: Disposable,
): T & Disposable {
    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    Object.defineProperties(value, {
        [$$disposable]: { value: 'Disposable' },
        active: {
            get: () => disposable.active,
        },
        add: {
            value: (child: Disposable | Teardown): void =>
                disposable.add(child),
        },
        remove: {
            value: (child: Disposable | Teardown): void =>
                disposable.remove(child),
        },
        dispose: {
            value: (): void => disposable.dispose(),
        },
    });
    /* eslint-enable @typescript-eslint/no-non-null-assertion */
    return value as T & Disposable;
}

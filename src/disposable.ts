import { removeOnce, toArray } from './utils';

/**
 * Represents a function which when called disposes a resource.
 */
export interface Teardown {
    (): void;
}

/**
 * Disposes the given value. If it is a teardown then it will call the teardown.
 */
export function dispose(value: Disposable | Teardown): void {
    if (isDisposable(value)) {
        value.dispose();
    } else {
        value();
    }
}

/**
 * Tests to see if the value is a `Disposable`.
 */
export function isDisposable(value: unknown): value is Disposable {
    return value instanceof Disposable;
}

/**
 * Constructs a `Disposable` from a single `Teardown` value.
 */
export function fromTeardown(fn: Teardown): Disposable {
    return new Disposable([fn]);
}

/**
 * Represents a resource which can be disposed of using the `dispose` method.
 * Child `Disposables/Teardowns` can be linked/unlinked to a Disposable
 * instance through the `add` and `remove` methods, and when the instance is
 * disposed of, all of it's children will also be disposed of.
 */
export class Disposable {
    private __children: (Disposable | Teardown)[] | null;

    /**
     * @param children A list/iterable of `Disposables/Teardowns` to be
     * initially linked to this instance. Note: if the value given is an array,
     * the array will be mutated inside this instance.
     */
    constructor(children: Iterable<Disposable | Teardown> = []) {
        this.__children = toArray(children);
    }

    /**
     * A readonly boolean flag representing whether this instance is still
     * active. If the value is false, then the instance has already been
     * disposed.
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
     * Disposes this instance, as well as all the linked child
     * `Disposables/Teardowns`.
     */
    public dispose(): void {
        const children = this.__children;

        if (!children) {
            return;
        }

        const errors: any[] = [];

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

export interface DisposalError extends Error {
    readonly errors: any[];
}

export interface DisposalErrorConstructor {
    new (errors: any[]): DisposalError;
    readonly prototype: DisposalError;
}

/**
 * Thrown when at least one error is caught during a resource's disposal.
 */
export const DisposalError = (function (this: Error, errors: any[]) {
    Error.call(this);

    const flattenedErrors = flattenDisposalErrors(errors);
    const errorCount = flattenedErrors.length;

    const printedErrors = flattenedErrors
        .map((error, index) => `\n  [#${index + 1}] ${error}`)
        .join('');

    this.message = `Failed to dispose a resource. ${errorCount} ${
        flattenedErrors.length === 1 ? 'error was' : 'errors were'
    } caught.${printedErrors}`;

    this.name = 'DisposalError';
    (this as any).errors = flattenedErrors;
} as Function) as DisposalErrorConstructor;

function flattenDisposalErrors(errors: any[]): any[] {
    const flattened: any[] = [];

    errors.forEach((error) => {
        if (error instanceof DisposalError) {
            Array.prototype.push.apply(flattened, error.errors);
        } else {
            flattened.push(error);
        }
    });

    return flattened;
}

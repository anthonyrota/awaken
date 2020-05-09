import { removeOnce, toArray } from './utils';

/**
 * Represents a function which when called disposes a resource.
 */
export interface DisposeFunction {
    (): void;
}

/**
 * General representation of a resource/release function.
 */
export type DisposableLike = Disposable | DisposeFunction;

/**
 * Disposes the given value.
 * @param value The value to dispose.
 */
export function dispose(value: DisposableLike): void {
    if (isDisposable(value)) {
        value.dispose();
    } else {
        value();
    }
}

/**
 * Tests to see if the value is a `Disposable`.
 * @param value The value to check.
 */
export function isDisposable(value: unknown): value is Disposable {
    return value instanceof Disposable;
}

/**
 * Represents a resource which can be disposed of using the `dispose` method.
 * Child `DisposableLikes` can be linked/unlinked to a Disposable instance
 * through the `add` and `remove` methods, and when the instance is disposed of,
 * all of it's children will also be disposed of.
 */
export class Disposable {
    private __children: DisposableLike[] | null;

    /**
     * Constructs a `Disposable` from a single `DisposableLike` value.
     * @param child The DisposableLike to be initially linked.
     * @returns The created `Disposable` instance.
     */
    public static fromDisposable(child: DisposableLike): Disposable {
        return new Disposable([child]);
    }

    /**
     * @param children A list/iterable of DisposableLikes to be initially linked
     * to this instance. Note: if the value given is an array, the array will be
     * mutated inside this instance.
     */
    constructor(children: Iterable<DisposableLike> = []) {
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
     * Links the given `DisposableLike` to be called when this instance is
     * disposed. If this Disposable is already disposed, then the given
     * DisposableLike will be disposed immediately.
     *
     * In order to unlink the DisposableLike from this instance, simply call
     * this instance's `remove` method with the given DisposableLike as the
     * argument.
     * @param child The DisposableLike to link.
     */
    public add(child: DisposableLike): void {
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
     * Unlinks the given DisposableLike from this instance, preventing it from
     * being called when this instance is disposed.
     * @param child The child DisposableLike to unlink.
     */
    public remove(child: DisposableLike): void {
        if (!this.__children) {
            return;
        }

        removeOnce(this.__children, child);
    }

    /**
     * Disposes this instance, as well as all the linked child DisposableLikes.
     */
    public dispose(): void {
        const children = this.__children;

        if (!children) {
            return;
        }

        const errors: any[] = [];

        this.__children = null;

        children.forEach(child => {
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

/**
 * Thrown when at least one error is caught during a resource's disposal.
 */
export class DisposalError extends Error {
    public name: string;

    /**
     * The list of errors which have been caught. Note that any caught
     * DisposalError will have it's errors merged with the rest of the errors.
     */
    public errors: any[];

    /**
     * @param errors The list of errors which have been caught.
     */
    constructor(errors: unknown[]) {
        const flattenedErrors = flattenDisposalErrors(errors);
        const printedErrors = flattenedErrors
            .map((error, index) => `\n  [#${index + 1}] ${error}`)
            .join('');

        super(
            `Failed to dispose a resource. ${flattenedErrors.length} errors were caught.${printedErrors}`,
        );

        this.name = 'DisposalError';
        this.errors = flattenedErrors;
    }
}

/**
 * Flattens the list of errors given, merging all `DisposalError`s with the rest
 * of the errors given.
 * @param errors The list of errors to flatten.
 * @returns The flattened list of errors.
 */
function flattenDisposalErrors(errors: any[]): any[] {
    const flattened: any[] = [];

    errors.forEach(error =>
        error instanceof DisposalError
            ? Array.prototype.push.apply(flattened, error.errors)
            : flattened.push(error),
    );

    return flattened;
}

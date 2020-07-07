import { createCustomError, joinErrors } from './errorBase';
import { removeOnce, forEach } from './util';

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
    __children_(): _IDisposableImplementation[] | null;
    __prepareForDisposal(): void;
}

class _DisposableImplementation implements _IDisposableImplementation {
    private __children: _IDisposableImplementation[] | null = [];
    private __parents: _IDisposableImplementation[] | null = [];
    private __markedForDisposal = false;
    public [$$disposable]: typeof $$disposable_IdentifyingValue;

    constructor(private __onDispose?: () => void) {}

    public get active(): boolean {
        if (!this.__children) {
            return false;
        }
        // If a disposable is determined to not be active, it should be ensured
        // that it's dispose method was called.
        if (this.__markedForDisposal) {
            this.dispose();
            return false;
        }
        return true;
    }

    public __children_(): _IDisposableImplementation[] | null {
        return this.__children;
    }

    public add(child: _IDisposableImplementation): void {
        if (!this.__children) {
            child.dispose();
            return;
        }

        if (!child.__children_()) {
            return;
        }

        if (this.__markedForDisposal) {
            this.__children.push(child);
            // Already marked children as disposed -> have to manually here.
            child.__prepareForDisposal();
            this.dispose();
            return;
        }

        if (child === this) {
            return;
        }

        this.__children.push(child);
    }

    public remove(child: _IDisposableImplementation): void {
        if (this.__markedForDisposal) {
            // Note: Cannot remove the child if currently being disposed.
            return;
        }

        if (!child.__children_()) {
            return;
        }

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
        this.__prepareForDisposal();

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const parents = this.__parents!;
        const errors: unknown[] = [];

        this.__children = null;
        this.__parents = null;

        for (let i = 0; i < parents.length; i++) {
            parents[i].remove(this);
        }

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

    public __prepareForDisposal(): void {
        if (this.__markedForDisposal) {
            return;
        }
        this.__markedForDisposal = true;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const children = this.__children!;
        for (let i = 0; i < children.length; i++) {
            children[i].__prepareForDisposal();
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

export interface DisposalErrorConstructor {
    new (errors: unknown[]): DisposalError;
    prototype: DisposalError;
}

/**
 * Thrown when at least one error is caught during the disposal of a disposable.
 */
export const DisposalError: DisposalErrorConstructor = createCustomError(
    (self: _DisposalError, errors: unknown[]) => {
        const flattenedErrors = flattenDisposalErrors(errors);

        self.message = `Failed to dispose a resource. ${
            flattenedErrors.length
        } error${
            flattenedErrors.length === 1 ? ' was' : 's were'
        } caught.${joinErrors(flattenedErrors)}`;

        self.name = 'DisposalError';
        self.errors = flattenedErrors;
    },
);

function flattenDisposalErrors(errors: unknown[]): unknown[] {
    const flattened: unknown[] = [];

    forEach(errors, (error) => {
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

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const activeDescriptor = Object.getOwnPropertyDescriptor(
    _DisposableImplementation.prototype,
    'active',
)!;

// eslint-disable-next-line max-len
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/unbound-method
const activeGetter = activeDescriptor.get!;

/**
 * Implements the Disposable Interface onto the given value by proxying the
 * disposable methods & properties from the given value to the given disposable.
 * @param value The value to implement the Disposable Interface on.
 * @param disposable The disposable to proxy to.
 * @returns The given value which has been mutated. In strict javascript this is
 *     unnecessary but here it is useful as the returned value will have the
 *     type `T & Disposable`
 */
export function implDisposableMethods<T>(
    value: T,
    disposable: Disposable,
): T & Disposable {
    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (value as any)[$$disposable] = $$disposable_IdentifyingValue;

    if (disposable instanceof _DisposableImplementation) {
        Object.defineProperty(value, 'active', {
            get: activeGetter.bind(disposable),
            enumerable: false,
            configurable: true,
        });
        // eslint-disable-next-line max-len
        ((value as unknown) as _IDisposableImplementation).add = disposable.add.bind(
            disposable,
        );
        // eslint-disable-next-line max-len
        ((value as unknown) as _IDisposableImplementation).remove = disposable.remove.bind(
            disposable,
        );
        // eslint-disable-next-line max-len
        ((value as unknown) as _IDisposableImplementation).dispose = disposable.dispose.bind(
            disposable,
        );
        // eslint-disable-next-line max-len
        ((value as unknown) as _IDisposableImplementation).__children_ = disposable.__children_.bind(
            disposable,
        );
        // eslint-disable-next-line max-len
        ((value as unknown) as _IDisposableImplementation).__prepareForDisposal = disposable.__prepareForDisposal.bind(
            disposable,
        );
    } else {
        Object.defineProperty(value, 'active', activeDescriptor);
        /* eslint-disable @typescript-eslint/unbound-method */
        ((value as unknown) as _IDisposableImplementation).add = disposable.add;
        ((value as unknown) as _IDisposableImplementation).remove =
            disposable.remove;
        ((value as unknown) as _IDisposableImplementation).dispose =
            disposable.dispose;
        // eslint-disable-next-line max-len
        ((value as unknown) as _IDisposableImplementation).__children_ = (disposable as _IDisposableImplementation).__children_;
        // eslint-disable-next-line max-len
        ((value as unknown) as _IDisposableImplementation).__prepareForDisposal = (disposable as _IDisposableImplementation).__prepareForDisposal;
        /* eslint-enable @typescript-eslint/unbound-method */
    }
    return value as T & Disposable;
}

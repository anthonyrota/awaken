import { createCustomError, joinErrors } from './errorBase';
import { $$Disposable } from './symbols';
import { removeOnce, forEach } from './util';

interface DisposableBase<Self> {
    readonly active: boolean;
    add(child: Self): void;
    remove(child: Self): void;
    dispose(): void;
}

const enum DisposableImplementationIdentifier {
    RealDisposable,
    FakeDisposable,
}

export interface Disposable extends DisposableBase<Disposable> {
    [$$Disposable]: DisposableImplementationIdentifier;
}

interface DisposableImplementationBase
    extends DisposableBase<DisposableImplementationBase> {
    __children_: () => DisposableImplementationBase[] | null;
    __prepareForDisposal: () => void;
}

class RealDisposableImplementation implements DisposableImplementationBase {
    private __children: DisposableImplementationBase[] | null = [];
    private __parents: DisposableImplementationBase[] | null = [];
    private __markedForDisposal = false;
    // eslint-disable-next-line max-len
    public [$$Disposable]: DisposableImplementationIdentifier.RealDisposable =
        DisposableImplementationIdentifier.RealDisposable;

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

    public __children_(): DisposableImplementationBase[] | null {
        return this.__children;
    }

    public add(child: DisposableImplementationBase): void {
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

    public remove(child: DisposableImplementationBase): void {
        if (this.__markedForDisposal) {
            // Note that there are two cases here:
            //     1. We have already been disposed, which means we have no
            //            children and should return.
            //     2. We are being disposed.
            // There are two cases for case two:
            //     a. The child is not in our children's list and we should
            //            return.
            //     b. The child is in our children's list, meaning it has been
            //            marked for disposal, potentially under us, and
            //            therefore we cannot remove it to ensure that it does
            //            disposed.
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

interface FakeDisposableActiveDescriptor {
    get: () => boolean;
    enumerable: false;
    configurable: true;
}

interface FakeDisposableImplementation extends DisposableImplementationBase {
    [$$Disposable]: DisposableImplementationIdentifier.FakeDisposable;
    __activeDescriptor: FakeDisposableActiveDescriptor;
}

type DisposableImplementation =
    | RealDisposableImplementation
    | FakeDisposableImplementation;

/**
 * Implements the Disposable Interface onto the given value by copying the
 * disposable methods & properties from the given value to the given disposable.
 * @param value The value to implement the Disposable Interface on.
 * @param disposableImplementation The disposable to proxy to.
 * @returns The given value which has been mutated. In strict javascript this is
 *     unnecessary but here it is useful as the returned value will have the
 *     type `T & Disposable`
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function implDisposableMethods<T extends object>(
    value: T,
    disposable: Disposable,
): T & Disposable {
    // This gets optimized out.
    const fakeDisposable = (value as unknown) as FakeDisposableImplementation;
    // eslint-disable-next-line max-len
    const disposableImplementation = (disposable as unknown) as DisposableImplementation;

    // eslint-disable-next-line max-len
    fakeDisposable[$$Disposable] =
        DisposableImplementationIdentifier.FakeDisposable;

    if (
        disposableImplementation[$$Disposable] ===
        DisposableImplementationIdentifier.RealDisposable
    ) {
        const activeDescriptor: FakeDisposableActiveDescriptor = {
            get: activeGetter.bind(disposableImplementation),
            enumerable: false,
            configurable: true,
        };
        fakeDisposable.__activeDescriptor = activeDescriptor;
        Object.defineProperty(value, 'active', activeDescriptor);
        fakeDisposable.add = disposableImplementation.add.bind(
            disposableImplementation,
        );
        fakeDisposable.remove = disposableImplementation.remove.bind(
            disposableImplementation,
        );
        fakeDisposable.dispose = disposableImplementation.dispose.bind(
            disposableImplementation,
        );
        fakeDisposable.__children_ = disposableImplementation.__children_.bind(
            disposableImplementation,
        );
        // eslint-disable-next-line max-len
        fakeDisposable.__prepareForDisposal = disposableImplementation.__prepareForDisposal.bind(
            disposableImplementation,
        );
    } else {
        // eslint-disable-next-line max-len
        const activeDescriptor = (disposableImplementation as FakeDisposableImplementation)
            .__activeDescriptor;
        fakeDisposable.__activeDescriptor = activeDescriptor;
        Object.defineProperty(value, 'active', activeDescriptor);
        /* eslint-disable @typescript-eslint/unbound-method */
        fakeDisposable.add = disposableImplementation.add;
        fakeDisposable.remove = disposableImplementation.remove;
        fakeDisposable.dispose = disposableImplementation.dispose;
        fakeDisposable.__children_ = disposableImplementation.__children_;
        fakeDisposable.__prepareForDisposal =
            disposableImplementation.__prepareForDisposal;
        /* eslint-enable @typescript-eslint/unbound-method */
    }

    return (fakeDisposable as unknown) as T & Disposable;
}

interface DisposalErrorImplementation extends Error {
    errors: unknown[];
}

export interface DisposalError extends DisposalErrorImplementation {
    /**
     * The flattened list of errors thrown during disposal.
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
    (self: DisposalErrorImplementation, errors: unknown[]) => {
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
            // eslint-disable-next-line prefer-spread
            flattened.push.apply(flattened, error.errors);
        } else {
            flattened.push(error);
        }
    });

    return flattened;
}

export function Disposable(onDispose?: () => void): Disposable {
    return (new RealDisposableImplementation(
        onDispose,
    ) as unknown) as Disposable;
}

export function isDisposable(value: unknown): value is Disposable {
    if (value == null) {
        return false;
    }

    const implementationIdentifier = (value as DisposableImplementation)[
        $$Disposable
    ];

    return (
        implementationIdentifier ===
            DisposableImplementationIdentifier.RealDisposable ||
        implementationIdentifier ===
            DisposableImplementationIdentifier.FakeDisposable
    );
}

export const DISPOSED: Disposable = Disposable();
DISPOSED.dispose();

// eslint-disable-next-line max-len
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/unbound-method
const activeGetter = Object.getOwnPropertyDescriptor(
    RealDisposableImplementation.prototype,
    'active',
)!.get as () => boolean;

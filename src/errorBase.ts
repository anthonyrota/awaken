function shouldUseReflect(): boolean {
    return typeof Reflect !== 'undefined' && !!Reflect.construct;
}

export function setPrototypeOf(object: unknown, proto: unknown): void {
    if (Object.setPrototypeOf) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.setPrototypeOf(object, proto as any);
    } else {
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        (object as any).__proto__ = proto;
    }
}

export interface NativeErrorWrapped
    extends Omit<ErrorConstructor, 'prototype'> {
    prototype: NativeErrorWrapped;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const NativeErrorWrapped: NativeErrorWrapped = (function () {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { constructor } = Object.getPrototypeOf(this);
    if (shouldUseReflect()) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return Reflect.construct(Error, [], constructor);
    } else {
        const instance = new Error();
        if (constructor) {
            // eslint-disable-next-line max-len
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            setPrototypeOf(instance, constructor.prototype);
        }
        return instance;
    }
} as unknown) as NativeErrorWrapped;

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
NativeErrorWrapped.prototype = Object.create(Error.prototype, {
    constructor: {
        value: NativeErrorWrapped,
        writable: true,
        configurable: true,
    },
});

setPrototypeOf(NativeErrorWrapped, Error);

export function createSuper(
    Derived: unknown,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
    return function (this: unknown): unknown {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const Super = Object.getPrototypeOf(Derived);
        let constructedValue: unknown;

        if (shouldUseReflect()) {
            // eslint-disable-next-line max-len
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            const newTarget = Object.getPrototypeOf(this).constructor;
            // eslint-disable-next-line max-len
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, prefer-rest-params
            constructedValue = Reflect.construct(Super, arguments, newTarget);
        } else {
            // eslint-disable-next-line max-len
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, prefer-rest-params
            constructedValue = Super.apply(this, arguments);
        }

        if (
            constructedValue &&
            (typeof constructedValue === 'object' ||
                typeof constructedValue === 'function')
        ) {
            return constructedValue;
        } else {
            return this;
        }
    };
}

export function joinErrors(errors: unknown[]): string {
    const lastPrefixLength = `  [#${errors.length}] `.length;
    const multilineErrorPrefix = '\n' + Array(lastPrefixLength + 1).join(' ');

    return errors
        .map((error, index) => {
            const prefix_ = `  [#${index}] `;
            const prefix =
                '\n' +
                Array(lastPrefixLength - prefix_.length + 1).join(' ') +
                prefix_;

            const displayedError = `${
                // eslint-disable-next-line max-len
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                error instanceof Error && error.stack ? error.stack : error
            }`;

            return (
                prefix +
                displayedError.split(/\r\n|\r|\n/).join(multilineErrorPrefix)
            );
        })
        .join('');
}

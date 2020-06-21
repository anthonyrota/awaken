export function createCustomError<T extends unknown[]>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initiate: (self: any, ...args: T) => void,
    // eslint-disable-next-line @typescript-eslint/ban-types
): {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    new (...args: T): any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prototype: any;
} {
    function CustomError(...args: T) {
        if (typeof Reflect !== 'undefined' && Reflect.construct) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const self = Reflect.construct(Error, [], new.target);
            initiate(self, ...args);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return self;
        } else {
            initiate(this, ...args);
            // eslint-disable-next-line max-len
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            const _error = new Error(this.message);
            // eslint-disable-next-line max-len
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            _error.name = this.name;
            if (_error.stack) {
                // eslint-disable-next-line max-len
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                this.stack = _error.stack;
            }
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    CustomError.prototype = Object.create(Error.prototype, {
        constructor: {
            value: CustomError,
            writable: true,
            configurable: true,
        },
    });

    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
    return CustomError as any;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Symbol_(name: string): any {
    if (typeof Symbol !== 'undefined') {
        return Symbol(name);
    }
    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
    return `__$$_symbol_${name}_$$__` as any;
}

const prefix = '@awaken/';
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const $$Disposable: unique symbol = Symbol_(prefix + 'Disposable');
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const $$Source: unique symbol = Symbol_(prefix + 'Source');
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const $$Sink: unique symbol = Symbol_(prefix + 'Sink');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Symbol_(name: string): any {
    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
    return `__$$_awaken_symbol_${name}_$$__` as any;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const $$Disposable: unique symbol = Symbol_('Disposable');
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const $$Source: unique symbol = Symbol_('Source');
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const $$Sink: unique symbol = Symbol_('Sink');

export class Cancelable {
    private __subscribers: (() => void)[] = [];
    public token: CancelToken = new __CancelToken(this.__subscribers);

    public cancel(): void {
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        (this.token as any).__subscribers = null;
        this.__subscribers.forEach((cb) => {
            cb();
        });
    }
}

export interface CancelToken {
    readonly canceled: boolean;
    onCancel(cb: () => void): void;
}

class __CancelToken implements CancelToken {
    constructor(private __subscribers: (() => void)[] | null) {}

    public get canceled(): boolean {
        return !this.__subscribers;
    }

    public onCancel(cb: () => void) {
        if (this.__subscribers) {
            this.__subscribers.push(cb);
        } else {
            cb();
        }
    }
}

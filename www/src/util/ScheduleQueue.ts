import { CancelToken } from './Cancelable';
import { schedule, IDeadline } from './schedule';

export class ScheduleQueue {
    private __tasks: (() => void)[] = [];
    private __isQueued = false;

    constructor(private __cancelToken: CancelToken) {}

    public queueTask(task: () => void): void {
        if (this.__cancelToken.canceled) {
            return;
        }
        this.__tasks.push(task);
        this.__ensureQueued();
    }

    private __ensureQueued(): void {
        if (this.__cancelToken.canceled) {
            return;
        }
        if (!this.__isQueued) {
            this.__isQueued = true;
            schedule(this.__cancelToken, (deadline) => {
                this.__execute(deadline);
            });
        }
    }

    private __execute(deadline: IDeadline): void {
        while (this.__tasks.length !== 0 && deadline.timeRemaining() > 0) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.__tasks.shift()!();
        }

        this.__isQueued = false;
        if (this.__tasks.length !== 0) {
            this.__ensureQueued();
        }
    }
}

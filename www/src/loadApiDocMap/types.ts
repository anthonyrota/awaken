import { PageNodeMapWithMetadata } from '../../script/docs/apigen/types';

export const ResponseLoadingType = 0;
export const ResponseHttpStatusErrorType = 1;
export const ResponseJSONParsingErrorType = 2;
export const ResponseDoneType = 3;

export type ResponseState =
    | { type: typeof ResponseLoadingType }
    | {
          type: typeof ResponseHttpStatusErrorType;
          status: number;
          statusText: string;
      }
    | { type: typeof ResponseJSONParsingErrorType; error: unknown }
    | { type: typeof ResponseDoneType; data: PageNodeMapWithMetadata };

const globalStateKey = '__apiDocMapState';
const globalCallbackKey = globalStateKey + 'Changed';

export function getCurrentState(): ResponseState | undefined {
    return window[globalStateKey] as ResponseState | undefined;
}

type CallbackList = (readonly [(newState: ResponseState) => void])[];

export function changeGlobalState(newState: ResponseState): void {
    window[globalStateKey] = newState;
    if (globalCallbackKey in window) {
        (window[globalCallbackKey] as CallbackList).forEach((cbBox) => {
            const cb = cbBox[0];
            cb(newState);
        });
    }
}

export function onGlobalStateChange(
    cb: (newState: ResponseState) => void,
): () => void {
    if (!(globalCallbackKey in window)) {
        window[globalCallbackKey] = [];
    }
    // Ensure that adding the same callback twice will call it twice.
    const cbBox = [cb] as const;
    (window[globalCallbackKey] as CallbackList).push(cbBox);
    return () => {
        const index = (window[globalCallbackKey] as CallbackList).indexOf(
            cbBox,
        );
        if (index !== -1) {
            (window[globalCallbackKey] as CallbackList).splice(index, 1);
        }
    };
}

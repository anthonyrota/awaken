import * as fs from 'fs';
import { PagesWithMetadata } from '../../script/docs/types';

export const ResponseLoadingType = 0;
export const ResponseHttpStatusErrorType = 1;
export const ResponseJSONParsingErrorType = 2;
export const ResponseDoneType = 3;

export type NonLoadingResponseState =
    | {
          type: typeof ResponseHttpStatusErrorType;
          status: number;
          statusText: string;
      }
    | { type: typeof ResponseJSONParsingErrorType; error: unknown }
    | { type: typeof ResponseDoneType; data: PagesWithMetadata };
export type ResponseState =
    | { type: typeof ResponseLoadingType }
    | NonLoadingResponseState;

const globalStateKey =
    process.env.NODE_ENV === 'development' ? '__apiDocMapState' : '_a';
const globalCallbackKey =
    process.env.NODE_ENV === 'development' ? globalStateKey + 'Changed' : '_b';

export function getGlobalState(): ResponseState {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return window[globalStateKey];
}

function setGlobalState(responseState: ResponseState): void {
    window[globalStateKey] = responseState;
}

type CallbackList = (readonly [
    (responseState: NonLoadingResponseState) => void,
])[];

export function onGlobalStateChange(
    cb: (responseState: NonLoadingResponseState) => void,
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

function changeGlobalState(responseState: NonLoadingResponseState): void {
    setGlobalState(responseState);
    if (globalCallbackKey in window) {
        (window[globalCallbackKey] as CallbackList).forEach((cbBox) => {
            const cb = cbBox[0];
            cb(responseState);
        });
    }
}

export function makeRequest(): void {
    setGlobalState({
        type: ResponseLoadingType,
    });

    const request = new XMLHttpRequest();

    request.onreadystatechange = function () {
        if (request.readyState !== 4) return;

        if (request.status < 200 || request.status >= 300) {
            changeGlobalState({
                type: ResponseHttpStatusErrorType,
                status: request.status,
                statusText: request.statusText,
            });
            return;
        }

        let data: PagesWithMetadata;

        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            data = JSON.parse(request.responseText);
        } catch (error) {
            changeGlobalState({
                type: ResponseJSONParsingErrorType,
                // eslint-disable-next-line max-len
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                error,
            });
            return;
        }

        changeGlobalState({
            type: ResponseDoneType,
            data,
        });
    };

    const hash = fs.readFileSync('temp/pagesHash', 'utf-8');
    request.open('GET', `/pages.${hash}.json`);
    request.send();
}

import * as fs from 'fs';
import { PagesMetadata, Pages } from '../../script/docs/types';
import {
    globalPagesStateKey,
    globalPagesCallbackKey,
    globalOnResponseStateChangeKey,
    globalPagesMetadataKey,
} from '../globalKeys';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const getPagesMetadata = (): PagesMetadata =>
    global[globalPagesMetadataKey] as PagesMetadata;

export const getGithubUrl = (): string => {
    const { github } = getPagesMetadata();
    return github
        ? `https://github.com/${github.org}/${github.repo}/tree/${github.sha}`
        : 'https://github.com/anthonyrota/microstream';
};

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
    | { type: typeof ResponseDoneType; pages: Pages };
export type ResponseState =
    | { type: typeof ResponseLoadingType }
    | NonLoadingResponseState;

function setGlobalState(responseState: ResponseState): void {
    window[globalPagesStateKey] = responseState;
}

type CallbackList = (readonly [
    (responseState: NonLoadingResponseState) => void,
])[];

export type OnGlobalStateChangeFunction = (
    cb: (responseState: NonLoadingResponseState) => void,
) => () => void;

export const getCurrentResponseState = () =>
    global[globalPagesStateKey] as ResponseState;
export const getOnResponseStateChangeFunction = () =>
    global[globalOnResponseStateChangeKey] as OnGlobalStateChangeFunction;

export function setupOnGlobalStateChange(): void {
    const onGlobalStateChange: OnGlobalStateChangeFunction = (cb) => {
        if (!(globalPagesCallbackKey in window)) {
            window[globalPagesCallbackKey] = [];
        }
        // Ensure that adding the same callback twice will call it twice.
        const cbBox = [cb] as const;
        (window[globalPagesCallbackKey] as CallbackList).push(cbBox);
        return () => {
            const index = (window[
                globalPagesCallbackKey
            ] as CallbackList).indexOf(cbBox);
            if (index !== -1) {
                (window[globalPagesCallbackKey] as CallbackList).splice(
                    index,
                    1,
                );
            }
        };
    };
    window[globalOnResponseStateChangeKey] = onGlobalStateChange;
}

function changeGlobalState(responseState: NonLoadingResponseState): void {
    setGlobalState(responseState);
    if (globalPagesCallbackKey in window) {
        (window[globalPagesCallbackKey] as CallbackList).forEach((cbBox) => {
            const cb = cbBox[0];
            cb(responseState);
        });
    }
}

export function makeRequest(): void {
    if (process.env.NODE_ENV === 'development') {
        setGlobalState({
            type: ResponseDoneType,
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            pages: require('../../temp/pages.json') as Pages,
        });
        return;
    }

    setGlobalState({
        type: ResponseLoadingType,
    });

    const request = new XMLHttpRequest();

    request.onreadystatechange = function () {
        if (request.readyState !== 4) return;

        if (request.status < 200 || request.status >= 300) {
            // TODO: report errors.
            changeGlobalState({
                type: ResponseHttpStatusErrorType,
                status: request.status,
                statusText: request.statusText,
            });
            return;
        }

        let data: Pages;

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
            pages: data,
        });
    };

    const pagesHash = fs.readFileSync('temp/pagesHash', 'utf-8');
    request.open('GET', `/pages.${pagesHash}.json`);
    request.send();
}

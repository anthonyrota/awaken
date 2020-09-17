import { h, render } from 'preact';
import {
    apiDocMapPathList,
    convertApiDocMapPathToUrlPathName,
} from './apiDocMapPathList';
import {
    ApiDocMapResponseContextProvider,
    ApiDocMapResponseContextValue,
} from './ApiDocMapResponseContext';
import { App } from './App';
import {
    NonLoadingResponseState,
    getGlobalState,
    onGlobalStateChange,
    ResponseDoneType,
    ResponseHttpStatusErrorType,
    ResponseJSONParsingErrorType,
    ResponseLoadingType,
} from './loadApiDocMap';

const apiDocMapResponseContextValue: ApiDocMapResponseContextValue = {
    getCurrentResponseState: getGlobalState,
    onResponseStateChange: onGlobalStateChange,
};

function renderApp(): void {
    render(
        <ApiDocMapResponseContextProvider value={apiDocMapResponseContextValue}>
            <App />
        </ApiDocMapResponseContextProvider>,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        document.getElementById('root')!,
    );
}

function isApiDocMapPath(path: string): boolean {
    return apiDocMapPathList.some((apiDocMapPath) => {
        const otherPath = convertApiDocMapPathToUrlPathName(apiDocMapPath);
        return (
            path === otherPath ||
            path === otherPath + '/' ||
            path === otherPath + 'index.html' ||
            path === otherPath + 'index.html/'
        );
    });
}

if (isApiDocMapPath(window.location.pathname)) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const responseState = getGlobalState()!;

    const onNonLoadingResponseState = (
        responseState: NonLoadingResponseState,
    ): void => {
        switch (responseState.type) {
            case ResponseDoneType: {
                renderApp();
                break;
            }
            case ResponseHttpStatusErrorType: {
                throw new Error(
                    [
                        'error fetching api doc map',
                        responseState.status,
                        responseState.statusText,
                    ]
                        .filter(Boolean)
                        .join(' '),
                );
            }
            case ResponseJSONParsingErrorType: {
                throw new Error(
                    // eslint-disable-next-line max-len
                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                    `error parsing fetched api doc map ${responseState.error}`,
                );
            }
        }
    };

    if (responseState.type === ResponseLoadingType) {
        onGlobalStateChange(onNonLoadingResponseState);
    } else {
        onNonLoadingResponseState(responseState);
    }
} else {
    renderApp();
}

import { h, render } from 'preact';
import { App } from './App';
import {
    NonLoadingResponseState,
    getGlobalState,
    onGlobalStateChange,
    ResponseDoneType,
    ResponseHttpStatusErrorType,
    ResponseJSONParsingErrorType,
    ResponseLoadingType,
} from './docPages/request';
import {
    DocPagesResponseContextProvider,
    DocPagesResponseContextValue,
} from './docPages/responseContext';
import { docPageUrls, convertDocPageUrlToUrlPathName } from './docPages/urls';

const docPagesResponseContextValue: DocPagesResponseContextValue = {
    getCurrentResponseState: getGlobalState,
    onResponseStateChange: onGlobalStateChange,
};

function renderApp(): void {
    render(
        <DocPagesResponseContextProvider value={docPagesResponseContextValue}>
            <App />
        </DocPagesResponseContextProvider>,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        document.getElementById('root')!,
    );
}

function isDocPageUrl(pageUrl: string): boolean {
    return docPageUrls.some((docPageUrl) => {
        const otherPath = convertDocPageUrlToUrlPathName(docPageUrl);
        return pageUrl === otherPath || pageUrl === otherPath + '/';
    });
}

if (isDocPageUrl(window.location.pathname)) {
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

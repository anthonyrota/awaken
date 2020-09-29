import { h, render } from 'preact';
import { App } from './App';
import { docPageUrls } from './docPages/dynamicData';
import {
    getGlobalState,
    onGlobalStateChange,
    ResponseLoadingType,
} from './docPages/request';
import {
    DocPagesResponseContextProvider,
    DocPagesResponseContextValue,
} from './docPages/responseContext';

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
        const otherPath = `/${docPageUrl}`;
        return pageUrl === otherPath || pageUrl === otherPath + '/';
    });
}

if (isDocPageUrl(window.location.pathname)) {
    if (getGlobalState().type === ResponseLoadingType) {
        onGlobalStateChange(renderApp);
    } else {
        renderApp();
    }
} else {
    renderApp();
}

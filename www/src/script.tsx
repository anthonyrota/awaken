import { h, render } from 'preact';
import { App } from './App';
import { docPageUrls } from './docPages/dynamicData';
import {
    getCurrentResponseState,
    getOnResponseStateChangeFunction,
    ResponseLoadingType,
    setupOnGlobalStateChange,
} from './docPages/request';

setupOnGlobalStateChange();

function renderApp(): void {
    render(
        <App />,
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
    if (getCurrentResponseState().type === ResponseLoadingType) {
        getOnResponseStateChangeFunction()(renderApp);
    } else {
        renderApp();
    }
} else {
    renderApp();
}

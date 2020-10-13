/// <reference types="webpack-env" />

import { h, render } from 'preact';
import { App } from './App';
import {
    getPagesMetadata,
    getCurrentResponseState,
    getOnResponseStateChangeFunction,
    ResponseLoadingType,
    setupOnGlobalStateChange,
} from './data/docPages';

if (process.env.NODE_ENV === 'development') {
    require('preact/debug');
}

function onDOMReady(cb: () => void): void {
    if (
        document.readyState === 'complete' ||
        document.readyState === 'interactive'
    ) {
        setTimeout(cb);
    } else {
        document.addEventListener('DOMContentLoaded', cb);
    }
}

function onAllResourcesLoaded(cb: () => void): void {
    if (document.readyState === 'complete') {
        setTimeout(cb);
    } else {
        window.addEventListener('load', cb);
    }
}

onDOMReady(() => {
    setupOnGlobalStateChange();

    function renderApp(): void {
        render(
            <App />,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            document.getElementById('root')!,
        );
    }

    function isDocPagePath(pageUrl: string): true | void {
        const { pageIdToWebsitePath } = getPagesMetadata();
        for (const pageId in pageIdToWebsitePath) {
            const docPagePath = `/${pageIdToWebsitePath[pageId]}`;
            if (pageUrl === docPagePath || pageUrl === docPagePath + '/') {
                return true;
            }
        }
    }

    if (isDocPagePath(window.location.pathname)) {
        if (getCurrentResponseState().type === ResponseLoadingType) {
            getOnResponseStateChangeFunction()(renderApp);
        } else {
            renderApp();
        }
    } else {
        renderApp();
    }

    if (module.hot) {
        module.hot.accept('./App', renderApp);
    }
});

if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    onAllResourcesLoaded(() => {
        // IMPORTANT: parcel uses a regexp along the lines of nav.sw.register(*)
        // to detect and transform service worker modules, but we want to handle
        // them ourselves, hence splitting up the following lines.
        const swUrl = '/sw.js';
        navigator.serviceWorker.register(swUrl).catch((error) => {
            console.log('ServiceWorker registration failed: ', error);
        });
    });
}

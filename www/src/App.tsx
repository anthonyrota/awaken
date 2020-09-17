import { h, Fragment, VNode } from 'preact';
import { Router, Route, RouterOnChangeArgs } from 'preact-router';
import { useMemo } from 'preact/hooks';
import {
    apiDocMapPathList,
    convertApiDocMapPathToUrlPathName,
} from './apiDocMapPathList';
import { useApiDocMapResponseState } from './ApiDocMapResponseContext';
import {
    ResponseDoneType,
    ResponseHttpStatusErrorType,
    ResponseJSONParsingErrorType,
    ResponseLoadingType,
} from './loadApiDocMap';

export function IndexPage(): VNode {
    return <div>index</div>;
}

interface ApiDocPageProps {
    pagePath: string;
}

export function ApiDocPage({ pagePath }: ApiDocPageProps): VNode {
    const responseState = useApiDocMapResponseState();
    const stringifiedNodeMap = useMemo(
        () =>
            responseState.type === ResponseDoneType
                ? JSON.stringify(
                      responseState.data.pageNodeMap[pagePath],
                      null,
                      4,
                  )
                : null,
        [responseState],
    );

    switch (responseState.type) {
        case ResponseLoadingType: {
            return <p>Loading...</p>;
        }
        case ResponseHttpStatusErrorType: {
            console.log(
                'error fetching api doc map',
                responseState.status,
                responseState.statusText,
            );
            return <p>Internal Error.</p>;
        }
        case ResponseJSONParsingErrorType: {
            console.log(
                'error parsing fetched api doc map',
                responseState.error,
            );
            return <p>Internal Error.</p>;
        }
        case ResponseDoneType: {
            const { github } = responseState.data.metadata;
            let headingContents: VNode | string = 'AwakenJS';
            if (github) {
                const githubLink = `https://github.com/${github.org}/${github.repo}/tree/${github.sha}`;
                headingContents = <a href={githubLink}>{githubLink}</a>;
            }
            return (
                <Fragment>
                    <h1>{headingContents}</h1>
                    <br />
                    <pre>{stringifiedNodeMap}</pre>
                </Fragment>
            );
        }
    }
}

export function NotFoundPage(): VNode {
    return <div>404</div>;
}

function endsWithTrailingSlash(url: string): boolean {
    return url[url.length - 1] === '/' && url !== '/';
}

function cleanUrlTrailingSlash(url: string): string | undefined {
    if (endsWithTrailingSlash(url)) {
        do {
            url = url.slice(0, -1);
        } while (endsWithTrailingSlash(url));
        return url;
    }
    return;
}

function cleanUrlTrailingString(url: string, str: string): string | undefined {
    if (url.slice(-str.length) === str) {
        return url.slice(0, -str.length);
    }
    return;
}

function cleanUrlTrailingIndexHtml(url: string): string | undefined {
    return cleanUrlTrailingString(url, '/index.html');
}

function cleanUrlTrailingHtmlExtension(url: string): string | undefined {
    return cleanUrlTrailingString(url, '.html');
}

function cleanUrl({ url }: RouterOnChangeArgs) {
    const withoutTrailingSlashOrUndefined = cleanUrlTrailingSlash(url);
    const withoutTrailingSlash = withoutTrailingSlashOrUndefined || url;
    const newUrl =
        cleanUrlTrailingIndexHtml(withoutTrailingSlash) ||
        cleanUrlTrailingHtmlExtension(withoutTrailingSlash) ||
        withoutTrailingSlashOrUndefined;

    if (newUrl) {
        history.pushState(null, (null as unknown) as string, newUrl);
    }
}

export function App(): VNode {
    return (
        <Router onChange={cleanUrl}>
            <Route path="/" component={IndexPage} />
            <Route path="/index.html" component={IndexPage} />
            {Array.prototype.concat.apply<VNode[], VNode[][], VNode[]>(
                [],
                apiDocMapPathList.map((apiDocMapPath) => {
                    const path = convertApiDocMapPathToUrlPathName(
                        apiDocMapPath,
                    );
                    return [
                        <Route
                            path={path}
                            component={ApiDocPage}
                            pagePath={apiDocMapPath}
                        />,
                        <Route
                            path={`${path}.html`}
                            component={ApiDocPage}
                            pagePath={apiDocMapPath}
                        />,
                        <Route
                            path={`${path}/index.html`}
                            component={ApiDocPage}
                            pagePath={apiDocMapPath}
                        />,
                    ];
                }),
            )}
            <Route default component={NotFoundPage} />
        </Router>
    );
}

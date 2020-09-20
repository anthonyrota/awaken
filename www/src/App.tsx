import { h, Fragment, VNode } from 'preact';
import { Router, RouterProps, Route, RouterOnChangeArgs } from 'preact-router';
import { useMemo } from 'preact/hooks';
import { useDocPagesResponseState } from './DocPagesResponseContext';
import { docPageUrls, convertDocPageUrlToUrlPathName } from './docPageUrls';
import {
    ResponseDoneType,
    ResponseHttpStatusErrorType,
    ResponseJSONParsingErrorType,
    ResponseLoadingType,
} from './loadDocPages';

export function IndexPage(): VNode {
    return <div>index</div>;
}

interface DocPageProps {
    pageUrl: string;
}

export function DocPage({ pageUrl }: DocPageProps): VNode {
    const responseState = useDocPagesResponseState();
    const stringifiedNodeMap = useMemo(
        () =>
            responseState.type === ResponseDoneType
                ? JSON.stringify(
                      responseState.data.pages.filter(
                          (page) => page.pageUrl === pageUrl,
                      )[0],
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

function cleanUrlTrailingSlash({ url }: RouterOnChangeArgs): void {
    if (endsWithTrailingSlash(url)) {
        do {
            url = url.slice(0, -1);
        } while (endsWithTrailingSlash(url));
        history.pushState(null, (null as unknown) as string, url);
    }
}

function Header(): VNode {
    return (
        <Fragment>
            header placeholder
            <br />
        </Fragment>
    );
}

export interface AppProps extends Omit<RouterProps, 'onChange'> {}

export function App(props: AppProps): VNode {
    return (
        <Fragment>
            <Header />
            <Router onChange={cleanUrlTrailingSlash} {...props}>
                <Route path="/" component={IndexPage} />
                {docPageUrls.map((docPageUrl) => (
                    <Route
                        path={convertDocPageUrlToUrlPathName(docPageUrl)}
                        component={DocPage}
                        pageUrl={docPageUrl}
                    />
                ))}
                <Route default component={NotFoundPage} />
            </Router>
        </Fragment>
    );
}

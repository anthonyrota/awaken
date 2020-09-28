import { h, Fragment, VNode } from 'preact';
import { Router, RouterProps, Route, RouterOnChangeArgs } from 'preact-router';
import { Header } from './components/Header';
import { pageIdToWebsitePath } from './docPages/pageIdToWebsitePath';
import { DocPage } from './routes/DocPage';
import { IndexPage } from './routes/IndexPage';
import { NotFoundPage } from './routes/NotFoundPage';

function endsWithTrailingSlash(url: string): boolean {
    return url[url.length - 1] === '/' && url !== '/';
}

function cleanUrlTrailingSlash({ url }: RouterOnChangeArgs): void {
    if (endsWithTrailingSlash(url)) {
        do {
            url = url.slice(0, -1);
        } while (endsWithTrailingSlash(url));
        // Title (2nd parameter) can be null but TypeScript doesn't like that.
        history.pushState(null, (null as unknown) as string, url);
    }
}

export interface AppProps extends Omit<RouterProps, 'onChange'> {}

export function App(props: AppProps): VNode {
    return (
        <Fragment>
            <Header />
            <Router onChange={cleanUrlTrailingSlash} {...props}>
                <Route path="/" component={IndexPage} />
                {Object.keys(pageIdToWebsitePath).map((pageId) => {
                    const pagePath = pageIdToWebsitePath[pageId];
                    return [
                        <Route
                            path={`/${pagePath}`}
                            component={DocPage}
                            pageId={pageId}
                        />,
                        <Route
                            path={`/${pagePath}/`}
                            component={DocPage}
                            pageId={pageId}
                        />,
                    ];
                })}
                <Route default component={NotFoundPage} />
            </Router>
        </Fragment>
    );
}

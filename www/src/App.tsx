import { h, Fragment, VNode } from 'preact';
import { Router, RouterProps, Route, RouterOnChangeArgs } from 'preact-router';
import { Header } from './components/Header';
import { docPageUrls, convertDocPageUrlToUrlPathName } from './docPages/urls';
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

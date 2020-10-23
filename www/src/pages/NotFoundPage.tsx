import { h, Fragment, VNode } from 'preact';
import { DocumentTitle } from '../Head';

export function NotFoundPage(): VNode {
    return (
        <Fragment>
            <DocumentTitle title="404: Page not found" />
            <main class="cls-page__content__container">404</main>
        </Fragment>
    );
}

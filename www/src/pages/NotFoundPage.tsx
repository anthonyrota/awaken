import { h, Fragment, VNode } from 'preact';
import { DocumentTitle } from '../Head';

export function NotFoundPage(): VNode {
    return (
        <Fragment>
            <DocumentTitle title="404: Page not found · Microstream JS" />
            <div>404</div>
        </Fragment>
    );
}

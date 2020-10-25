import { h, Fragment, VNode } from 'preact';
import { DocumentTitle } from '../Head';
import { AppPathBaseProps } from './base';

export interface NotFoundPageProps extends AppPathBaseProps {}

export function NotFoundPage({ mainRef }: NotFoundPageProps): VNode {
    return (
        <Fragment>
            <DocumentTitle title="404: Page not found" />
            <main class="cls-page__content__container" ref={mainRef}>
                404
            </main>
        </Fragment>
    );
}

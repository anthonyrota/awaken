import { h, Fragment, VNode } from 'preact';
import { DocumentTitle, WebsiteNamePositionStart } from '../Head';
import { AppPathBaseProps } from './base';

export interface IndexPageProps extends AppPathBaseProps {}

export function IndexPage({ mainRef }: IndexPageProps): VNode {
    return (
        <Fragment>
            <DocumentTitle
                title="A fast and extremely lightweight reactive programming library for TypeScript"
                websiteNamePosition={WebsiteNamePositionStart}
            />
            <main class="cls-page__content__container" ref={mainRef}>
                index
            </main>
        </Fragment>
    );
}

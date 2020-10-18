import { h, Fragment, VNode } from 'preact';
import { DocumentTitle, WebsiteNamePositionStart } from '../Head';

export function IndexPage(): VNode {
    return (
        <Fragment>
            <DocumentTitle
                title="A fast and extremely lightweight reactive programming library for TypeScript"
                websiteNamePosition={WebsiteNamePositionStart}
            />
            index
        </Fragment>
    );
}

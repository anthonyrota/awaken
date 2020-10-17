import { h, Fragment, VNode } from 'preact';
import { DocumentTitle } from '../Head';

export function IndexPage(): VNode {
    return (
        <Fragment>
            <DocumentTitle title="Microstream JS · A fast and extremely lightweight reactive programming library for TypeScript" />
            <div>index</div>
        </Fragment>
    );
}

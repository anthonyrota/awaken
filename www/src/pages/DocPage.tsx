import { h, Fragment, VNode } from 'preact';
// import { useDocPagesResponseState } from '../hooks/useDocPagesResponseState';

export interface DocPageProps {
    pageId: string;
}

export function DocPage({ pageId }: DocPageProps): VNode | null {
    // const responseState = useDocPagesResponseState();
    pageId;

    return (
        <Fragment>
            {Array.from({ length: 1000 }, () => (
                <br />
            ))}
        </Fragment>
    );
}

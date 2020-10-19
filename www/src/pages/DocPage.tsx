import { h, Fragment, VNode } from 'preact';
import { getPagesMetadata } from '../data/docPages';
import { DocumentTitle } from '../Head';
// import { useDocPagesResponseState } from '../hooks/useDocPagesResponseState';

export interface DocPageProps {
    pageId: string;
}

export function DocPage({ pageId }: DocPageProps): VNode | null {
    // const responseState = useDocPagesResponseState();
    const { pageIdToPageTitle } = getPagesMetadata();

    pageId;

    return (
        <Fragment>
            <DocumentTitle title={pageIdToPageTitle[pageId]} />
            {Array.from({ length: 10 }, () => (
                <p>
                    {Array.from(
                        { length: Math.floor(Math.random() * 300) + 150 },
                        () =>
                            [
                                'foo',
                                'bar',
                                'baz',
                                'lorem',
                                'ipsum',
                                'cat',
                                'dog',
                            ][Math.floor(Math.random() * 7)],
                    ).join(' ')}
                </p>
            ))}
        </Fragment>
    );
}

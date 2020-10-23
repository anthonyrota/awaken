import { h, Fragment, VNode } from 'preact';
import { DeepCoreNode } from '../../script/docs/core/nodes';
import { PageNode } from '../../script/docs/core/nodes/Page';
import { getPagesMetadata, ResponseDoneType } from '../data/docPages';
import { DocumentTitle } from '../Head';
import { useDocPagesResponseState } from '../hooks/useDocPagesResponseState';

export interface DocPageProps {
    pageId: string;
}

const { pageIdToPageTitle } = getPagesMetadata();

export function DocPage({ pageId }: DocPageProps): VNode | null {
    const responseState = useDocPagesResponseState();

    return (
        <Fragment>
            <DocumentTitle title={pageIdToPageTitle[pageId]} />
            {responseState.type === ResponseDoneType ? (
                <DocPageContent
                    page={
                        responseState.pages.filter(
                            (page) => page.pageId === pageId,
                        )[0]
                    }
                />
            ) : null}
        </Fragment>
    );
}

interface DocPageContentProps {
    page: PageNode<DeepCoreNode>;
}

function DocPageContent({ page }: DocPageContentProps): VNode {
    return (
        <div class="cls-page__content__container cls-doc-page">
            <main class="cls-doc-page__main">
                <h1 class="cls-doc-page__title">
                    {pageIdToPageTitle[page.pageId]}
                </h1>
            </main>
            <aside class="cls-doc-page__table-of-contents"></aside>
        </div>
    );
}

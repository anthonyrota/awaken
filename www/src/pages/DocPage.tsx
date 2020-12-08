import { h, Fragment, VNode } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { DeepCoreNode } from '../../script/docs/core/nodes';
import { PageNode } from '../../script/docs/core/nodes/Page';
import { TableOfContentsMainReference } from '../../script/docs/types';
import { DeepCoreNodeComponent } from '../components/DeepCoreNode';
import { DocPageLink } from '../components/DocPageLink';
import { getPagesMetadata, ResponseDoneType } from '../data/docPages';
import { DocumentTitle } from '../Head';
import { useDocPagesResponseState } from '../hooks/useDocPagesResponseState';
import {
    BindKeysRequireFocus,
    fixChromiumFocusClass,
    useNavigationListKeyBindings,
} from '../hooks/useNavigationListKeyBindings';
import { useSticky, UseStickyJsStickyActive } from '../hooks/useSticky';
import { findIndex } from '../util/findIndex';
import { AppPathBaseProps } from './base';

export interface DocPageProps extends AppPathBaseProps {
    pageId: string;
}

const {
    pageIdToPageTitle,
    pageIdToWebsitePath,
    pageGroups,
} = getPagesMetadata();

const pageOrder: string[] = [];
pageGroups.forEach((group) => {
    group.pageIds.forEach((pageId) => {
        pageOrder.push(pageId);
    });
});

export function DocPage({ mainRef, pageId }: DocPageProps): VNode | null {
    const responseState = useDocPagesResponseState();
    const titleEl = <DocumentTitle title={pageIdToPageTitle[pageId]} />;

    if (responseState.type !== ResponseDoneType) {
        return titleEl;
    }

    const pageOrderIndex = findIndex(
        pageOrder,
        (pageId_) => pageId === pageId_,
    );

    return (
        <Fragment>
            {titleEl}
            <DocPageContent
                mainRef={mainRef}
                page={
                    responseState.pages.filter(
                        (page) => page.pageId === pageId,
                    )[0]
                }
                previousPageId={
                    pageOrderIndex === 0
                        ? undefined
                        : pageOrder[pageOrderIndex - 1]
                }
                nextPageId={
                    pageOrderIndex === pageOrder.length - 1
                        ? undefined
                        : pageOrder[pageOrderIndex + 1]
                }
            />
        </Fragment>
    );
}

export interface DocPageContentProps {
    mainRef: AppPathBaseProps['mainRef'];
    title?: string;
    page: PageNode<DeepCoreNode>;
    pagePath?: string;
    previousPageId?: string;
    nextPageId?: string;
}

export function DocPageContent({
    mainRef,
    title,
    page,
    pagePath,
    previousPageId,
    nextPageId,
}: DocPageContentProps): VNode {
    const headingRefs: { current: HTMLHeadingElement }[] = [];

    return (
        <div class="cls-page__content__container cls-doc-page">
            <h1 class="cls-doc-page__title">
                {title !== undefined ? title : pageIdToPageTitle[page.pageId]}
            </h1>
            <div class="cls-doc-page__content">
                {page.tableOfContents && (
                    <DocPageSidebar page={page} headingRefs={headingRefs} />
                )}
                <main class="cls-doc-page__main" ref={mainRef}>
                    {page.children.map((childNode) => (
                        <DeepCoreNodeComponent
                            node={childNode}
                            pagePath={
                                pagePath !== undefined
                                    ? pagePath
                                    : `/${pageIdToWebsitePath[page.pageId]}`
                            }
                            headingRefs={headingRefs}
                        />
                    ))}
                    {(previousPageId !== undefined ||
                        nextPageId !== undefined) && (
                        <nav class="cls-doc-page__prev-next">
                            {previousPageId !== undefined && (
                                <DocPageLink
                                    pageId={previousPageId}
                                    class="cls-doc-page__prev-next__prev"
                                >
                                    <svg
                                        viewBox="0 0 14 24"
                                        class="cls-doc-page__prev-next__icon"
                                    >
                                        <path
                                            fill="none"
                                            fill-rule="evenodd"
                                            stroke="currentColor"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M12.5.75L1.78 11.47a.749.749 0 0 0-.001 1.059l.001.001L12.5 23.25"
                                        ></path>
                                    </svg>
                                    <div class="cls-doc-page__prev-next__prev-container">
                                        <div class="cls-doc-page__prev-next__prev-label">
                                            Previous
                                        </div>
                                        <div class="cls-doc-page__prev-next__prev-title">
                                            {pageIdToPageTitle[previousPageId]}
                                        </div>
                                    </div>
                                </DocPageLink>
                            )}
                            {nextPageId !== undefined && (
                                <DocPageLink
                                    pageId={nextPageId}
                                    class="cls-doc-page__prev-next__next"
                                >
                                    <div class="cls-doc-page__prev-next__next-container">
                                        <div class="cls-doc-page__prev-next__next-label">
                                            Next
                                        </div>
                                        <div class="cls-doc-page__prev-next__next-title">
                                            {pageIdToPageTitle[nextPageId]}
                                        </div>
                                    </div>
                                    <svg
                                        viewBox="0 0 24 24"
                                        class="cls-doc-page__prev-next__icon"
                                    >
                                        <path
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M5.5.75l10.72 10.72a.749.749 0 0 1 .001 1.059l-.001.001L5.5 23.25"
                                        ></path>
                                    </svg>
                                </DocPageLink>
                            )}
                        </nav>
                    )}
                </main>
            </div>
        </div>
    );
}

interface DocPageSidebarProps {
    page: PageNode<DeepCoreNode>;
    headingRefs: { current: HTMLElement }[];
}

function DocPageSidebar({ page, headingRefs }: DocPageSidebarProps): VNode {
    const { heightStyle, stickyState, elRefCb } = useSticky();

    const linkRefs: { current: HTMLAnchorElement }[] = [];
    const linkTexts: string[] = [];
    const linkIndexBox: [number] = [0];
    const { fixChromiumFocus } = useNavigationListKeyBindings({
        bindKeys: BindKeysRequireFocus,
        linkRefs: linkRefs,
        linkTexts,
    });

    const { 0: highlightedHeadingId, 1: setHighlightedHeadingId } = useState<
        string | null
    >(null);

    useEffect(() => {
        const headingIds: string[] = [];
        function getPageIds(reference: TableOfContentsMainReference) {
            headingIds.push(reference.urlHashText);
            if (reference.nestedReferences) {
                reference.nestedReferences.forEach(getPageIds);
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        page.tableOfContents!.forEach(getPageIds);
        const listener = () => {
            let previousHeadingId: string | null = null;
            for (let i = 0; i < headingRefs.length; i++) {
                const headingRef = headingRefs[i];
                const headingElement = headingRef.current;
                const headingId = headingElement.id;
                if (headingIds.indexOf(headingId) === -1) {
                    continue;
                }
                const headingTop = headingElement.getBoundingClientRect().top;
                if (headingTop >= 35) {
                    if (previousHeadingId === null) {
                        previousHeadingId = headingElement.id;
                    }
                    break;
                }
                previousHeadingId = headingElement.id;
            }
            setHighlightedHeadingId(previousHeadingId);
        };
        listener();
        document.addEventListener('scroll', listener);
        window.addEventListener('resize', listener);
        return () => {
            document.removeEventListener('scroll', listener);
            window.addEventListener('resize', listener);
        };
    }, []);

    return (
        <Fragment>
            <div
                class={
                    'cls-doc-page__sidebar-non-native-sticky-support-placeholder' +
                    (stickyState === UseStickyJsStickyActive
                        ? ' cls-doc-page__sidebar-non-native-sticky-support-placeholder--js-sticky-active'
                        : '')
                }
                ref={elRefCb}
            />
            <aside
                class={
                    'cls-doc-page__sidebar' +
                    (stickyState === UseStickyJsStickyActive
                        ? ' cls-doc-page__sidebar--js-sticky-active'
                        : '')
                }
                style={heightStyle && { height: heightStyle }}
            >
                {
                    <Fragment>
                        <h2 class="cls-doc-page__sidebar__title">
                            {pageIdToPageTitle[page.pageId]}
                        </h2>
                        {TableOfContentsList({
                            pageId: page.pageId,
                            // eslint-disable-next-line max-len
                            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                            references: page.tableOfContents!,
                            linkRefs,
                            linkTexts,
                            linkIndexBox,
                            fixChromiumFocus,
                            highlightedHeadingId,
                        })}
                    </Fragment>
                }
            </aside>
        </Fragment>
    );
}

interface TableOfContentsListParams {
    pageId: string;
    references: TableOfContentsMainReference[];
    linkRefs: { current: HTMLAnchorElement }[];
    linkTexts: string[];
    linkIndexBox: [number];
    fixChromiumFocus: boolean;
    highlightedHeadingId: string | null;
}

function TableOfContentsList({
    pageId,
    references,
    linkRefs,
    linkTexts,
    linkIndexBox,
    fixChromiumFocus,
    highlightedHeadingId,
}: TableOfContentsListParams): VNode {
    return (
        <ul>
            {references.map(({ text, urlHashText, nestedReferences }) => {
                linkRefs[linkIndexBox[0]] = useRef();
                linkTexts[linkIndexBox[0]] = text;
                return (
                    <li
                        class={
                            'cls-doc-page__sidebar__table-of-contents__item' +
                            (nestedReferences
                                ? ' cls-doc-page__sidebar__table-of-contents__item--has-nested-references'
                                : '')
                        }
                    >
                        <DocPageLink
                            class={
                                'cls-doc-page__sidebar__table-of-contents__item__main-reference' +
                                (highlightedHeadingId === urlHashText
                                    ? ' cls-doc-page__sidebar__table-of-contents__item__main-reference--active'
                                    : '') +
                                (fixChromiumFocus
                                    ? ` ${fixChromiumFocusClass}`
                                    : '')
                            }
                            pageId={pageId}
                            hash={urlHashText}
                            innerRef={linkRefs[linkIndexBox[0]++]}
                        >
                            {text}
                        </DocPageLink>
                        {nestedReferences &&
                            TableOfContentsList({
                                pageId,
                                references: nestedReferences,
                                linkRefs,
                                linkTexts,
                                linkIndexBox,
                                fixChromiumFocus,
                                highlightedHeadingId,
                            })}
                    </li>
                );
            })}
        </ul>
    );
}

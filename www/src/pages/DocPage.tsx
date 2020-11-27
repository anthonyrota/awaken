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
import { AppPathBaseProps } from './base';

export interface DocPageProps extends AppPathBaseProps {
    pageId: string;
}

const { pageIdToPageTitle } = getPagesMetadata();

export function DocPage({ mainRef, pageId }: DocPageProps): VNode | null {
    const responseState = useDocPagesResponseState();

    return (
        <Fragment>
            <DocumentTitle title={pageIdToPageTitle[pageId]} />
            {responseState.type === ResponseDoneType ? (
                <DocPageContent
                    mainRef={mainRef}
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

export interface DocPageContentProps {
    mainRef: AppPathBaseProps['mainRef'];
    page: PageNode<DeepCoreNode>;
    title?: string;
}

export function DocPageContent({
    mainRef,
    page,
    title,
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
                            headingRefs={headingRefs}
                        />
                    ))}
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

import { h, Fragment, VNode } from 'preact';
import { useRef } from 'preact/hooks';
import { DeepCoreNode } from '../../script/docs/core/nodes';
import { PageNode } from '../../script/docs/core/nodes/Page';
import { TableOfContentsMainReference } from '../../script/docs/types';
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

interface DocPageContentProps {
    mainRef: AppPathBaseProps['mainRef'];
    page: PageNode<DeepCoreNode>;
}

function DocPageContent({ mainRef, page }: DocPageContentProps): VNode {
    return (
        <div class="cls-page__content__container cls-doc-page">
            <h1 class="cls-doc-page__title">
                {pageIdToPageTitle[page.pageId]}
            </h1>
            <div class="cls-doc-page__content">
                <DocPageSidebar page={page} />
                <main class="cls-doc-page__main" ref={mainRef}>
                    {Array.from({ length: 10 }, () => (
                        <p>
                            {Array.from(
                                {
                                    length:
                                        Math.floor(Math.random() * 300) + 150,
                                },
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
                </main>
            </div>
        </div>
    );
}

interface DocPageSidebarProps {
    page: PageNode<DeepCoreNode>;
}

function DocPageSidebar({ page }: DocPageSidebarProps): VNode {
    const { heightStyle, stickyState, elRefCb } = useSticky();

    const linkRefs: { current: HTMLAnchorElement }[] = [];
    const linkTexts: string[] = [];
    const linkIndexBox: [number] = [0];
    const { fixChromiumFocus } = useNavigationListKeyBindings({
        bindKeys: BindKeysRequireFocus,
        linkRefs: linkRefs,
        linkTexts,
    });

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
                {page.tableOfContents && (
                    <Fragment>
                        <h2 class="cls-doc-page__sidebar__title">
                            {pageIdToPageTitle[page.pageId]}
                        </h2>
                        {TableOfContentsList({
                            pageId: page.pageId,
                            references: page.tableOfContents,
                            linkRefs,
                            linkTexts,
                            linkIndexBox,
                            fixChromiumFocus,
                        })}
                    </Fragment>
                )}
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
}

function TableOfContentsList({
    pageId,
    references,
    linkRefs,
    linkTexts,
    linkIndexBox,
    fixChromiumFocus,
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
                            })}
                    </li>
                );
            })}
        </ul>
    );
}

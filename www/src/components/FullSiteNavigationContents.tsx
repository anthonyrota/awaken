import { h, Fragment, VNode } from 'preact';
import { StateUpdater, useRef } from 'preact/hooks';
import { getGithubUrl, getPagesMetadata } from '../data/docPages';
import {
    BindKeys,
    fixChromiumFocusClass,
    useNavigationListKeyBindings,
} from '../hooks/useNavigationListKeyBindings';
import { DocPageLink } from './DocPageLink';
import { isDocPageIdActivePath, isStringActivePath, Link } from './Link';

export interface FullSiteNavigationContentsProps {
    bindKeys: BindKeys;
    getAllowSingleLetterKeyLinkJumpShortcut?: (() => boolean) | undefined;
    isMovingFocusManuallyRef?: { current: boolean };
    fixLinkChromiumFocus?: boolean;
    linkRefs?: { current: HTMLAnchorElement }[];
    fixChromiumFocus?: [boolean, StateUpdater<boolean>];
}

const { pageIdToPageTitle, pageGroups } = getPagesMetadata();
const githubUrl = getGithubUrl();
const licenseLinkText = 'License';
const githubLinkText = 'GitHub';

export function FullSiteNavigationContents({
    bindKeys,
    isMovingFocusManuallyRef = useRef(false),
    getAllowSingleLetterKeyLinkJumpShortcut,
    fixLinkChromiumFocus: fixLinkChromiumFocusProp,
    linkRefs = [],
    fixChromiumFocus: fixChromiumFocusParam,
}: FullSiteNavigationContentsProps): VNode {
    const linkTexts: string[] = [];
    pageGroups.forEach((pageGroup) => {
        pageGroup.pageIds.forEach((pageId) => {
            linkTexts.push(pageIdToPageTitle[pageId]);
        });
    });

    linkTexts.push(licenseLinkText, githubLinkText);

    for (let i = 0; i < linkTexts.length; i++) {
        linkRefs[i] = useRef<HTMLAnchorElement>();
    }

    const { fixChromiumFocus } = useNavigationListKeyBindings({
        bindKeys,
        linkRefs,
        linkTexts,
        getAllowSingleLetterKeyLinkJumpShortcut,
        isMovingFocusManuallyRef,
        fixChromiumFocus: fixChromiumFocusParam,
    });

    let linkIndex = 0;

    return (
        <Fragment>
            {pageGroups.map((pageGroup, pageGroupIndex) => (
                <Fragment key={pageGroupIndex}>
                    <h2
                        class={
                            'cls-full-site-nav__header' +
                            (pageGroup.pageIds.some(isDocPageIdActivePath)
                                ? ' cls-full-site-nav__header--active'
                                : '')
                        }
                    >
                        {pageGroup.title}
                    </h2>
                    <ul
                        role="navigation"
                        class="cls-full-site-nav__link-list"
                        aria-label="Documentation Navigation"
                    >
                        {pageGroup.pageIds.map((pageId, index) => (
                            <li key={index} class="cls-full-site-nav__li">
                                <div
                                    class={
                                        isDocPageIdActivePath(pageId)
                                            ? ' cls-full-site-nav__link-container--active'
                                            : undefined
                                    }
                                >
                                    <DocPageLink
                                        class={
                                            'cls-full-site-nav__link' +
                                            (fixLinkChromiumFocusProp ||
                                            fixChromiumFocus
                                                ? ` ${fixChromiumFocusClass}`
                                                : '')
                                        }
                                        pageId={pageId}
                                        innerRef={linkRefs[linkIndex++]}
                                    >
                                        <span
                                            class="cls-full-site-nav__link__border"
                                            aria-hidden
                                        >
                                            {pageIdToPageTitle[pageId]}
                                        </span>
                                        {pageIdToPageTitle[pageId]}
                                    </DocPageLink>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Fragment>
            ))}
            <h2
                class={
                    'cls-full-site-nav__header' +
                    (['/license'].some(isStringActivePath)
                        ? ' cls-full-site-nav__header--active'
                        : '')
                }
            >
                Resources
            </h2>
            <ul
                role="navigation"
                class="cls-full-site-nav__link-list"
                aria-label="Resources Navigation"
            >
                <li class="cls-full-site-nav__li">
                    <div
                        class={
                            isStringActivePath('/license')
                                ? ' cls-full-site-nav__link-container--active'
                                : undefined
                        }
                    >
                        <Link
                            class={
                                'cls-full-site-nav__link' +
                                (fixLinkChromiumFocusProp || fixChromiumFocus
                                    ? ` ${fixChromiumFocusClass}`
                                    : '')
                            }
                            innerRef={linkRefs[linkIndex++]}
                            href="/license"
                        >
                            <span
                                class="cls-full-site-nav__link__border"
                                aria-hidden
                            >
                                {licenseLinkText}
                            </span>
                            {licenseLinkText}
                        </Link>
                    </div>
                </li>
                <li class="cls-full-site-nav__li">
                    <a
                        class={
                            'cls-full-site-nav__link' +
                            (fixLinkChromiumFocusProp || fixChromiumFocus
                                ? ` ${fixChromiumFocusClass}`
                                : '')
                        }
                        ref={linkRefs[linkIndex++]}
                        href={githubUrl}
                    >
                        <span
                            class="cls-full-site-nav__link__border"
                            aria-hidden
                        >
                            {licenseLinkText}
                        </span>
                        {githubLinkText}
                    </a>
                </li>
            </ul>
        </Fragment>
    );
}

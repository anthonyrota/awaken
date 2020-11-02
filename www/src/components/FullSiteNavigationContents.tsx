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
    const linkClass =
        'cls-full-site-nav__link' +
        (fixLinkChromiumFocusProp || fixChromiumFocus
            ? ` ${fixChromiumFocusClass}`
            : '');

    const isLicenseActivePath = isStringActivePath('/license');

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
                        {pageGroup.pageIds.map((pageId, index) => {
                            const isActive = isDocPageIdActivePath(pageId);
                            return (
                                <FullSiteNavigationLi
                                    key={index}
                                    isActive={isActive}
                                >
                                    <DocPageLink
                                        class={linkClass}
                                        pageId={pageId}
                                        innerRef={linkRefs[linkIndex++]}
                                    >
                                        <FullSiteNavigationLiLinkContents
                                            isActive={isActive}
                                        >
                                            {pageIdToPageTitle[pageId]}
                                        </FullSiteNavigationLiLinkContents>
                                    </DocPageLink>
                                </FullSiteNavigationLi>
                            );
                        })}
                    </ul>
                </Fragment>
            ))}
            <h2
                class={
                    'cls-full-site-nav__header' +
                    (isLicenseActivePath
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
                <FullSiteNavigationLi isActive={isLicenseActivePath}>
                    <Link
                        class={linkClass}
                        innerRef={linkRefs[linkIndex++]}
                        href="/license"
                    >
                        <FullSiteNavigationLiLinkContents
                            isActive={isLicenseActivePath}
                        >
                            {licenseLinkText}
                        </FullSiteNavigationLiLinkContents>
                    </Link>
                </FullSiteNavigationLi>
                <FullSiteNavigationLi isActive={false}>
                    <a
                        class={linkClass}
                        ref={linkRefs[linkIndex++]}
                        href={githubUrl}
                    >
                        <FullSiteNavigationLiLinkContents isActive={false}>
                            {githubLinkText}
                        </FullSiteNavigationLiLinkContents>
                    </a>
                </FullSiteNavigationLi>
            </ul>
        </Fragment>
    );
}

interface FullSiteNavigationLiProps {
    isActive: boolean;
    children: preact.ComponentChildren;
}

function FullSiteNavigationLi({
    isActive,
    children,
}: FullSiteNavigationLiProps): VNode {
    return (
        <li class="cls-full-site-nav__li">
            {isActive ? (
                <div
                    class={
                        isActive
                            ? 'cls-full-site-nav__link-container--active'
                            : undefined
                    }
                >
                    {children}
                </div>
            ) : (
                children
            )}
        </li>
    );
}

interface FullSiteNavigationLiLinkContentsProps {
    isActive: boolean;
    children: preact.ComponentChildren;
}

function FullSiteNavigationLiLinkContents({
    isActive,
    children,
}: FullSiteNavigationLiLinkContentsProps): VNode {
    return (
        <Fragment>
            {isActive && (
                <span class="cls-full-site-nav__link__border" aria-hidden>
                    {children}
                </span>
            )}
            {children}
        </Fragment>
    );
}

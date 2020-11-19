import { h, Fragment, VNode } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { getGithubUrl, getPagesMetadata } from '../data/docPages';
import { usePath } from '../hooks/useHistory';
import {
    BindKeys,
    useNavigationListKeyBindings,
} from '../hooks/useNavigationListKeyBindings';
import { usePrevious } from '../hooks/usePrevious';
import { findIndex } from '../util/findIndex';
import { stopEvent } from '../util/stopEvent';
import { DocPageLink } from './DocPageLink';
import { isDocPageIdActivePath, isStringActivePath, Link } from './Link';

export interface FullSiteNavigationContentsProps {
    bindKeys: BindKeys;
    getAllowSingleLetterKeyLinkJumpShortcut?: (() => boolean) | undefined;
    isMovingFocusManuallyRef?: { current: boolean };
    linkRefs?: { current: HTMLAnchorElement }[];
}

const { pageIdToPageTitle, pageGroups } = getPagesMetadata();
const githubUrl = getGithubUrl();
const licenseLinkText = 'License';
const githubLinkText = 'GitHub';

export function FullSiteNavigationContents({
    bindKeys,
    isMovingFocusManuallyRef = useRef(false),
    getAllowSingleLetterKeyLinkJumpShortcut,
    linkRefs = [],
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

    const checkboxRefs: { current: HTMLInputElement }[] = [];
    let _checkboxRefIndex = 0;

    const isFocusedElement = (ref: { current: HTMLElement }) =>
        ref.current === document.activeElement;

    const getFocusedLinkListToggleIndex = (): number =>
        findIndex(checkboxRefs, isFocusedElement);

    const getFocusedLinkIndex = () => findIndex(linkRefs, isFocusedElement);

    const getFocusedLinkListIndexFromFocusedLink = (): number => {
        const linkIndex = getFocusedLinkIndex();
        if (linkIndex === -1) {
            return -1;
        }
        let i = 0;
        let sum = 0;
        for (; i < pageGroups.length; i++) {
            sum += pageGroups[i].pageIds.length;
            if (sum > linkIndex) {
                return i;
            }
        }
        return checkboxRefs.length - 1;
    };

    const getFocusedLinkListIndex = (): number => {
        let focusedLinkListIndex = getFocusedLinkListToggleIndex();
        if (focusedLinkListIndex === -1) {
            // eslint-disable-next-line max-len
            focusedLinkListIndex = getFocusedLinkListIndexFromFocusedLink();
        }
        return focusedLinkListIndex;
    };

    const getFirstLinkRefIndexFromLinkListIndex = (
        linkListIndex: number,
    ): number => {
        let sum = 0;
        for (let i = 0; i < pageGroups.length; i++) {
            const { length } = pageGroups[i].pageIds;
            if (linkListIndex === i) {
                return sum;
            }
            sum += length;
        }
        return sum;
    };

    const setFocus = (element: HTMLElement) => {
        isMovingFocusManuallyRef.current = true;
        element.focus();
        isMovingFocusManuallyRef.current = false;
    };

    const { 0: forceOpenIndex, 1: setForceOpenIndex } = useState<[number]>([
        -1,
    ]);
    const { 0: forceCloseIndex, 1: setForceCloseIndex } = useState<[number]>([
        -1,
    ]);
    const forceOpenIndexChangeRef = useRef(false);
    const lastLinkFocusHackRef = useRef(false);
    const onLinkFocus = (linkListIndex: number) => {
        if (lastLinkFocusHackRef.current) {
            lastLinkFocusHackRef.current = false;
            return;
        }
        if (isMovingFocusManuallyRef.current) {
            forceOpenIndexChangeRef.current = true;
            setForceOpenIndex([linkListIndex]);
        }
    };
    useEffect(() => {
        if (forceOpenIndexChangeRef.current) {
            forceOpenIndexChangeRef.current = false;
            const index = getFocusedLinkIndex();
            if (index === -1) {
                return;
            }
            linkRefs[index].current.scrollIntoView();
        }
    }, [forceOpenIndexChangeRef.current]);

    useEffect(() => {
        const listener = (event: KeyboardEvent) => {
            if (event.ctrlKey || event.metaKey || event.altKey) {
                return;
            }

            switch (event.key) {
                case 'ArrowUp':
                case 'Up': {
                    // eslint-disable-next-line max-len
                    const focusedLinkListIndex = getFocusedLinkListToggleIndex();
                    if (focusedLinkListIndex === -1) {
                        return;
                    }
                    stopEvent(event);
                    setFocus(
                        linkRefs[
                            getFirstLinkRefIndexFromLinkListIndex(
                                focusedLinkListIndex,
                            ) +
                                (focusedLinkListIndex === pageGroups.length
                                    ? 2
                                    : pageGroups[focusedLinkListIndex].pageIds
                                          .length) -
                                1
                        ].current,
                    );
                    break;
                }
                case 'ArrowDown':
                case 'Down':
                case ' ':
                case 'Spacebar':
                case 'Enter': {
                    // eslint-disable-next-line max-len
                    const focusedLinkListIndex = getFocusedLinkListToggleIndex();
                    if (focusedLinkListIndex === -1) {
                        return;
                    }
                    stopEvent(event);
                    setFocus(
                        linkRefs[
                            getFirstLinkRefIndexFromLinkListIndex(
                                focusedLinkListIndex,
                            )
                        ].current,
                    );
                    break;
                }
                case 'Escape':
                case 'Esc':
                case 'ArrowLeft':
                case 'Left': {
                    const focusedLinkListIndex = getFocusedLinkListIndex();
                    if (focusedLinkListIndex === -1) {
                        return;
                    }
                    stopEvent(event);
                    setFocus(checkboxRefs[focusedLinkListIndex].current);
                    setForceCloseIndex([focusedLinkListIndex]);
                    break;
                }
                case 'ArrowRight':
                case 'Right': {
                    const focusedLinkListIndex = getFocusedLinkListIndex();
                    if (focusedLinkListIndex === -1) {
                        return;
                    }
                    stopEvent(event);
                    setFocus(checkboxRefs[focusedLinkListIndex].current);
                    setForceOpenIndex([focusedLinkListIndex]);
                    break;
                }
                case 'Tab': {
                    const focusedLinkListIndex = getFocusedLinkListIndex();
                    if (focusedLinkListIndex === -1) {
                        return;
                    }

                    if (event.shiftKey) {
                        if (getFocusedLinkListIndexFromFocusedLink() !== -1) {
                            stopEvent(event);
                            setFocus(
                                checkboxRefs[focusedLinkListIndex].current,
                            );
                            break;
                        }
                        if (focusedLinkListIndex !== 0) {
                            stopEvent(event);
                            setFocus(
                                checkboxRefs[focusedLinkListIndex - 1].current,
                            );
                            setForceCloseIndex([focusedLinkListIndex]);
                        }
                        break;
                    }

                    if (focusedLinkListIndex !== checkboxRefs.length - 1) {
                        stopEvent(event);
                        setFocus(
                            checkboxRefs[focusedLinkListIndex + 1].current,
                        );
                        setForceCloseIndex([focusedLinkListIndex]);
                        break;
                    }

                    lastLinkFocusHackRef.current = true;
                    setFocus(linkRefs[linkRefs.length - 1].current);
                    break;
                }
                case 'Home':
                case 'PageUp': {
                    if (getFocusedLinkListToggleIndex() === -1) {
                        return;
                    }
                    setFocus(checkboxRefs[0].current);
                    setForceOpenIndex([0]);
                    stopEvent(event);
                    break;
                }
                case 'End':
                case 'PageDown': {
                    if (getFocusedLinkListToggleIndex() === -1) {
                        return;
                    }
                    setFocus(checkboxRefs[checkboxRefs.length - 1].current);
                    setForceOpenIndex([checkboxRefs.length - 1]);
                    stopEvent(event);
                    break;
                }
            }
        };
        document.addEventListener('keydown', listener);
        return () => {
            document.removeEventListener('keydown', listener);
        };
    }, []);

    useNavigationListKeyBindings({
        bindKeys,
        linkRefs,
        linkTexts,
        getAllowSingleLetterKeyLinkJumpShortcut: () =>
            getFocusedLinkIndex() !== -1 ||
            getFocusedLinkListToggleIndex() !== -1 ||
            (!!getAllowSingleLetterKeyLinkJumpShortcut &&
                getAllowSingleLetterKeyLinkJumpShortcut()),
        isMovingFocusManuallyRef,
    });

    let linkIndex = 0;
    const linkClass = `cls-full-site-nav__link`;

    const isLicenseActivePath = isStringActivePath('/license');

    return (
        <ul>
            {pageGroups.map((pageGroup) => (
                <FullSiteNavigationLinkList
                    isActive={pageGroup.pageIds.some(isDocPageIdActivePath)}
                    headerText={pageGroup.title}
                    description={`${pageGroup.title} Navigation Links`}
                    forceOpen={useMemo(
                        () => [forceOpenIndex[0] === _checkboxRefIndex],
                        [forceOpenIndex],
                    )}
                    forceClose={useMemo(
                        () => [forceCloseIndex[0] === _checkboxRefIndex],
                        [forceCloseIndex],
                    )}
                    index={_checkboxRefIndex}
                    checkboxRef={(checkboxRefs[_checkboxRefIndex++] = useRef())}
                >
                    {pageGroup.pageIds.map((pageId, index) => {
                        const isActive = isDocPageIdActivePath(pageId);
                        const menuLinkIndex = _checkboxRefIndex;
                        return (
                            <FullSiteNavigationLi
                                key={index}
                                isActive={isActive}
                            >
                                <DocPageLink
                                    class={linkClass}
                                    pageId={pageId}
                                    innerRef={linkRefs[linkIndex++]}
                                    onFocus={() =>
                                        onLinkFocus(menuLinkIndex - 1)
                                    }
                                >
                                    {pageIdToPageTitle[pageId]}
                                </DocPageLink>
                            </FullSiteNavigationLi>
                        );
                    })}
                </FullSiteNavigationLinkList>
            ))}
            <FullSiteNavigationLinkList
                isActive={isLicenseActivePath}
                headerText="Resources"
                description="Resources Navigation Links"
                forceOpen={useMemo(
                    () => [forceOpenIndex[0] === _checkboxRefIndex],
                    [forceOpenIndex],
                )}
                forceClose={useMemo(
                    () => [forceCloseIndex[0] === _checkboxRefIndex],
                    [forceCloseIndex],
                )}
                index={_checkboxRefIndex}
                checkboxRef={(checkboxRefs[_checkboxRefIndex++] = useRef())}
            >
                <FullSiteNavigationLi isActive={isLicenseActivePath}>
                    <Link
                        class={linkClass}
                        innerRef={linkRefs[linkIndex++]}
                        onFocus={() => onLinkFocus(_checkboxRefIndex - 1)}
                        href="/license"
                    >
                        {licenseLinkText}
                    </Link>
                </FullSiteNavigationLi>
                <FullSiteNavigationLi isActive={false}>
                    <a
                        class={linkClass}
                        ref={linkRefs[linkIndex++]}
                        onFocus={() => onLinkFocus(_checkboxRefIndex - 1)}
                        href={githubUrl}
                    >
                        {githubLinkText}
                    </a>
                </FullSiteNavigationLi>
            </FullSiteNavigationLinkList>
        </ul>
    );
}

interface FullSiteNavigationLinkListProps {
    isActive: boolean;
    description: string;
    headerText: string;
    forceOpen: [boolean];
    forceClose: [boolean];
    index: number;
    checkboxRef: { current: HTMLInputElement };
    children: preact.ComponentChildren;
}

function FullSiteNavigationLinkList({
    isActive,
    description,
    headerText,
    forceOpen,
    forceClose,
    index,
    checkboxRef,
    children,
}: FullSiteNavigationLinkListProps): VNode {
    const { 0: isOpen, 1: setIsOpen } = useState(isActive);
    // cspell:disable-next-line
    const id = `a11y-fsnll-${index}`;

    const path = usePath();
    const previousPath = usePrevious(path);
    if (previousPath && previousPath.value !== path) {
        previousPath.value = path;
        setIsOpen(isActive);
    }

    const previousForceOpen = usePrevious(forceOpen);
    if (previousForceOpen && previousForceOpen.value !== forceOpen) {
        previousForceOpen.value = forceOpen;
        setIsOpen(forceOpen[0]);
    }

    const previousForceClose = usePrevious(forceClose);
    if (previousForceClose && previousForceClose.value !== forceClose) {
        previousForceClose.value = forceClose;
        if (forceClose[0]) {
            setIsOpen(false);
        }
    }

    function onCheckboxChange() {
        setIsOpen(!isOpen);
    }

    return (
        <Fragment>
            <li
                class={
                    'cls-full-site-nav__link-list-container' +
                    (isOpen
                        ? ' cls-full-site-nav__link-list-container--open'
                        : '')
                }
            >
                <input
                    ref={checkboxRef}
                    type="checkbox"
                    checked={isOpen}
                    class="cls-full-site-nav__link-list-checkbox"
                    onChange={onCheckboxChange}
                    aria-labelledby={id}
                />
                <h2
                    class={
                        'cls-full-site-nav__header' +
                        (isActive ? ' cls-full-site-nav__header--active' : '')
                    }
                    id={id}
                >
                    {headerText}
                    <svg
                        viewBox="0 0 24 24"
                        class={
                            'cls-full-site-nav__header__svg' +
                            (isOpen
                                ? ''
                                : ' cls-full-site-nav__header__svg--closed')
                        }
                        aria-hidden="true"
                    >
                        <path
                            fill="none"
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="1.5"
                            d="M.75 17.189L11.47 6.47a.749.749 0 0 1 1.059-.001l.001.001 10.72 10.719"
                        ></path>
                    </svg>
                </h2>
                <ul
                    role="navigation"
                    class={
                        'cls-full-site-nav__link-list' +
                        (isOpen ? '' : ' cls-full-site-nav__link-list--closed')
                    }
                    aria-label={description}
                >
                    {children}
                </ul>
            </li>
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

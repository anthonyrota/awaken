import { h, Fragment, VNode, JSX } from 'preact';
import { useState, useRef, useLayoutEffect } from 'preact/hooks';
import { getGithubUrl, getPagesMetadata } from '../data/docPages';
import { isMobile, isStandalone } from '../env';
import {
    useFullScreenOverlayState,
    FullScreenOverlayOpenTransitionType,
    FullScreenOverlayCloseWithSettingFocusTransitionType,
    FullScreenOverlayCloseWithoutSettingFocusTransitionType,
} from '../hooks/useFullScreenOverlayState';
import {
    customHistory,
    whileIgnoringChange,
    useDidPathChange,
} from '../hooks/useHistory';
import {
    BindKeysNoRequireFocus,
    NoBindKeys,
} from '../hooks/useNavigationListKeyBindings';
import { useOverlayEscapeKeyBinding } from '../hooks/useOverlayEscapeKeyBinding';
import { usePrevious } from '../hooks/usePrevious';
import { useSizeShowMenuChange } from '../hooks/useSizeShowMenu';
import { useSticky, UseStickyJsStickyActive } from '../hooks/useSticky';
import { useTrapFocus } from '../hooks/useTrapFocus';
import { ThemeDark, ThemeLight, getTheme, setTheme } from '../theme';
import { getScrollTop } from '../util/getScrollTop';
import { DocPageLink } from './DocPageLink';
import { FullSiteNavigationContents } from './FullSiteNavigationContents';
import { Link, isStringActivePath, isDocPageIdActivePath } from './Link';

const { pageIdToWebsitePath } = getPagesMetadata();
const githubUrl = getGithubUrl();

export interface HeaderProps {
    enableMenu: boolean;
}

const githubLinkLabel = 'Open GitHub Repository';
const themeSwitchLabel = 'Toggle Dark Mode';
const toggleButtonLabel = 'Toggle Navigation Menu';

export function Header({ enableMenu }: HeaderProps): VNode {
    const { 0: searchValue, 1: setSearchValue } = useState('');
    const searchInputRef = useRef<HTMLInputElement>();
    const headerRef = useRef<HTMLElement>();
    const menuRef = useRef<HTMLElement>();
    const toggleButtonRef = useRef<HTMLButtonElement>();
    const menuLinkRefs: { current: HTMLAnchorElement }[] = [];
    const firstFocusableElementRef = useRef<HTMLAnchorElement>();
    const startFocusPlaceholderRef = useRef<HTMLDivElement>();
    const endFocusPlaceholderRef = useRef<HTMLDivElement>();
    const previousScrollTopRef = useRef(0);

    const {
        stickyState: menuStickyToggleState,
        elRefCb: menuStickyMeasureRef,
    } = useSticky({
        useNativeSticky: false,
        calculateHeight: false,
    });

    const isMovingFocusManuallyRef = useRef(false);
    function manuallySetFocus(element: HTMLElement): void {
        isMovingFocusManuallyRef.current = true;
        element.focus();
        isMovingFocusManuallyRef.current = false;
    }

    const {
        isOpen: isMenuOpen,
        getIsOpen: getIsMenuOpen,
        transitionState: transitionMenuState,
        getTransitionType: getMenuTransitionType,
    } = useFullScreenOverlayState({
        setFocusOnOpen: () => manuallySetFocus(menuLinkRefs[0].current),
        setFocusOnClose: () => manuallySetFocus(toggleButtonRef.current),
    });

    if (useDidPathChange()) {
        transitionMenuState(
            FullScreenOverlayCloseWithoutSettingFocusTransitionType,
        );
    }

    useOverlayEscapeKeyBinding({
        getIsOpen: () => !!isMenuOpen,
        close: () =>
            transitionMenuState(
                FullScreenOverlayCloseWithSettingFocusTransitionType,
            ),
    });

    const isNodePartOfComponent = (node: Node) => {
        return (
            headerRef.current.contains(node) ||
            menuRef.current.contains(node) ||
            // In case the sticky one is being shown.
            node === toggleButtonRef.current
        );
    };

    useTrapFocus({
        getShouldTrapFocus: getIsMenuOpen,
        shouldIgnoreChangedFocus: isNodePartOfComponent,
        getStartFocusPlaceholder: () => startFocusPlaceholderRef.current,
        getEndFocusPlaceholder: () => endFocusPlaceholderRef.current,
        setFocusStart: () => {
            manuallySetFocus(firstFocusableElementRef.current);
        },
        setFocusEnd: () => {
            manuallySetFocus(menuLinkRefs[menuLinkRefs.length - 1].current);
        },
        onFocusOutside: () => {
            transitionMenuState(
                FullScreenOverlayCloseWithoutSettingFocusTransitionType,
            );
        },
    });

    const onSearchInput: JSX.GenericEventHandler<HTMLInputElement> = (e) => {
        setSearchValue(e.currentTarget.value);
    };

    const onToggleButtonClick = () => {
        const isMenuOpen = getIsMenuOpen();
        const isMenuOpenAfterClick = !isMenuOpen;
        if (isMenuOpenAfterClick) {
            previousScrollTopRef.current = getScrollTop();
            whileIgnoringChange(() => {
                customHistory.replace(customHistory.location, {
                    beforeMenuOpenScrollTop: previousScrollTopRef.current,
                });
            });
        }
        transitionMenuState(
            isMenuOpenAfterClick
                ? FullScreenOverlayOpenTransitionType
                : FullScreenOverlayCloseWithSettingFocusTransitionType,
        );
    };

    const isDocumentationPage = Object.keys(pageIdToWebsitePath).some(
        isDocPageIdActivePath,
    );

    const goBack = (e: Event) => {
        e.preventDefault();
        customHistory.back();
    };

    const showBackButton =
        (isMobile || isStandalone) &&
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        window.history.state.idx !== 0;

    const showMenuStickyToggle =
        menuStickyToggleState === UseStickyJsStickyActive && !isMenuOpen;

    const previousShowMenuStickyToggle = usePrevious(showMenuStickyToggle);
    const toggleButtonOnSwitchShouldFocusRef = useRef(false);
    if (
        previousShowMenuStickyToggle &&
        previousShowMenuStickyToggle.value !== showMenuStickyToggle &&
        document.activeElement === toggleButtonRef.current
    ) {
        toggleButtonOnSwitchShouldFocusRef.current = true;
    }
    useLayoutEffect(() => {
        if (toggleButtonOnSwitchShouldFocusRef.current) {
            requestAnimationFrame(() => {
                toggleButtonOnSwitchShouldFocusRef.current = false;
                toggleButtonRef.current.focus();
            });
        }
    });

    useLayoutEffect((): (() => void) | void => {
        if (isMenuOpen) {
            window.scrollTo(0, 0);
        }
        if (
            getMenuTransitionType() ===
            FullScreenOverlayCloseWithSettingFocusTransitionType
        ) {
            window.scrollTo(0, previousScrollTopRef.current);
        }
        whileIgnoringChange(() => {
            customHistory.replace(customHistory.location, null);
        });
    }, [isMenuOpen]);

    useSizeShowMenuChange((isSizeShowMenu) => {
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (!isSizeShowMenu && !enableMenu) {
            transitionMenuState(
                FullScreenOverlayCloseWithSettingFocusTransitionType,
            );
        }
    }, isMenuOpen);

    const { 0: theme, 1: setThemeState } = useState(getTheme());

    const onThemeSwitchButtonClick = () => {
        const newTheme = theme === ThemeLight ? ThemeDark : ThemeLight;
        setTheme(newTheme);
        setThemeState(newTheme);
    };

    return (
        <Fragment>
            <div
                ref={startFocusPlaceholderRef}
                tabIndex={isMenuOpen ? 0 : -1}
            />
            <header role="banner" class="cls-header" ref={headerRef}>
                <div class="cls-header__contents">
                    <div class="cls-header__contents__container">
                        <div
                            class={
                                'cls-header__nav cls-header__nav__list' +
                                (showBackButton
                                    ? ' cls-header__nav--left-with-back-button'
                                    : '')
                            }
                        >
                            {showBackButton && (
                                <a
                                    class="cls-header__nav__link cls-header__back-button"
                                    role="img"
                                    aria-label="Go to Previous Page"
                                    title="Go to Previous Page"
                                    onClick={goBack}
                                    href=""
                                    ref={
                                        showBackButton
                                            ? firstFocusableElementRef
                                            : undefined
                                    }
                                >
                                    <svg
                                        class="cls-header__nav__icon"
                                        viewBox="0 0 16 24"
                                    >
                                        <title>Go to Previous Page</title>
                                        <path d="M11.67 3.87L9.9 2.1 0 12l9.9 9.9 1.77-1.77L3.54 12z" />
                                    </svg>
                                </a>
                            )}
                            <Link
                                innerRef={
                                    showBackButton
                                        ? undefined
                                        : firstFocusableElementRef
                                }
                                href="/"
                                class={
                                    'cls-header__nav__link' +
                                    (showBackButton
                                        ? ' cls-header__logo--next-to-back-button'
                                        : '')
                                }
                            >
                                <svg
                                    class="cls-header__logo-img cls-header__logo-img--with-text"
                                    role="img"
                                    aria-label="Tailwind CSS"
                                    viewBox="0 0 273 64"
                                >
                                    <title>Click to Go Home</title>
                                    <path
                                        fill="#14B4C6"
                                        d="M32 16c-7.2 0-11.7 3.6-13.5 10.8 2.7-3.6 5.85-4.95 9.45-4.05 2.054.514 3.522 2.004 5.147 3.653C35.744 29.09 38.808 32.2 45.5 32.2c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.514-3.522-2.004-5.147-3.653C41.756 19.11 38.692 16 32 16zM18.5 32.2C11.3 32.2 6.8 35.8 5 43c2.7-3.6 5.85-4.95 9.45-4.05 2.054.514 3.522 2.004 5.147 3.653C22.244 45.29 25.308 48.4 32 48.4c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.514-3.522-2.004-5.147-3.653C28.256 35.31 25.192 32.2 18.5 32.2z"
                                    ></path>
                                    <path
                                        class="cls-header__logo-img__text-path"
                                        d="M85.996 29.652h-4.712v9.12c0 2.432 1.596 2.394 4.712 2.242V44.7c-6.308.76-8.816-.988-8.816-5.928v-9.12h-3.496V25.7h3.496v-5.104l4.104-1.216v6.32h4.712v3.952zm17.962-3.952h4.104v19h-4.104v-2.736c-1.444 2.014-3.686 3.23-6.65 3.23-5.168 0-9.462-4.37-9.462-9.994 0-5.662 4.294-9.994 9.462-9.994 2.964 0 5.206 1.216 6.65 3.192V25.7zm-6.004 15.58c3.42 0 6.004-2.546 6.004-6.08 0-3.534-2.584-6.08-6.004-6.08-3.42 0-6.004 2.546-6.004 6.08 0 3.534 2.584 6.08 6.004 6.08zm16.948-18.43c-1.444 0-2.622-1.216-2.622-2.622a2.627 2.627 0 012.622-2.622 2.627 2.627 0 012.622 2.622c0 1.406-1.178 2.622-2.622 2.622zM112.85 44.7v-19h4.104v19h-4.104zm8.854 0V16.96h4.104V44.7h-4.104zm30.742-19h4.332l-5.966 19h-4.028l-3.952-12.806-3.99 12.806h-4.028l-5.966-19h4.332l3.686 13.11 3.99-13.11h3.914l3.952 13.11 3.724-13.11zm9.424-2.85c-1.444 0-2.622-1.216-2.622-2.622a2.627 2.627 0 012.622-2.622 2.627 2.627 0 012.622 2.622c0 1.406-1.178 2.622-2.622 2.622zm-2.052 21.85v-19h4.104v19h-4.104zm18.848-19.494c4.256 0 7.296 2.888 7.296 7.828V44.7h-4.104V33.452c0-2.888-1.672-4.408-4.256-4.408-2.698 0-4.826 1.596-4.826 5.472V44.7h-4.104v-19h4.104v2.432c1.254-1.976 3.306-2.926 5.89-2.926zm26.752-7.106h4.104v26.6h-4.104v-2.736c-1.444 2.014-3.686 3.23-6.65 3.23-5.168 0-9.462-4.37-9.462-9.994 0-5.662 4.294-9.994 9.462-9.994 2.964 0 5.206 1.216 6.65 3.192V18.1zm-6.004 23.18c3.42 0 6.004-2.546 6.004-6.08 0-3.534-2.584-6.08-6.004-6.08-3.42 0-6.004 2.546-6.004 6.08 0 3.534 2.584 6.08 6.004 6.08zm23.864 3.914c-5.738 0-10.032-4.37-10.032-9.994 0-5.662 4.294-9.994 10.032-9.994 3.724 0 6.954 1.938 8.474 4.902l-3.534 2.052c-.836-1.786-2.698-2.926-4.978-2.926-3.344 0-5.89 2.546-5.89 5.966 0 3.42 2.546 5.966 5.89 5.966 2.28 0 4.142-1.178 5.054-2.926l3.534 2.014c-1.596 3.002-4.826 4.94-8.55 4.94zm15.314-14.25c0 3.458 10.222 1.368 10.222 8.398 0 3.8-3.306 5.852-7.41 5.852-3.8 0-6.536-1.71-7.752-4.446l3.534-2.052c.608 1.71 2.128 2.736 4.218 2.736 1.824 0 3.23-.608 3.23-2.128 0-3.382-10.222-1.482-10.222-8.284 0-3.572 3.078-5.814 6.954-5.814 3.116 0 5.7 1.444 7.03 3.952l-3.458 1.938c-.684-1.482-2.014-2.166-3.572-2.166-1.482 0-2.774.646-2.774 2.014zm17.518 0c0 3.458 10.222 1.368 10.222 8.398 0 3.8-3.306 5.852-7.41 5.852-3.8 0-6.536-1.71-7.752-4.446l3.534-2.052c.608 1.71 2.128 2.736 4.218 2.736 1.824 0 3.23-.608 3.23-2.128 0-3.382-10.222-1.482-10.222-8.284 0-3.572 3.078-5.814 6.954-5.814 3.116 0 5.7 1.444 7.03 3.952l-3.458 1.938c-.684-1.482-2.014-2.166-3.572-2.166-1.482 0-2.774.646-2.774 2.014z"
                                    ></path>
                                </svg>
                                <svg
                                    class="cls-header__logo-img cls-header__logo-img--without-text"
                                    role="img"
                                    aria-label="Click to Go Home"
                                    viewBox="0 0 64 64"
                                >
                                    <title>Tailwind CSS</title>
                                    <path
                                        fill="#14B4C6"
                                        d="M32 16.3c-7.2 0-11.7 3.6-13.5 10.8 2.7-3.6 5.85-4.95 9.45-4.05 2.054.514 3.522 2.004 5.147 3.653C35.744 29.39 38.808 32.5 45.5 32.5c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.514-3.522-2.004-5.147-3.653C41.756 19.41 38.692 16.3 32 16.3zM18.5 32.5c-7.2 0-11.7 3.6-13.5 10.8 2.7-3.6 5.85-4.95 9.45-4.05 2.054.514 3.522 2.004 5.147 3.653C22.244 45.59 25.308 48.7 32 48.7c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.514-3.522-2.004-5.147-3.653C28.256 35.61 25.192 32.5 18.5 32.5z"
                                    ></path>
                                </svg>
                            </Link>
                        </div>
                    </div>
                    <div class="cls-header__search">
                        <input
                            placeholder="Search..."
                            aria-label="Search Website"
                            class="cls-header__search__input"
                            value={searchValue}
                            onInput={onSearchInput}
                            ref={searchInputRef}
                        />
                        <div class="cls-header__search__icon">
                            <svg
                                class="cls-header__search__icon__svg"
                                viewBox="0 0 20 20"
                            >
                                <path d="M12.9 14.32a8 8 0 1 1 1.41-1.41l5.35 5.33-1.42 1.42-5.33-5.34zM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z"></path>
                            </svg>
                        </div>
                    </div>
                    <div class="cls-header__contents__container">
                        <nav
                            class="cls-header__nav"
                            aria-label="Quick Site Navigation Links"
                        >
                            <ul class="cls-header__nav__list cls-header__nav--pages">
                                <li
                                    class={
                                        'cls-header__nav__link-container' +
                                        (isDocumentationPage
                                            ? ' cls-header__nav__link-container--active'
                                            : '')
                                    }
                                >
                                    <DocPageLink
                                        class="cls-header__nav__link"
                                        pageId={'core--introduction'}
                                    >
                                        Documentation
                                    </DocPageLink>
                                </li>
                                <li
                                    class={
                                        'cls-header__nav__link-container' +
                                        (isStringActivePath('/license')
                                            ? ' cls-header__nav__link-container--active'
                                            : '')
                                    }
                                >
                                    <Link
                                        class="cls-header__nav__link"
                                        href="/license"
                                    >
                                        License
                                    </Link>
                                </li>
                            </ul>
                        </nav>
                        <div class="cls-header__version">v0.0.1</div>
                        <div class="cls-header__nav cls-header__nav__list">
                            <label
                                class="cls-header__nav__link"
                                aria-label={themeSwitchLabel}
                                title={themeSwitchLabel}
                            >
                                <input
                                    class="cls-header__theme-checkbox-input"
                                    type="checkbox"
                                    checked={theme === ThemeDark}
                                    onInput={onThemeSwitchButtonClick}
                                />
                                {theme === ThemeLight ? 'Light' : 'Dark'}
                            </label>
                            <a
                                class="cls-header__nav__link"
                                aria-label={githubLinkLabel}
                                title={githubLinkLabel}
                                href={githubUrl}
                            >
                                <svg
                                    class="cls-header__nav__icon"
                                    viewBox="0 0 20 20"
                                >
                                    <title>{githubLinkLabel}</title>
                                    <path d="M10 0a10 10 0 0 0-3.16 19.49c.5.1.68-.22.68-.48l-.01-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.1.39-1.99 1.03-2.69a3.6 3.6 0 0 1 .1-2.64s.84-.27 2.75 1.02a9.58 9.58 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.37.2 2.4.1 2.64.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85l-.01 2.75c0 .26.18.58.69.48A10 10 0 0 0 10 0"></path>
                                </svg>
                            </a>
                            <button
                                class={
                                    'cls-header__nav__link cls-header__menu-toggle-button' +
                                    (enableMenu
                                        ? ' cls-header__menu-toggle-button--enabled'
                                        : '')
                                }
                                type="button"
                                tabIndex={showMenuStickyToggle ? -1 : 0}
                                disabled={showMenuStickyToggle}
                                aria-hidden={showMenuStickyToggle}
                                aria-expanded={isMenuOpen}
                                aria-label={toggleButtonLabel}
                                title={toggleButtonLabel}
                                onClick={onToggleButtonClick}
                                ref={
                                    showMenuStickyToggle
                                        ? undefined
                                        : toggleButtonRef
                                }
                            >
                                <ToggleButtonSvg
                                    class="cls-header__nav__icon cls-header__nav__icon--menu"
                                    isMenuOpen={isMenuOpen}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            <span ref={menuStickyMeasureRef} />
            <button
                class={
                    'cls-header__menu-toggle-button cls-header__sticky-menu-toggle-button' +
                    (showMenuStickyToggle
                        ? ' cls-header__sticky-menu-toggle-button--show'
                        : '') +
                    (enableMenu
                        ? ' cls-header__menu-toggle-button--enabled'
                        : '')
                }
                type="button"
                tabIndex={showMenuStickyToggle ? 0 : -1}
                disabled={!showMenuStickyToggle}
                aria-hidden={!showMenuStickyToggle}
                aria-expanded={isMenuOpen}
                aria-label={toggleButtonLabel}
                title={toggleButtonLabel}
                onClick={onToggleButtonClick}
                ref={showMenuStickyToggle ? toggleButtonRef : undefined}
            >
                <ToggleButtonSvg
                    class="cls-header__sticky-menu-toggle-button__icon"
                    isMenuOpen={isMenuOpen}
                />
            </button>
            {isMenuOpen && (
                <aside
                    ref={menuRef}
                    class={
                        'cls-menu' + (enableMenu ? ' cls-menu--enabled' : '')
                    }
                    role="dialog"
                    aria-modal="true"
                    aria-label="Site Navigation"
                >
                    <div class="cls-menu__contents">
                        <FullSiteNavigationContents
                            bindKeys={
                                isMenuOpen ? BindKeysNoRequireFocus : NoBindKeys
                            }
                            getAllowSingleLetterKeyLinkJumpShortcut={() => {
                                return (
                                    document.activeElement !==
                                    searchInputRef.current
                                );
                            }}
                            isMovingFocusManuallyRef={isMovingFocusManuallyRef}
                            linkRefs={menuLinkRefs}
                        />
                    </div>
                </aside>
            )}
            <div ref={endFocusPlaceholderRef} tabIndex={isMenuOpen ? 0 : -1} />
        </Fragment>
    );
}

interface ToggleButtonSvgProps {
    class: string;
    isMenuOpen: boolean;
}

function ToggleButtonSvg({
    class: className,
    isMenuOpen,
}: ToggleButtonSvgProps): VNode {
    return (
        <svg class={className} viewBox="0 0 24 24">
            <title>{toggleButtonLabel}</title>
            {isMenuOpen ? (
                <path d="M4,18h11c0.55,0,1-0.45,1-1v0c0-0.55-0.45-1-1-1H4c-0.55,0-1,0.45-1,1v0C3,17.55,3.45,18,4,18z M4,13h8c0.55,0,1-0.45,1-1v0 c0-0.55-0.45-1-1-1H4c-0.55,0-1,0.45-1,1v0C3,12.55,3.45,13,4,13z M3,7L3,7c0,0.55,0.45,1,1,1h11c0.55,0,1-0.45,1-1v0 c0-0.55-0.45-1-1-1H4C3.45,6,3,6.45,3,7z M20.3,14.88L17.42,12l2.88-2.88c0.39-0.39,0.39-1.02,0-1.41l0,0 c-0.39-0.39-1.02-0.39-1.41,0l-3.59,3.59c-0.39,0.39-0.39,1.02,0,1.41l3.59,3.59c0.39,0.39,1.02,0.39,1.41,0l0,0 C20.68,15.91,20.69,15.27,20.3,14.88z" />
            ) : (
                <path d="M4 18h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1s.45 1 1 1zm0-5h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1s.45 1 1 1zM3 7c0 .55.45 1 1 1h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1z" />
            )}
        </svg>
    );
}

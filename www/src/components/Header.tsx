import { h, Fragment, VNode, JSX } from 'preact';
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'preact/hooks';
import { getPagesMetadata } from '../data/docPages';
import { isChromium } from '../env';
import { DocPageLink } from './DocPageLink';
import { isActivePath, Link, parsePathDefaultingToEmptyString } from './Link';

function stopEvent(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
}

// Not supported in IE.
function findIndex<T>(
    list: readonly T[],
    predicate: (value: T) => boolean,
    startIndex = 0,
    endIndex = list.length,
): number {
    for (let i = startIndex; i < endIndex; i++) {
        if (predicate(list[i])) {
            return i;
        }
    }
    return -1;
}

export function Header(): VNode {
    const {
        pageIdToWebsitePath,
        pageIdToPageTitle,
        order,
        github,
    } = getPagesMetadata();

    // Hack:
    // undefined -> first render
    // null -> closing on menu click, reset focus to beginning of document
    // false -> regular closing, focus toggle element
    // true -> regular opening, focus first link.
    const { 0: isMenuOpen, 1: setMenuOpen } = useState<
        boolean | undefined | null
    >(undefined);
    const { 0: searchValue, 1: setSearchValue } = useState('');

    const menuLinkRefs = order.map(() => useRef<HTMLAnchorElement>());

    function getMenuLinkFocusIndex(): number {
        const focusedElement = document.activeElement;
        return findIndex(menuLinkRefs, (ref) => ref.current === focusedElement);
    }

    const isMovingFocusManuallyRef = useRef(false);

    function manuallySetFocus(element: HTMLElement): void {
        isMovingFocusManuallyRef.current = true;
        element.focus();
        isMovingFocusManuallyRef.current = false;
    }

    useEffect(() => {
        if (!isMenuOpen) {
            return;
        }
        const listener = (event: KeyboardEvent) => {
            if (!isMenuOpen) {
                return;
            }

            if (event.ctrlKey || event.metaKey || event.altKey) {
                return;
            }

            if (event.key.length === 1 && /\S/.exec(event.key)) {
                const index = getMenuLinkFocusIndex();
                const predicate = (id: string) =>
                    pageIdToPageTitle[id][0].toLowerCase() ===
                    event.key.toLowerCase();
                let nextIndexStartingWithChar = findIndex(
                    order,
                    predicate,
                    index + 1,
                );
                if (nextIndexStartingWithChar === -1) {
                    nextIndexStartingWithChar = findIndex(
                        order,
                        predicate,
                        0,
                        index - 1,
                    );
                }
                if (nextIndexStartingWithChar === -1) {
                    return;
                }
                manuallySetFocus(
                    menuLinkRefs[nextIndexStartingWithChar].current,
                );
                if (event.shiftKey) {
                    stopEvent(event);
                }
                return;
            }

            if (event.shiftKey) {
                return;
            }

            switch (event.key) {
                case 'Escape':
                case 'Esc': {
                    setMenuOpen(false);
                    stopEvent(event);
                    break;
                }
                case 'ArrowUp':
                case 'Up': {
                    const index = getMenuLinkFocusIndex();
                    if (index === -1) {
                        return;
                    }
                    manuallySetFocus(
                        menuLinkRefs[
                            index === 0 ? menuLinkRefs.length - 1 : index - 1
                        ].current,
                    );
                    stopEvent(event);
                    break;
                }
                case 'ArrowDown':
                case 'Down': {
                    const index = getMenuLinkFocusIndex();
                    if (index === -1) {
                        return;
                    }
                    manuallySetFocus(
                        menuLinkRefs[
                            index === menuLinkRefs.length - 1 ? 0 : index + 1
                        ].current,
                    );
                    stopEvent(event);
                    break;
                }
                case 'Home':
                case 'PageUp': {
                    manuallySetFocus(menuLinkRefs[0].current);
                    stopEvent(event);
                    break;
                }
                case 'End':
                case 'PageDown': {
                    manuallySetFocus(
                        menuLinkRefs[menuLinkRefs.length - 1].current,
                    );
                    stopEvent(event);
                }
            }
        };
        window.addEventListener('keydown', listener);
        return () => {
            window.removeEventListener('keydown', listener);
        };
    }, [!!isMenuOpen]);

    const headerRef = useRef<HTMLElement>();
    const menuRef = useRef<HTMLElement>();
    const firstLinkRef = useRef<HTMLAnchorElement>();

    useEffect(() => {
        if (!isMenuOpen) {
            return;
        }
        let animationRequestId: number | undefined;
        const listener = (event: FocusEvent) => {
            if (isMovingFocusManuallyRef.current) {
                return;
            }
            const target = event.target;
            if (animationRequestId !== undefined) {
                cancelAnimationFrame(animationRequestId);
                animationRequestId = undefined;
            }
            const lastLinkRef = menuLinkRefs[menuLinkRefs.length - 1];
            if (
                target !== firstLinkRef.current &&
                target !== lastLinkRef.current
            ) {
                return;
            }
            animationRequestId = requestAnimationFrame(() => {
                animationRequestId = undefined;
                const focusedElement = document.activeElement;
                if (
                    headerRef.current.contains(focusedElement) ||
                    menuRef.current.contains(focusedElement)
                ) {
                    return;
                }
                if (target === lastLinkRef.current) {
                    manuallySetFocus(firstLinkRef.current);
                } else {
                    manuallySetFocus(lastLinkRef.current);
                }
            });
        };
        document.body.addEventListener('focusout', listener);
        return () => {
            if (animationRequestId !== undefined) {
                cancelAnimationFrame(animationRequestId);
            }
            document.body.removeEventListener('focusout', listener);
        };
    }, [!!isMenuOpen]);

    const { 0: fixChromiumFocusBug, 1: setFixChromiumFocusBug } = useState(
        false,
    );

    useEffect(() => {
        if (!fixChromiumFocusBug) {
            return;
        }
        const listener = (event: FocusEvent) => {
            if (
                isChromium &&
                fixChromiumFocusBug &&
                !isMovingFocusManuallyRef.current &&
                menuLinkRefs.some((ref) => ref.current === event.target)
            ) {
                setFixChromiumFocusBug(false);
            }
        };
        document.body.addEventListener('focusout', listener);
        return () => document.body.removeEventListener('focusout', listener);
    }, [fixChromiumFocusBug]);

    const toggleMenu = useCallback(() => {
        setMenuOpen((isMenuOpen) => !isMenuOpen);
    }, []);

    const onMenuLinkClick = useCallback(() => {
        setMenuOpen(null);
    }, []);

    const onSearchInput = useCallback<
        JSX.GenericEventHandler<HTMLInputElement>
    >((e) => {
        setSearchValue(e.currentTarget.value);
    }, []);

    const toggleButtonRef = useRef<HTMLButtonElement>();

    const onToggleButtonRelease = useCallback(() => {
        if (isChromium) {
            setFixChromiumFocusBug(true);
        }
    }, []);

    useLayoutEffect(() => {
        if (isMenuOpen) {
            menuLinkRefs[0].current.focus();
        } else if (isMenuOpen === false) {
            toggleButtonRef.current.focus();
        } else if (isMenuOpen === null) {
            // Hack to reset page's focus as it would be upon first load.
            const tempDiv = document.createElement('div');
            tempDiv.setAttribute('tabindex', '0');
            document.body.insertBefore(tempDiv, document.body.firstChild);
            tempDiv.focus();
            isMovingFocusManuallyRef.current = true;
            document.body.removeChild(tempDiv);
            isMovingFocusManuallyRef.current = false;
        }
    }, [isMenuOpen]);

    const isDocumentationPage = Object.keys(pageIdToWebsitePath).some(
        (pageId) => {
            const href = `/${pageIdToWebsitePath[pageId]}`;
            return isActivePath(parsePathDefaultingToEmptyString(href));
        },
    );

    const isLicensePage = isActivePath(
        parsePathDefaultingToEmptyString('/license'),
    );

    const toggleButtonLabel = `${isMenuOpen ? 'Close' : 'Open'} Menu`;

    return (
        <Fragment>
            <header role="banner" class="header" ref={headerRef}>
                <div class="header__contents">
                    <div class="header__contents__container">
                        <Link
                            innerRef={firstLinkRef}
                            href="/"
                            class="header__logo"
                        >
                            <svg
                                class="header__logo__img header__logo__with-text"
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
                                    fill="#000"
                                    d="M85.996 29.652h-4.712v9.12c0 2.432 1.596 2.394 4.712 2.242V44.7c-6.308.76-8.816-.988-8.816-5.928v-9.12h-3.496V25.7h3.496v-5.104l4.104-1.216v6.32h4.712v3.952zm17.962-3.952h4.104v19h-4.104v-2.736c-1.444 2.014-3.686 3.23-6.65 3.23-5.168 0-9.462-4.37-9.462-9.994 0-5.662 4.294-9.994 9.462-9.994 2.964 0 5.206 1.216 6.65 3.192V25.7zm-6.004 15.58c3.42 0 6.004-2.546 6.004-6.08 0-3.534-2.584-6.08-6.004-6.08-3.42 0-6.004 2.546-6.004 6.08 0 3.534 2.584 6.08 6.004 6.08zm16.948-18.43c-1.444 0-2.622-1.216-2.622-2.622a2.627 2.627 0 012.622-2.622 2.627 2.627 0 012.622 2.622c0 1.406-1.178 2.622-2.622 2.622zM112.85 44.7v-19h4.104v19h-4.104zm8.854 0V16.96h4.104V44.7h-4.104zm30.742-19h4.332l-5.966 19h-4.028l-3.952-12.806-3.99 12.806h-4.028l-5.966-19h4.332l3.686 13.11 3.99-13.11h3.914l3.952 13.11 3.724-13.11zm9.424-2.85c-1.444 0-2.622-1.216-2.622-2.622a2.627 2.627 0 012.622-2.622 2.627 2.627 0 012.622 2.622c0 1.406-1.178 2.622-2.622 2.622zm-2.052 21.85v-19h4.104v19h-4.104zm18.848-19.494c4.256 0 7.296 2.888 7.296 7.828V44.7h-4.104V33.452c0-2.888-1.672-4.408-4.256-4.408-2.698 0-4.826 1.596-4.826 5.472V44.7h-4.104v-19h4.104v2.432c1.254-1.976 3.306-2.926 5.89-2.926zm26.752-7.106h4.104v26.6h-4.104v-2.736c-1.444 2.014-3.686 3.23-6.65 3.23-5.168 0-9.462-4.37-9.462-9.994 0-5.662 4.294-9.994 9.462-9.994 2.964 0 5.206 1.216 6.65 3.192V18.1zm-6.004 23.18c3.42 0 6.004-2.546 6.004-6.08 0-3.534-2.584-6.08-6.004-6.08-3.42 0-6.004 2.546-6.004 6.08 0 3.534 2.584 6.08 6.004 6.08zm23.864 3.914c-5.738 0-10.032-4.37-10.032-9.994 0-5.662 4.294-9.994 10.032-9.994 3.724 0 6.954 1.938 8.474 4.902l-3.534 2.052c-.836-1.786-2.698-2.926-4.978-2.926-3.344 0-5.89 2.546-5.89 5.966 0 3.42 2.546 5.966 5.89 5.966 2.28 0 4.142-1.178 5.054-2.926l3.534 2.014c-1.596 3.002-4.826 4.94-8.55 4.94zm15.314-14.25c0 3.458 10.222 1.368 10.222 8.398 0 3.8-3.306 5.852-7.41 5.852-3.8 0-6.536-1.71-7.752-4.446l3.534-2.052c.608 1.71 2.128 2.736 4.218 2.736 1.824 0 3.23-.608 3.23-2.128 0-3.382-10.222-1.482-10.222-8.284 0-3.572 3.078-5.814 6.954-5.814 3.116 0 5.7 1.444 7.03 3.952l-3.458 1.938c-.684-1.482-2.014-2.166-3.572-2.166-1.482 0-2.774.646-2.774 2.014zm17.518 0c0 3.458 10.222 1.368 10.222 8.398 0 3.8-3.306 5.852-7.41 5.852-3.8 0-6.536-1.71-7.752-4.446l3.534-2.052c.608 1.71 2.128 2.736 4.218 2.736 1.824 0 3.23-.608 3.23-2.128 0-3.382-10.222-1.482-10.222-8.284 0-3.572 3.078-5.814 6.954-5.814 3.116 0 5.7 1.444 7.03 3.952l-3.458 1.938c-.684-1.482-2.014-2.166-3.572-2.166-1.482 0-2.774.646-2.774 2.014z"
                                ></path>
                            </svg>
                            <svg
                                class="header__logo__img header__logo__without-text"
                                role="img"
                                aria-label="Click to Go Home"
                                viewBox="0 0 64 64"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <title>Tailwind CSS</title>
                                <path
                                    fill="#14B4C6"
                                    d="M32 16.3c-7.2 0-11.7 3.6-13.5 10.8 2.7-3.6 5.85-4.95 9.45-4.05 2.054.514 3.522 2.004 5.147 3.653C35.744 29.39 38.808 32.5 45.5 32.5c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.514-3.522-2.004-5.147-3.653C41.756 19.41 38.692 16.3 32 16.3zM18.5 32.5c-7.2 0-11.7 3.6-13.5 10.8 2.7-3.6 5.85-4.95 9.45-4.05 2.054.514 3.522 2.004 5.147 3.653C22.244 45.59 25.308 48.7 32 48.7c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.514-3.522-2.004-5.147-3.653C28.256 35.61 25.192 32.5 18.5 32.5z"
                                ></path>
                            </svg>
                        </Link>
                    </div>
                    <div class="header__search">
                        <input
                            placeholder="Search..."
                            aria-label="Search Website"
                            class="header__search__input"
                            value={searchValue}
                            onInput={onSearchInput}
                        />
                        <div class="header__search__icon">
                            <svg
                                class="header__search__icon__svg"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                            >
                                <path d="M12.9 14.32a8 8 0 1 1 1.41-1.41l5.35 5.33-1.42 1.42-5.33-5.34zM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z"></path>
                            </svg>
                        </div>
                    </div>
                    <div class="header__contents__container">
                        <nav
                            aria-label="quick navigation links"
                            class="header__nav header__nav__pages"
                        >
                            <div
                                class={
                                    'header__nav__link-container' +
                                    (isDocumentationPage
                                        ? ' header__nav__link-container--active'
                                        : '')
                                }
                            >
                                <DocPageLink
                                    class="header__nav__link"
                                    pageId="core--introduction"
                                >
                                    Documentation
                                </DocPageLink>
                            </div>
                            <div
                                class={
                                    'header__nav__link-container' +
                                    (isLicensePage
                                        ? ' header__nav__link-container--active'
                                        : '')
                                }
                            >
                                <Link class="header__nav__link" href="/license">
                                    License
                                </Link>
                            </div>
                        </nav>
                        <div class="header__version">v0.0.1</div>
                        <nav aria-label="quick links" class="header__nav">
                            <a
                                class="header__nav__link"
                                aria-label="Open GitHub Repository"
                                title="Open GitHub Repository"
                                href={
                                    github
                                        ? `https://github.com/${github.org}/${github.repo}/tree/${github.sha}`
                                        : 'https://github.com/anthonyrota/microstream'
                                }
                            >
                                <svg
                                    class="header__nav__icon"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                >
                                    <title>Open GitHub Repository</title>
                                    <path d="M10 0a10 10 0 0 0-3.16 19.49c.5.1.68-.22.68-.48l-.01-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.1.39-1.99 1.03-2.69a3.6 3.6 0 0 1 .1-2.64s.84-.27 2.75 1.02a9.58 9.58 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.37.2 2.4.1 2.64.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85l-.01 2.75c0 .26.18.58.69.48A10 10 0 0 0 10 0"></path>
                                </svg>
                            </a>
                            <button
                                class="header__nav__link"
                                type="button"
                                aria-expanded={isMenuOpen}
                                aria-label={toggleButtonLabel}
                                tabIndex={0}
                                title={toggleButtonLabel}
                                onMouseUp={onToggleButtonRelease}
                                onTouchEnd={onToggleButtonRelease}
                                onClick={toggleMenu}
                                ref={toggleButtonRef}
                            >
                                <svg
                                    class="header__nav__icon header__nav__icon--menu"
                                    viewBox="0 0 24 24"
                                >
                                    <title>{toggleButtonLabel}</title>
                                    {isMenuOpen ? (
                                        <path d="M4,18h11c0.55,0,1-0.45,1-1v0c0-0.55-0.45-1-1-1H4c-0.55,0-1,0.45-1,1v0C3,17.55,3.45,18,4,18z M4,13h8c0.55,0,1-0.45,1-1v0 c0-0.55-0.45-1-1-1H4c-0.55,0-1,0.45-1,1v0C3,12.55,3.45,13,4,13z M3,7L3,7c0,0.55,0.45,1,1,1h11c0.55,0,1-0.45,1-1v0 c0-0.55-0.45-1-1-1H4C3.45,6,3,6.45,3,7z M20.3,14.88L17.42,12l2.88-2.88c0.39-0.39,0.39-1.02,0-1.41l0,0 c-0.39-0.39-1.02-0.39-1.41,0l-3.59,3.59c-0.39,0.39-0.39,1.02,0,1.41l3.59,3.59c0.39,0.39,1.02,0.39,1.41,0l0,0 C20.68,15.91,20.69,15.27,20.3,14.88z" />
                                    ) : (
                                        <path d="M4 18h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1s.45 1 1 1zm0-5h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1s.45 1 1 1zM3 7c0 .55.45 1 1 1h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1z" />
                                    )}
                                </svg>
                            </button>
                        </nav>
                    </div>
                </div>
            </header>
            {isMenuOpen && (
                <aside
                    ref={menuRef}
                    class={'menu' + (isMenuOpen ? ' menu--open' : '')}
                >
                    <ul
                        class="menu__contents"
                        role="navigation"
                        aria-label="Site Menu"
                    >
                        {order.map((pageId, index) => {
                            const href = `/${pageIdToWebsitePath[pageId]}`;
                            const isActive = isActivePath(
                                parsePathDefaultingToEmptyString(href),
                            );

                            return (
                                <li key={pageId} role="none" class="menu__li">
                                    <div
                                        class={
                                            'menu__link-container' +
                                            (isActive
                                                ? ' menu__link-container--active'
                                                : '')
                                        }
                                    >
                                        <DocPageLink
                                            class={
                                                'menu__link' +
                                                (fixChromiumFocusBug
                                                    ? ' menu__link--fix-chromium-focus'
                                                    : '')
                                            }
                                            pageId={pageId}
                                            innerRef={menuLinkRefs[index]}
                                            onClick={onMenuLinkClick}
                                        >
                                            {pageIdToPageTitle[pageId]}
                                        </DocPageLink>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </aside>
            )}
        </Fragment>
    );
}

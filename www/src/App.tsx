import { h, Fragment, VNode } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { FullSiteNavigationContents } from './components/FullSiteNavigationContents';
import { Header } from './components/Header';
import { memo } from './components/memo';
import {
    getPagesMetadata,
    ResponseLoadingType,
    getCurrentResponseState,
} from './data/docPages';
import { useDocPagesResponseState } from './hooks/useDocPagesResponseState';
import { customHistory, Path, useHistory } from './hooks/useHistory';
import { BindKeysRequireFocus } from './hooks/useNavigationListKeyBindings';
import { usePrevious } from './hooks/usePrevious';
import {
    useSticky,
    UseStickyJsStickyActive,
    UseStickyNativeStickyReady,
} from './hooks/useSticky';
import { AppPathBaseProps } from './pages/base';
import { DocPage } from './pages/DocPage';
import { IndexPage } from './pages/IndexPage';
import { LicensePage } from './pages/LicensePage';
import { NotFoundPage } from './pages/NotFoundPage';

function setFocusBefore(element?: ChildNode): void {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const parentEl = element ? element.parentElement! : document.body;
    const tempSpan = document.createElement('span');
    tempSpan.setAttribute('tabindex', '0');
    parentEl.insertBefore(tempSpan, element || document.body.firstChild);
    tempSpan.focus();

    if (element) {
        tempSpan.classList.add('cls-temp-focus-span');
        tempSpan.addEventListener('focusout', () => {
            parentEl.removeChild(tempSpan);
        });
    } else {
        parentEl.removeChild(tempSpan);
    }

    if (element && element instanceof Element) {
        element.scrollIntoView();
    } else {
        window.scrollTo(0, 0);
    }
}

function getPageIdFromPathname(pathname: string): string | void {
    const { pageIdToWebsitePath } = getPagesMetadata();
    for (const pageId in pageIdToWebsitePath) {
        const pagePath = pageIdToWebsitePath[pageId];
        if (pathname === `/${pagePath}`) {
            return pageId;
        }
    }
}

export interface AppProps {
    path?: Path;
}

export function App(props: AppProps): VNode {
    const { path } = useHistory({ path: props.path });
    const appPathProps: Omit<AppPathProps, 'mainRef'> = {
        pathname: path.pathname,
        isDuplicateRender: false,
    };
    const nextPreviousAppPathPropsBox: [Omit<AppPathProps, 'mainRef'>] = [
        appPathProps,
    ];
    const previousAppPathPropsBox = usePrevious(nextPreviousAppPathPropsBox);

    // Needed in the below case where we are blocking the page transition.
    useDocPagesResponseState();

    let appPathPropsToUse = appPathProps;
    const docPageId = getPageIdFromPathname(path.pathname);

    if (
        previousAppPathPropsBox &&
        getCurrentResponseState().type === ResponseLoadingType &&
        docPageId !== undefined
    ) {
        const previousAppPathProps = previousAppPathPropsBox.value[0];
        if (
            getPageIdFromPathname(previousAppPathProps.pathname) === undefined
        ) {
            // The doc pages are still loading and we are going from a non
            // doc page to a doc page. In this case prevent the transition
            // until the pages load.
            nextPreviousAppPathPropsBox[0] = previousAppPathProps;
            appPathPropsToUse = {
                pathname: previousAppPathProps.pathname,
                isDuplicateRender: true,
            };
        }
    }

    const mainRef = useRef<HTMLElement>();
    const onSkipLinkClick = (event: Event) => {
        event.preventDefault();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        setFocusBefore(mainRef.current.firstChild!);
    };

    const showSidebar = docPageId !== undefined;

    return (
        <Fragment>
            <a
                class="cls-skip-link"
                href="#main"
                alt=""
                onClick={onSkipLinkClick}
            >
                Skip to main
            </a>
            <Header enableMenu={docPageId === undefined} />
            <div class="cls-page">
                <div class="cls-page__inner">
                    {showSidebar && <Sidebar />}
                    <div class="cls-page__content">
                        <AppPath mainRef={mainRef} {...appPathPropsToUse} />
                    </div>
                </div>
            </div>
        </Fragment>
    );
}

function Sidebar(): VNode {
    const { heightStyle, stickyState, elRefCb } = useSticky();

    return (
        <Fragment>
            <span ref={elRefCb} />
            <aside
                class={
                    `cls-page__sidebar` +
                    (stickyState === UseStickyJsStickyActive
                        ? ' cls-page__sidebar--js-sticky-active'
                        : stickyState === UseStickyNativeStickyReady
                        ? ' cls-page__sidebar--native-sticky-fix-active'
                        : '')
                }
                style={heightStyle && { height: heightStyle }}
            >
                <FullSiteNavigationContents bindKeys={BindKeysRequireFocus} />
            </aside>
        </Fragment>
    );
}

interface AppPathProps extends AppPathBaseProps {
    pathname: string;
    isDuplicateRender: boolean;
}

function AppPath({
    mainRef,
    pathname,
    isDuplicateRender,
}: AppPathProps): VNode {
    const { hash } = customHistory.location;
    const isFirstRenderRef = useRef(true);

    useEffect(() => {
        if (isFirstRenderRef.current) {
            isFirstRenderRef.current = false;
            return;
        }

        if (isDuplicateRender) {
            return;
        }

        if (hash) {
            const element = document.getElementById(hash.slice(1));
            if (element) {
                setFocusBefore(element);
                return;
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        setFocusBefore();
    });

    return <AppPathContent mainRef={mainRef} pathname={pathname} />;
}

interface AppPathContentProps extends AppPathBaseProps {
    pathname: string;
}

const AppPathContent = memo(
    function AppPathContent({ mainRef, pathname }: AppPathContentProps): VNode {
        if (pathname === '/') {
            return <IndexPage mainRef={mainRef} />;
        }

        if (pathname === '/license') {
            return <LicensePage mainRef={mainRef} />;
        }

        const pageId = getPageIdFromPathname(pathname);
        if (pageId !== undefined) {
            return <DocPage mainRef={mainRef} pageId={pageId} key={pageId} />;
        }

        return <NotFoundPage mainRef={mainRef} />;
    },
    (previousProps, currentProps) =>
        previousProps.pathname !== currentProps.pathname ||
        previousProps.mainRef !== currentProps.mainRef,
);

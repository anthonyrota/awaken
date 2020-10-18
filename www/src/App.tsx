import { h, Fragment, VNode } from 'preact';
import { useLayoutEffect, useRef } from 'preact/hooks';
import {
    BindKeysRequireFocus,
    FullSiteNavigationContents,
    Header,
} from './components/Header';
import {
    getPagesMetadata,
    ResponseLoadingType,
    getCurrentResponseState,
} from './data/docPages';
import { useDocPagesResponseState } from './hooks/useDocPagesResponseState';
import { customHistory, Path, useHistory } from './hooks/useHistory';
import { usePrevious } from './hooks/usePrevious';
import { DocPage } from './pages/DocPage';
import { IndexPage } from './pages/IndexPage';
import { NotFoundPage } from './pages/NotFoundPage';

export interface AppProps {
    path?: Path;
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

function setFocusBefore(element: ChildNode): void {
    const parentEl = element.parentElement;
    if (!parentEl) {
        return;
    }

    const tempDiv = document.createElement('div');
    tempDiv.setAttribute('tabindex', '0');
    parentEl.insertBefore(tempDiv, element);
    tempDiv.focus();
    parentEl.removeChild(tempDiv);
}

export function App(props: AppProps): VNode {
    const { path } = useHistory({ path: props.path });
    const appPathProps: AppPathProps = {
        pathname: path.pathname,
        isDuplicateRender: false,
    };
    const nextPreviousAppPathPropsBox: [AppPathProps] = [appPathProps];
    const previousAppPathPropsBox = usePrevious(nextPreviousAppPathPropsBox);

    // Needed in the below case where we are blocking the page transition.
    useDocPagesResponseState();

    const pageContentRef = useRef<HTMLElement>();
    const onSkipLinkClick = (event: Event) => {
        event.preventDefault();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        setFocusBefore(pageContentRef.current.firstChild!);
    };

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

    return (
        <Fragment>
            <a
                class="skip-link"
                tabIndex={0}
                href="#main"
                alt=""
                onClick={onSkipLinkClick}
            >
                Skip to main
            </a>
            <Header enableMenu={docPageId === undefined} />
            <div class="page">
                <div class="page__inner">
                    {docPageId !== undefined && (
                        <aside class="page__sidebar">
                            <FullSiteNavigationContents
                                bindKeys={BindKeysRequireFocus}
                            />
                        </aside>
                    )}
                    <main class="page__content" ref={pageContentRef}>
                        <AppPath {...appPathPropsToUse} />
                    </main>
                </div>
            </div>
        </Fragment>
    );
}

interface AppPathProps {
    pathname: string;
    isDuplicateRender: boolean;
}

function AppPath({ pathname, isDuplicateRender }: AppPathProps): VNode {
    const { location } = customHistory;
    const isFirstRenderRef = useRef(true);

    useLayoutEffect(() => {
        if (isFirstRenderRef.current) {
            isFirstRenderRef.current = false;
            return;
        }

        if (isDuplicateRender) {
            return;
        }

        if (location.hash) {
            const element = document.getElementById(location.hash);
            if (element) {
                setFocusBefore(element);
            } else {
                return;
            }
        }

        setFocusBefore(document.body);
    }, [location, isDuplicateRender]);

    if (pathname === '/') {
        return <IndexPage />;
    }

    const pageId = getPageIdFromPathname(pathname);
    if (pageId !== undefined) {
        return <DocPage pageId={pageId} />;
    }

    return <NotFoundPage />;
}

import { h, Fragment, VNode } from 'preact';
import { useLayoutEffect, useRef } from 'preact/hooks';
import { Header } from './components/Header';
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

    const mainAnchorRef = useRef<HTMLAnchorElement>();
    function onSkipLinkClick(event: Event): void {
        event.preventDefault();
        mainAnchorRef.current.scrollIntoView();
        mainAnchorRef.current.focus();
    }

    let appPathPropsToUse = appPathProps;

    if (
        previousAppPathPropsBox &&
        getCurrentResponseState().type === ResponseLoadingType &&
        getPageIdFromPathname(path.pathname) !== undefined
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
            <Header />
            <a tabIndex={0} name="main" ref={mainAnchorRef} />
            <main class="main">
                <AppPath {...appPathPropsToUse} />
            </main>
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

        let setFocusBeforeEl: Element = document.body;

        if (location.hash) {
            const setFocusBeforeEl_ = document.getElementById(location.hash);
            if (setFocusBeforeEl_) {
                setFocusBeforeEl = setFocusBeforeEl_;
            } else {
                return;
            }
        }

        const parentEl = setFocusBeforeEl.parentElement;
        if (!parentEl) {
            return;
        }

        const tempDiv = document.createElement('div');
        tempDiv.setAttribute('tabindex', '0');
        parentEl.insertBefore(tempDiv, setFocusBeforeEl);
        tempDiv.focus();
        parentEl.removeChild(tempDiv);
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

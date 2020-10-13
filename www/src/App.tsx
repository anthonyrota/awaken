import { h, Fragment, VNode, JSX } from 'preact';
import { useCallback, useRef } from 'preact/hooks';
import { Header } from './components/Header';
import {
    getPagesMetadata,
    ResponseLoadingType,
    getCurrentResponseState,
} from './data/docPages';
import { useDocPagesResponseState } from './hooks/useDocPagesResponseState';
import { Path, useHistory } from './hooks/useHistory';
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
    };
    const nextPreviousAppPathPropsBox: [AppPathProps] = [appPathProps];
    const previousAppPathPropsBox = usePrevious(nextPreviousAppPathPropsBox);

    // Needed in the below case where we are blocking the page transition.
    useDocPagesResponseState();

    const mainAnchorRef = useRef<HTMLAnchorElement>();
    const onSkipLinkClick = useCallback<
        JSX.MouseEventHandler<HTMLAnchorElement>
    >((event) => {
        event.preventDefault();
        mainAnchorRef.current.scrollIntoView();
        mainAnchorRef.current.focus();
    }, []);

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
            appPathPropsToUse = previousAppPathProps;
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
}

function AppPath({ pathname }: AppPathProps): VNode {
    if (pathname === '/') {
        return <IndexPage />;
    }

    const pageId = getPageIdFromPathname(pathname);
    if (pageId !== undefined) {
        return <DocPage pageId={pageId} />;
    }

    return <NotFoundPage />;
}

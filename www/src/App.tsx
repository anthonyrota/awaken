import { h, VNode } from 'preact';
import { pageIdToWebsitePath } from './docPages/dynamicData';
import {
    ResponseLoadingType,
    getCurrentResponseState,
} from './docPages/request';
import { Path, useHistory } from './History';
import { useDocPagesResponseState } from './hooks/useDocPagesResponseState';
import { usePrevious } from './hooks/usePrevious';
import { DocPage } from './routes/DocPage';
import { IndexPage } from './routes/IndexPage';
import { NotFoundPage } from './routes/NotFoundPage';

export interface AppProps {
    path?: Path;
}

function getPageIdFromPathname(pathname: string): string | void {
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
            return <AppPath {...previousAppPathProps} />;
        }
    }

    return <AppPath {...appPathProps} />;
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

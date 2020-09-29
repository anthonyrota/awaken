import { h, VNode } from 'preact';
import { pageIdToWebsitePath } from './docPages/dynamicData';
import { getGlobalState, ResponseLoadingType } from './docPages/request';
import { Path, useHistory } from './History';
import { usePrevious } from './hooks/usePrevious';
import { DocPage } from './routes/DocPage';
import { IndexPage } from './routes/IndexPage';
import { NotFoundPage } from './routes/NotFoundPage';

export interface AppProps {
    path?: Path;
}

export function App(props: AppProps): VNode {
    const { path } = useHistory({ path: props.path });
    const appPathProps: AppPathProps = {
        pathname: path.pathname,
    };
    const nextPreviousAppPathPropsBox: [AppPathProps] = [appPathProps];
    const previousAppPathPropsBox = usePrevious(nextPreviousAppPathPropsBox);

    if (previousAppPathPropsBox) {
        for (const pageId in pageIdToWebsitePath) {
            const pagePath = pageIdToWebsitePath[pageId];
            if (path.pathname === `/${pagePath}`) {
                if (getGlobalState().type === ResponseLoadingType) {
                    const previousAppPathProps =
                        previousAppPathPropsBox.value[0];
                    // Preserve previous.
                    nextPreviousAppPathPropsBox[0] = previousAppPathProps;
                    return <AppPath {...previousAppPathProps} />;
                }
            }
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

    for (const pageId in pageIdToWebsitePath) {
        const pagePath = pageIdToWebsitePath[pageId];
        if (pathname === `/${pagePath}`) {
            return <DocPage pageId={pageId} />;
        }
    }

    return <NotFoundPage />;
}

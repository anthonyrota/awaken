import { History, createBrowserHistory, Action } from 'history';
import { useState, useEffect } from 'preact/hooks';
import { isBrowser } from '../env';
import { usePrevious } from './usePrevious';

export type HistoryState = {
    beforeMenuOpenScrollTop?: number;
} | null;

export let customHistory!: History<HistoryState>;
if (isBrowser) {
    customHistory = createBrowserHistory();
}

export function setCustomHistory(customHistory_: History) {
    customHistory = customHistory_;
}

export interface Path {
    pathname: string;
    search?: string;
    hash?: string;
}

function endsWithExcessTrailingSlash(path: Path): boolean {
    return (
        path.pathname[path.pathname.length - 1] === '/' && path.pathname !== '/'
    );
}

let ignoreChange = false;
export function whileIgnoringChange(cb: () => void) {
    const before = ignoreChange;
    ignoreChange = true;
    cb();
    ignoreChange = before;
}

function cleanTrailingSlash(path: Path, replace?: boolean): Path {
    if (!endsWithExcessTrailingSlash(path)) {
        return path;
    }

    do {
        path = { ...path, pathname: path.pathname.slice(0, -1) };
    } while (endsWithExcessTrailingSlash(path));

    if (replace) {
        whileIgnoringChange(() => {
            customHistory.replace(path);
        });
    }

    return path;
}

function normalizePath(path: Path, replace?: boolean): Path {
    path = {
        pathname: path.pathname,
        search: path.search,
        hash: path.hash,
    };
    return cleanTrailingSlash(path, replace);
}

export interface UseHistoryParams {
    path?: Path;
    _watchOnly?: boolean;
}

export interface UseHistoryResult {
    path: Path;
}

export function useHistory(params: UseHistoryParams): UseHistoryResult {
    const { 0: path, 1: setPath } = useState(
        normalizePath(
            params.path || customHistory.location,
            !params._watchOnly,
        ),
    );

    useEffect(() => {
        return customHistory.listen(({ location, action }) => {
            if (ignoreChange) {
                return;
            }
            setPath(normalizePath(location, !params._watchOnly));
            if (
                action === Action.Pop &&
                location.state &&
                location.state.beforeMenuOpenScrollTop !== undefined
            ) {
                const { beforeMenuOpenScrollTop } = location.state;
                whileIgnoringChange(() => {
                    customHistory.replace(customHistory.location, null);
                });
                // TODO.
                requestAnimationFrame(() => {
                    window.scrollTo(0, beforeMenuOpenScrollTop);
                });
            }
        });
    });

    return {
        path,
    };
}

export function usePath(): Path {
    return useHistory({
        _watchOnly: true,
    }).path;
}

export function useDidPathChange(): boolean {
    const path = usePath();
    const previousPath = usePrevious(path);
    if (previousPath && previousPath.value !== path) {
        previousPath.value = path;
        return true;
    }
    return false;
}

export function useHistoryAction(): Action | null {
    const { 0: action, 1: setAction } = useState<Action | null>(null);

    useEffect(() => {
        return customHistory.listen(({ action }) => {
            if (ignoreChange) {
                return;
            }
            setAction(action);
        });
    });

    return action;
}

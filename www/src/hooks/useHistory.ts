import { History, createBrowserHistory } from 'history';
import { useState, useEffect } from 'preact/hooks';
import { isBrowser } from '../env';

export let customHistory!: History;
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

let isRemovingTrailingSlash = false;

function cleanTrailingSlash(path: Path, replace?: boolean): Path {
    if (!endsWithExcessTrailingSlash(path)) {
        return path;
    }

    do {
        path = { ...path, pathname: path.pathname.slice(0, -1) };
    } while (endsWithExcessTrailingSlash(path));

    isRemovingTrailingSlash = true;
    if (replace) {
        customHistory.replace(path);
    }
    isRemovingTrailingSlash = false;

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
}

export interface UseHistoryResult {
    path: Path;
}

export function useHistory(params: UseHistoryParams): UseHistoryResult {
    const { 0: result, 1: setResult } = useState<UseHistoryResult>({
        path: normalizePath(params.path || customHistory.location, true),
    });

    useEffect(() => {
        return customHistory.listen(({ location }) => {
            if (isRemovingTrailingSlash) {
                return;
            }
            setResult({
                path: normalizePath(location, true),
            });
        });
    });

    return result;
}

export function usePath(): Path {
    const { 0: path, 1: setPath } = useState(
        normalizePath(customHistory.location),
    );

    useEffect(() => {
        return customHistory.listen(({ location }) => {
            if (isRemovingTrailingSlash) {
                return;
            }
            setPath(normalizePath(location));
        });
    });

    return path;
}

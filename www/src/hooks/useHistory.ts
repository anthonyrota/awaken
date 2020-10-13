import { History, createBrowserHistory } from 'history';
import { useState, useEffect } from 'preact/hooks';

export interface Path {
    pathname: string;
    search?: string;
    hash?: string;
}

export interface UseHistoryParams {
    path?: Path;
}

export interface UseHistoryResult {
    path: Path;
}

export let customHistory!: History;
if (typeof window !== 'undefined') {
    customHistory = createBrowserHistory();
}

export function setCustomHistory(customHistory_: History) {
    customHistory = customHistory_;
}

function endsWithExcessTrailingSlash(path: Path): boolean {
    return (
        path.pathname[path.pathname.length - 1] === '/' && path.pathname !== '/'
    );
}

let isRemovingTrailingSlash = false;

function cleanTrailingSlash(path: Path): void {
    if (!endsWithExcessTrailingSlash(path)) {
        return;
    }

    do {
        path = { ...path, pathname: path.pathname.slice(0, -1) };
    } while (endsWithExcessTrailingSlash(path));

    isRemovingTrailingSlash = true;
    customHistory.replace(path);
    isRemovingTrailingSlash = false;
}

function normalizePath(path: Path): Path {
    path = {
        pathname: path.pathname,
        search: path.search,
        hash: path.hash,
    };
    cleanTrailingSlash(path);
    return path;
}

export function useHistory(params: UseHistoryParams): UseHistoryResult {
    const path = normalizePath(params.path || customHistory.location);

    const { 0: result, 1: setResult } = useState<UseHistoryResult>({
        path,
    });

    useEffect(() => {
        return customHistory.listen(({ location }) => {
            if (isRemovingTrailingSlash) {
                return;
            }
            setResult({
                path: normalizePath(location),
            });
        });
    });

    return result;
}

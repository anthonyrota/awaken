import { History, createBrowserHistory } from 'history';
import { h, VNode, JSX } from 'preact';
import { useState, useCallback, useEffect } from 'preact/hooks';

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

export function Link(
    props: JSX.HTMLAttributes<HTMLAnchorElement> & { href: string },
): VNode {
    const { onClick: customOnClick, target, href } = props;

    const onLinkClick: JSX.MouseEventHandler<HTMLAnchorElement> = (event) => {
        if (customOnClick) {
            customOnClick.call(this, event);
        }

        if (
            event.defaultPrevented ||
            event.ctrlKey ||
            event.metaKey ||
            event.altKey ||
            event.shiftKey ||
            event.button !== 0 ||
            (target && target !== '_self')
        ) {
            return;
        }

        event.stopImmediatePropagation();
        event.stopPropagation();
        event.preventDefault();
        customHistory.push(href);
        return false;
    };

    return (
        <a
            {...props}
            onClick={useCallback(onLinkClick, [customOnClick, target, href])}
        />
    );
}

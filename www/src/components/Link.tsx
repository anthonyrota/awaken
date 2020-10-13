import { createPath, parsePath, PartialPath } from 'history';
import { h, VNode, JSX } from 'preact';
import { useCallback } from 'preact/hooks';
import { customHistory } from '../hooks/useHistory';

export function Link({
    innerRef,
    onClick,
    ...props
}: JSX.HTMLAttributes<HTMLAnchorElement> & {
    innerRef?:
        | preact.RefObject<HTMLAnchorElement>
        | preact.RefCallback<HTMLAnchorElement>;
    href: string;
}): VNode {
    const { target, href } = props;

    const onLinkClick: JSX.MouseEventHandler<HTMLAnchorElement> = (event) => {
        if (onClick) {
            onClick.call(this, event);
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
        const newHref = parsePathDefaultingToEmptyString(href);
        if (isActivePath(newHref)) {
            customHistory.replace(newHref);
        } else {
            customHistory.push(newHref);
        }
        return false;
    };

    return (
        <a
            ref={innerRef}
            onClick={useCallback(onLinkClick, [onClick, target, href])}
            {...props}
        />
    );
}

export function parsePathDefaultingToEmptyString(
    href: string,
): Required<PartialPath> {
    const { pathname = '', hash = '', search = '' } = parsePath(href);
    return { pathname, hash, search };
}

export function isActivePath(path: PartialPath): boolean {
    return (
        createPath(path) ===
        createPath({
            pathname: customHistory.location.pathname,
            hash: customHistory.location.hash,
        })
    );
}

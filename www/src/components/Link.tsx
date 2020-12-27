import { parsePath, PartialPath } from 'history';
import { h, VNode, JSX } from 'preact';
import { getPagesMetadata } from '../data/docPages';
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
        navigateTo(newHref);
        return false;
    };

    return <a ref={innerRef} onClick={onLinkClick} {...props} />;
}

export function parsePathDefaultingToEmptyString(
    href: string,
): Required<PartialPath> {
    const { pathname = '', hash = '', search = '' } = parsePath(href);
    return { pathname, hash, search };
}

export function isActivePath(path: PartialPath): boolean {
    return path.pathname === customHistory.location.pathname;
}

export function isStringActivePath(stringPath: string): boolean {
    return isActivePath(parsePathDefaultingToEmptyString(stringPath));
}

export function isDocPageIdActivePath(docPageId: string): boolean {
    return isStringActivePath(
        `/${getPagesMetadata().pageIdToWebsitePath[docPageId]}`,
    );
}

export function navigateTo(path: Required<PartialPath>): void {
    if (isActivePath(path) && path.hash === customHistory.location.hash) {
        customHistory.replace(path);
    } else {
        customHistory.push(path);
    }
}

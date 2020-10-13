import { h, VNode, JSX } from 'preact';
import { getPagesMetadata } from '../data/docPages';
import { Link } from './Link';

export interface DocPageLinkProps
    extends Omit<JSX.HTMLAttributes<HTMLAnchorElement>, 'href'> {
    innerRef?:
        | preact.RefObject<HTMLAnchorElement>
        | preact.RefCallback<HTMLAnchorElement>;
    pageId: string;
    hash?: string;
}

export function DocPageLink({
    pageId,
    hash,
    innerRef,
    ...props
}: DocPageLinkProps): VNode {
    const { pageIdToWebsitePath } = getPagesMetadata();
    const pagePath = pageIdToWebsitePath[pageId];
    if (pagePath === undefined) {
        console.warn(`no doc page id ${pageId}`);
    }
    const href = hash !== undefined ? `${pagePath}#${hash}` : pagePath;
    return <Link innerRef={innerRef} href={`/${href}`} {...props} />;
}

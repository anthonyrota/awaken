import { useEffect } from 'preact/hooks';

export interface SSRHeadValues {
    title: string;
}

const ssrHeadValues: { [K in keyof SSRHeadValues]: SSRHeadValues[K] | null } = {
    title: null,
};

export function getSSRHeadValues(): SSRHeadValues {
    const { title } = ssrHeadValues;
    if (title === null) {
        throw new Error('Head title is not set.');
    }
    ssrHeadValues.title = null;
    return {
        title,
    };
}

export const WebsiteNamePositionStart = 0;
export const WebsiteNamePositionEnd = 1;

export interface DocumentTitleProps {
    title: string;
    websiteNamePosition?:
        | typeof WebsiteNamePositionStart
        | typeof WebsiteNamePositionEnd;
}

export function DocumentTitle({
    title,
    websiteNamePosition = WebsiteNamePositionEnd,
}: DocumentTitleProps): null {
    const titleWithWebsiteName =
        websiteNamePosition === WebsiteNamePositionStart
            ? `Microstream JS · ${title}`
            : `${title} · Microstream JS`;

    if (process.env.NODE_ENV === 'ssr') {
        ssrHeadValues.title = titleWithWebsiteName;
    }

    useEffect(() => {
        document.title = titleWithWebsiteName;
    }, [titleWithWebsiteName]);

    return null;
}

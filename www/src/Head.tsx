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

export interface DocumentTitleProps {
    title: string;
}

export function DocumentTitle({ title }: DocumentTitleProps): null {
    if (process.env.NODE_ENV === 'ssr') {
        ssrHeadValues.title = title;
    }

    useEffect(() => {
        document.title = title;
    }, [title]);

    return null;
}

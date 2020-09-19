import { PagesUrlList } from '../script/docs/apigen/types';

// eslint-disable-next-line max-len
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
export const docPageUrls: PagesUrlList = require('../temp/pagesUrlList.json');

export function convertDocPageUrlToUrlPathName(docPageUrl: string): string {
    return `/docs/${docPageUrl}`;
}

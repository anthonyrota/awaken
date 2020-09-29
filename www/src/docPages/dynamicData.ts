import * as fs from 'fs';
import type { PageIdToWebsitePath } from '../../script/docs/types';

// eslint-disable-next-line max-len
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
export const pageIdToWebsitePath: PageIdToWebsitePath = require('../../temp/pageIdToWebsitePath.json');
export const docPageUrls: string[] = Object.keys(pageIdToWebsitePath).map(
    (key) => pageIdToWebsitePath[key],
);

const hash = fs.readFileSync('temp/pagesHash', 'utf-8');
export const pagesPath = `/pages.${hash}.json`;

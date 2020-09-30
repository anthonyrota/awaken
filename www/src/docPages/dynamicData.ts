import type { PageIdToWebsitePath } from '../../script/docs/types';
import { globalPageIdToWebsitePathKey } from '../globalKeys';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const pageIdToWebsitePath: PageIdToWebsitePath =
    global[globalPageIdToWebsitePathKey];
export const docPageUrls: string[] = Object.keys(pageIdToWebsitePath).map(
    (key) => pageIdToWebsitePath[key],
);

process.env.NODE_ENV = 'ssr';
import { ResponseDoneType, ResponseState } from '../../src/data/docPages';
import {
    globalOnResponseStateChangeKey,
    globalPagesStateKey,
    globalPagesMetadataKey,
} from '../../src/globalKeys';
import type { PagesMetadata, Pages } from '../docs/types';
// eslint-disable-next-line max-len
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
export const pages: Pages = require('../../temp/pages.json');
const responseState: ResponseState = {
    type: ResponseDoneType,
    pages,
};
global[globalPagesStateKey] = responseState;
global[globalOnResponseStateChangeKey] = () => {
    throw new Error('This should not be called.');
};
// eslint-disable-next-line max-len
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
export const pagesMetadata: PagesMetadata = require('../../temp/pagesMetadata.json');
global[globalPagesMetadataKey] = pagesMetadata;

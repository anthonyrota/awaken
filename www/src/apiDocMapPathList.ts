import { ApiDocMapPathList } from './../script/docs/apigen/types';

// eslint-disable-next-line max-len
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
export const apiDocMapPathList: ApiDocMapPathList = require('../temp/apiDocMapPathList.json');

export function convertApiDocMapPathToUrlPathName(
    apiDocMapPath: string,
): string {
    const split = apiDocMapPath.split('/');
    const last = split[split.length - 1];
    const ending =
        last === '_index'
            ? split.slice(0, split.length - 1).join('/')
            : apiDocMapPath;
    return `/docs/api/${ending}`;
}

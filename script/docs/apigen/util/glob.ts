import * as glob from 'glob';
import { getAbsolutePath } from '../../../util/fileUtil';

function globResultToAbsolutePath(globResult: string): string {
    return getAbsolutePath(...globResult.split('/'));
}

export function globAbsolute(pattern: string): string[] {
    return glob.sync(pattern).map(globResultToAbsolutePath);
}

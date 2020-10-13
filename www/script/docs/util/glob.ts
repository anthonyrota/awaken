import * as path from 'path';
import { promisify } from 'util';
import * as glob from 'glob';
import { rootDir } from '../../rootDir';

const globP = promisify(glob);

export function globAbsolute(
    pattern: string,
    opt?: glob.IOptions,
): Promise<string[]> {
    return globP(path.join(rootDir, pattern), opt);
}

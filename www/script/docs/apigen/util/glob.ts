import * as path from 'path';
import * as glob from 'glob';
import { rootDir } from '../../../rootDir';

export function globAbsolute(pattern: string): string[] {
    return glob.sync(path.join(rootDir, pattern));
}

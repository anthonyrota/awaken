import { promises as fs } from 'fs';
import * as path from 'path';
import { globAbsolute } from '../docs/util/glob';
import { exit } from '../exit';
import { rootDir } from '../rootDir';

async function main(): Promise<unknown> {
    const hash = await fs.readFile(
        path.join(rootDir, 'www/temp/pagesHash'),
        'utf-8',
    );
    const pagesPath = `/pages.${hash}.json`;
    const publicHtmlPaths = await globAbsolute('www/_files/public/**/*.html');
    const promises = publicHtmlPaths.map(async (path) => {
        const text = await fs.readFile(path, 'utf-8');
        const replaced = text.replace('::pages.json::', pagesPath);
        return fs.writeFile(path, replaced, 'utf-8');
    });

    return Promise.all(promises);
}

main().catch((error) => {
    console.error('error running post-parcel script...');
    console.log(error);
    exit();
});

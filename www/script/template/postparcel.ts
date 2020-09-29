import { promises as fs } from 'fs';
import { pagesPath } from '../../src/docPages/dynamicData';
import { globAbsolute } from '../docs/util/glob';
import { exit } from '../exit';

async function main(): Promise<unknown> {
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

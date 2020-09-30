// eslint-disable-next-line import/order
import {
    globalOnResponseStateChangeKey,
    globalPagesStateKey,
    globalPageIdToWebsitePathKey,
} from '../../src/globalKeys';
// eslint-disable-next-line max-len
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires, import/order
const pagesWithMetadata: PagesWithMetadata = require('../../temp/pages.json');
global[globalPagesStateKey] = pagesWithMetadata;
global[globalOnResponseStateChangeKey] = () => {
    throw new Error('This should not be called.');
};
// eslint-disable-next-line max-len
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires, import/order
const pageIdToWebsitePath: PageIdToWebsitePath = require('../../temp/pageIdToWebsitePath.json');
global[globalPageIdToWebsitePathKey] = pageIdToWebsitePath;
import * as fs from 'fs';
import * as path from 'path';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { App } from '../../src/App';
import { PageIdToWebsitePath, PagesWithMetadata } from '../docs/types';
import {
    addFileToFolder,
    Folder,
    writeFolderToDirectoryPath,
} from '../docs/util/Folder';
import { exit } from '../exit';
import { rootDir } from '../rootDir';

const template = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');

const outFolder = Folder();

const stringifiedPageIdToWebsitePath = JSON.stringify(pageIdToWebsitePath);

function addRenderedHtmlToFolder(html: string, filePath: string): void {
    const contents = template
        .replace('::ssr::', html)
        .replace('__pageIdToWebsitePath__', stringifiedPageIdToWebsitePath);
    addFileToFolder(outFolder, filePath, contents);
}

addRenderedHtmlToFolder(render(<App path={{ pathname: '/' }} />), 'index.html');

addRenderedHtmlToFolder(
    render(<App path={{ pathname: '/_notfound' }} />),
    '404.html',
);

for (const { pageId } of pagesWithMetadata.pages) {
    const websitePath = pageIdToWebsitePath[pageId];
    addRenderedHtmlToFolder(
        render(<App path={{ pathname: `/${websitePath}` }} />),
        `${websitePath}.html`,
    );
}

export const templateDir = path.join(rootDir, 'www', 'template');

writeFolderToDirectoryPath(outFolder, templateDir).catch((error) => {
    console.error('error writing pages to out directory...');
    console.log(error);
    exit();
});

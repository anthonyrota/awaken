import * as fs from 'fs';
import * as path from 'path';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { IndexPage, NotFoundPage, DocPage } from '../../src/App';
import { DocPagesResponseContextProvider } from '../../src/DocPagesResponseContext';
import { convertDocPageUrlToUrlPathName } from '../../src/docPageUrls';
import { ResponseDoneType, ResponseState } from '../../src/loadDocPages';
import { PagesWithMetadata } from '../docs/apigen/types';
import {
    addFileToFolder,
    Folder,
    writeFolderToDirectoryPath,
} from '../docs/apigen/util/Folder';
import { getRelativePath } from '../docs/apigen/util/getRelativePath';
import { exit } from '../exit';

const template = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
// eslint-disable-next-line max-len
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
const pagesWithMetadata: PagesWithMetadata = require('../../temp/pages.json');

function shouldNotBeCalled(): never {
    throw new Error('This should not be called.');
}

const outFolder = Folder();

function ensureRelative(path: string): string {
    if (path[0] !== '.') {
        return `./${path}`;
    }
    return path;
}

function addRenderedHtmlToFolder(html: string, filePath: string): void {
    const contents = template
        .replace('::ssr::', html)
        .replace(
            /::script\.tsx::/g,
            ensureRelative(getRelativePath(filePath, 'script.tsx')),
        )
        .replace(
            /::index\.css::/g,
            ensureRelative(getRelativePath(filePath, 'index.css')),
        )
        .replace(
            /::loadDocPages\.ts::/g,
            ensureRelative(getRelativePath(filePath, 'loadDocPages.ts')),
        );
    addFileToFolder(outFolder, filePath, contents);
}

addRenderedHtmlToFolder(
    render(
        <DocPagesResponseContextProvider
            value={{
                getCurrentResponseState: shouldNotBeCalled,
                onResponseStateChange: shouldNotBeCalled,
            }}
        >
            <IndexPage />
        </DocPagesResponseContextProvider>,
    ),
    'index.html',
);

addRenderedHtmlToFolder(
    render(
        <DocPagesResponseContextProvider
            value={{
                getCurrentResponseState: shouldNotBeCalled,
                onResponseStateChange: shouldNotBeCalled,
            }}
        >
            <NotFoundPage />
        </DocPagesResponseContextProvider>,
    ),
    '404.html',
);

const responseState: ResponseState = {
    type: ResponseDoneType,
    data: pagesWithMetadata,
};

for (const { pageUrl } of pagesWithMetadata.pages) {
    addRenderedHtmlToFolder(
        render(
            <DocPagesResponseContextProvider
                value={{
                    getCurrentResponseState: () => responseState,
                    onResponseStateChange: shouldNotBeCalled,
                }}
            >
                <DocPage pageUrl={pageUrl}></DocPage>
            </DocPagesResponseContextProvider>,
        ),
        `${convertDocPageUrlToUrlPathName(pageUrl).replace(/^\//, '')}.html`,
    );
}

export const rootDir = path.join(__dirname, '..', '..', 'template');

writeFolderToDirectoryPath(outFolder, rootDir).catch((error) => {
    console.error('error writing pages to out directory...');
    console.log(error);
    exit();
});

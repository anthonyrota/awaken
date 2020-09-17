import * as fs from 'fs';
import * as path from 'path';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { convertApiDocMapPathToUrlPathName } from '../../src/apiDocMapPathList';
import { ApiDocMapResponseContextProvider } from '../../src/ApiDocMapResponseContext';
import { ApiDocPage, IndexPage, NotFoundPage } from '../../src/App';
import { ResponseDoneType, ResponseState } from '../../src/loadApiDocMap';
import { PageNodeMapWithMetadata } from '../docs/apigen/types';
import {
    addFileToFolder,
    Folder,
    writeFolderToDirectoryPath,
} from '../docs/apigen/util/Folder';
import { getRelativePath } from '../docs/apigen/util/getRelativePath';

const template = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
// eslint-disable-next-line max-len
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
const apiDocMap: PageNodeMapWithMetadata = require('../../temp/apiDocMap.json');

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
            /::index\.tsx::/g,
            ensureRelative(getRelativePath(filePath, 'index.tsx')),
        )
        .replace(
            /::index\.css::/g,
            ensureRelative(getRelativePath(filePath, 'index.css')),
        )
        .replace(
            /::loadApiDocMap\.ts::/g,
            ensureRelative(getRelativePath(filePath, 'loadApiDocMap.ts')),
        );
    addFileToFolder(outFolder, filePath, contents);
}

addRenderedHtmlToFolder(
    render(
        <ApiDocMapResponseContextProvider
            value={{
                getCurrentResponseState: shouldNotBeCalled,
                onResponseStateChange: shouldNotBeCalled,
            }}
        >
            <IndexPage />
        </ApiDocMapResponseContextProvider>,
    ),
    'index.html',
);

addRenderedHtmlToFolder(
    render(
        <ApiDocMapResponseContextProvider
            value={{
                getCurrentResponseState: shouldNotBeCalled,
                onResponseStateChange: shouldNotBeCalled,
            }}
        >
            <NotFoundPage />
        </ApiDocMapResponseContextProvider>,
    ),
    '404.html',
);

const responseState: ResponseState = {
    type: ResponseDoneType,
    data: apiDocMap,
};

for (const apiDocMapPath of Object.keys(apiDocMap.pageNodeMap)) {
    addRenderedHtmlToFolder(
        render(
            <ApiDocMapResponseContextProvider
                value={{
                    getCurrentResponseState: () => responseState,
                    onResponseStateChange: shouldNotBeCalled,
                }}
            >
                <ApiDocPage pagePath={apiDocMapPath}></ApiDocPage>
            </ApiDocMapResponseContextProvider>,
        ),
        `${convertApiDocMapPathToUrlPathName(apiDocMapPath).replace(
            /^\//,
            '',
        )}.html`,
    );
}

export const rootDir = path.join(__dirname, '..', '..', 'template');

writeFolderToDirectoryPath(outFolder, rootDir).catch((error) => {
    console.error('error writing pages to out directory...');
    throw error;
});

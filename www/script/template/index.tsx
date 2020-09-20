import * as fs from 'fs';
import * as path from 'path';
import { h, VNode } from 'preact';
import { render } from 'preact-render-to-string';
import { App } from '../../src/App';
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

interface SSRAppProps {
    url: string;
}

function SSRApp(props: SSRAppProps): VNode {
    return (
        <DocPagesResponseContextProvider
            value={{
                getCurrentResponseState(): ResponseState {
                    return {
                        type: ResponseDoneType,
                        data: pagesWithMetadata,
                    };
                },
                onResponseStateChange() {
                    throw new Error('This should not be called.');
                },
            }}
        >
            <App url={props.url} />
        </DocPagesResponseContextProvider>
    );
}

addRenderedHtmlToFolder(render(<SSRApp url="/" />), 'index.html');

addRenderedHtmlToFolder(render(<SSRApp url="/_notfound" />), '404.html');

for (const { pageUrl } of pagesWithMetadata.pages) {
    const pathname = convertDocPageUrlToUrlPathName(pageUrl);
    addRenderedHtmlToFolder(
        render(<SSRApp url={pathname} />),
        `${pathname.replace(/^\//, '')}.html`,
    );
}

export const rootDir = path.join(__dirname, '..', '..', 'template');

writeFolderToDirectoryPath(outFolder, rootDir).catch((error) => {
    console.error('error writing pages to out directory...');
    console.log(error);
    exit();
});

import * as fs from 'fs';
import * as path from 'path';
import { h, VNode } from 'preact';
import { render } from 'preact-render-to-string';
import { App, AppProps } from '../../src/App';
import { pageIdToWebsitePath } from '../../src/docPages/dynamicData';
import { ResponseDoneType, ResponseState } from '../../src/docPages/request';
import { DocPagesResponseContextProvider } from '../../src/docPages/responseContext';
import { PagesWithMetadata } from '../docs/types';
import {
    addFileToFolder,
    Folder,
    writeFolderToDirectoryPath,
} from '../docs/util/Folder';
import { exit } from '../exit';
import { rootDir } from '../rootDir';

const template = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
// eslint-disable-next-line max-len
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
const pagesWithMetadata: PagesWithMetadata = require('../../temp/pages.json');

const outFolder = Folder();

function addRenderedHtmlToFolder(html: string, filePath: string): void {
    const contents = template.replace(/::ssr::/g, html);
    addFileToFolder(outFolder, filePath, contents);
}

interface SSRAppProps extends AppProps {}

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
            <App {...props} />
        </DocPagesResponseContextProvider>
    );
}

addRenderedHtmlToFolder(
    render(<SSRApp path={{ pathname: '/' }} />),
    'index.html',
);

addRenderedHtmlToFolder(
    render(<SSRApp path={{ pathname: '/_notfound' }} />),
    '404.html',
);

for (const { pageId } of pagesWithMetadata.pages) {
    const websitePath = pageIdToWebsitePath[pageId];
    addRenderedHtmlToFolder(
        render(<SSRApp path={{ pathname: `/${websitePath}` }} />),
        `${websitePath}.html`,
    );
}

export const templateDir = path.join(rootDir, 'www', 'template');

writeFolderToDirectoryPath(outFolder, templateDir).catch((error) => {
    console.error('error writing pages to out directory...');
    console.log(error);
    exit();
});

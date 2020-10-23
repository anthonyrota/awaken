// eslint-disable-next-line import/order
import { pages, pagesMetadata } from './setGlobalAppVars';
import * as path from 'path';
import { promisify } from 'util';
import { createMemoryHistory } from 'history';
import * as ncp from 'ncp';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { App } from '../../src/App';
import { SSRHeadValues, getSSRHeadValues } from '../../src/Head';
import { setCustomHistory } from '../../src/hooks/useHistory';
import {
    addFileToFolder,
    Folder,
    writeFolderToDirectoryPath,
} from '../docs/util/Folder';
import { exit } from '../exit';
import { rootDir } from '../rootDir';
import { createBuildHtmlFileFunction } from './buildHtmlFile';
import { isDev } from './env';

async function main() {
    const buildHtmlFile = await createBuildHtmlFileFunction();
    const outFolder = Folder();

    function addRenderedHtmlToFolder(
        html: string,
        filePath: string,
        isSpa = false,
    ): void {
        let ssrHeadValues: SSRHeadValues | undefined;
        if (!isSpa) {
            ssrHeadValues = getSSRHeadValues();
        }
        addFileToFolder(
            outFolder,
            filePath,
            buildHtmlFile(html, ssrHeadValues),
        );
    }

    function renderAppAtPath(pathname: string): string {
        setCustomHistory(
            createMemoryHistory({
                initialEntries: [pathname],
            }),
        );
        return render(<App path={{ pathname }} />);
    }

    if (isDev) {
        addRenderedHtmlToFolder('', '__auto_generated__index.html', true);
        await writeFolderToDirectoryPath(
            outFolder,
            path.join(rootDir, 'www', 'src'),
        );
        return;
    }

    addRenderedHtmlToFolder(renderAppAtPath('/'), 'index.html');

    addRenderedHtmlToFolder(renderAppAtPath('/_notfound'), '404/index.html');

    for (const { pageId } of pages) {
        const websitePath = pagesMetadata.pageIdToWebsitePath[pageId];
        addRenderedHtmlToFolder(
            renderAppAtPath(`/${websitePath}`),
            `${websitePath}/index.html`,
        );
    }

    addRenderedHtmlToFolder('', '_spa.html', true);

    await Promise.all([
        promisify(ncp)('src', 'template', {
            stopOnErr: true,
        }),
        promisify(ncp)('src/static', 'template/static', {
            stopOnErr: true,
        }),
        writeFolderToDirectoryPath(
            outFolder,
            path.join(rootDir, 'www', 'template'),
        ),
    ]);
}

main().catch((error) => {
    console.error('error building template...');
    exit(error);
});

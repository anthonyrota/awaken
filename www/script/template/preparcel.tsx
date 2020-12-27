// eslint-disable-next-line import/order
import * as path from 'path';
import { promisify } from 'util';
import * as ncp from 'ncp';
import {
    addFileToFolder,
    Folder,
    writeFolderToDirectoryPath,
} from '../docs/util/Folder';
import { exit } from '../exit';
import { rootDir } from '../rootDir';
import { buildTemplate, insertSsr } from './buildTemplate';
import { isDev } from './env';

async function main() {
    const outFolder = Folder();

    if (isDev) {
        addFileToFolder(
            outFolder,
            '__auto_generated__index.html',
            insertSsr(buildTemplate(), ''),
        );
        await writeFolderToDirectoryPath(
            outFolder,
            path.join(rootDir, 'www', 'src'),
        );
        return;
    }

    addFileToFolder(outFolder, 'template.html', buildTemplate());

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

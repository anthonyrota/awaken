import { ApiModel } from '@microsoft/api-extractor-model';
import * as fs from 'fs-extra';
import { getAbsolutePath } from '../../util/fileUtil';
import { generateSourceMetadata } from './analyze/sourceMetadata';
import { ApiPageMap, renderPageNodeMapToFolder } from './apiUtil';
import { DeepCoreNode } from './nodes';
import { outDir, packageScope } from './paths';
import {
    addFileToFolder,
    Folder,
    getNestedFolderAtPath,
    writeFolderToDirectoryPath,
} from './util/Folder';
import { globAbsolute } from './util/glob';
import { format, Language } from './util/prettier';
import { createProgram } from './util/ts';

const sourceFilePaths = globAbsolute('packages/*/src/**');
const program = createProgram(sourceFilePaths);

const packages = fs.readdirSync(getAbsolutePath('packages'));
const packageNameToExportFilePath = new Map<string, string>(
    packages.map((packageName) => [
        `${packageScope}/${packageName}`,
        `packages/${packageName}/src/index.ts`,
    ]),
);
const sourceMetadata = generateSourceMetadata(
    program,
    packageNameToExportFilePath,
);

const apiModel = new ApiModel();
const apiModelFilePaths = globAbsolute('temp/*.api.json');

for (const apiModelFilePath of apiModelFilePaths) {
    apiModel.loadPackage(apiModelFilePath);
}

const pageMap = new ApiPageMap(apiModel, sourceMetadata);
const pageNodeMap = pageMap.build();
const outDirAbsolute = getAbsolutePath(...outDir.split('/'));

fs.removeSync(outDirAbsolute);

type PageNodeObject = Record<string, DeepCoreNode>;

const pageNodeObject: PageNodeObject = Object.fromEntries(
    pageNodeMap.entries(),
);

const renderedApiFolder = renderPageNodeMapToFolder(pageNodeMap);

const outFolder = Folder();
addFileToFolder(
    outFolder,
    'temp/apigen.json',
    format(JSON.stringify(pageNodeObject), Language.JSON),
);

const outApiFolder = getNestedFolderAtPath(outFolder, outDir);
for (const [path, fileOrFolder] of renderedApiFolder) {
    outApiFolder.set(path, fileOrFolder);
}

writeFolderToDirectoryPath(outFolder, getAbsolutePath()).catch((error) => {
    console.error('error writing pages to out directory...');
    throw error;
});

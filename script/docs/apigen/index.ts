import * as fs from 'fs-extra';
import { generateSourceMetadata } from './sourceMetadata';
import { ApiPageMap } from './apiUtil';
import { outDir } from './paths';
import { globAbsolute, loadApiModel, createProgram } from './util';
import { getAbsolutePath } from '../../util/fileUtil';

const sourceFilePaths = globAbsolute('packages/*/src/**');
const program = createProgram(sourceFilePaths);

const sourceExportFiles = globAbsolute('packages/*/src/index.ts');
const sourceMetadata = generateSourceMetadata(program, sourceExportFiles);

const apiModelFiles = globAbsolute('apiExtractor/temp/*.api.json');
const apiModel = loadApiModel(apiModelFiles);

const pageMap = new ApiPageMap(apiModel, sourceMetadata);
const outDirAbsolute = getAbsolutePath(...outDir.split('/'));

fs.removeSync(outDirAbsolute);
pageMap
    .renderAsMarkdownToDirectoryMap()
    .writeToDirectory(outDirAbsolute)
    .catch((error) => {
        console.error('error writing pages to out directory...');
        throw error;
    });

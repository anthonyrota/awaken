import * as fs from 'fs-extra';
import { generateSourceMetadata } from './sourceMetadata';
import { ApiPageMap } from './apiUtil';
import { globAbsolute, loadApiModel, createProgram } from './util';
import { getAbsolutePath } from '../../util/fileUtil';

const sourceFilePaths = globAbsolute('packages/*/src/**');
const program = createProgram(sourceFilePaths);

const sourceExportFiles = globAbsolute('packages/*/src/index.ts');
const sourceMetadata = generateSourceMetadata(program, sourceExportFiles);

const apiModelFiles = globAbsolute('apiExtractor/temp/*.api.json');
const apiModel = loadApiModel(apiModelFiles);

const pageMap = new ApiPageMap(apiModel, sourceMetadata);
const outDir = getAbsolutePath('docs', 'api');

fs.removeSync(outDir);
pageMap
    .renderAsMarkdownToDirectoryMap()
    .writeToDirectory(outDir)
    .catch((error) => {
        console.error('error writing pages to out directory...');
        throw error;
    });

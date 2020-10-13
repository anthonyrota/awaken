import * as fs from 'fs';
import * as path from 'path';
import { Transform } from 'stream';
import * as zlib from 'zlib';
import { rootDir } from '../rootDir';

function getCompressedSizeKb(
    rootPath: string,
    createCompress: () => Transform,
): Promise<number> {
    return new Promise((resolve, reject) => {
        const absolutePath = path.join(rootDir, rootPath);
        const source = fs.createReadStream(absolutePath);
        let length = 0;

        source
            .pipe(createCompress())
            .on('data', (data) => {
                // eslint-disable-next-line max-len
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                length += data.length;
            })
            .on('error', reject)
            .on('end', () => {
                resolve(length / 1000);
            });
    });
}

function getBrotliCompressedSizeKb(rootPath: string): Promise<number> {
    return getCompressedSizeKb(rootPath, zlib.createBrotliCompress);
}

function getGzipCompressedSizeKb(rootPath: string): Promise<number> {
    return getCompressedSizeKb(rootPath, zlib.createGzip);
}

const coreModulePath = 'packages/core/dist/microstream.mjs';
const testingModulePath = 'packages/testing/dist/microstreamTesting.mjs';

const coreBrSizeP = getBrotliCompressedSizeKb(coreModulePath);
const coreGzSizeP = getGzipCompressedSizeKb(coreModulePath);
const testingBrSizeP = getBrotliCompressedSizeKb(testingModulePath);
const testingGzSizeP = getGzipCompressedSizeKb(testingModulePath);

async function createGetDynamicTextVariableReplacementFunction(): Promise<
    (variableName: string) => string
> {
    const [
        coreBrSize,
        coreGzSize,
        testingBrSize,
        testingGzSize,
    ] = await Promise.all([
        coreBrSizeP,
        coreGzSizeP,
        testingBrSizeP,
        testingGzSizeP,
    ]);

    const replacements: Record<string, string> = {
        LibName: 'MicroStream',
        LibCoreImportPath: '@microstream/core',
        LibCoreBrotliCompressedSizeKb: `${coreBrSize}`,
        LibCoreGzipCompressedSizeKb: `${coreGzSize}`,
        LibTestingImportPath: '@microstream/testing',
        LibTestingBrotliCompressedSizeKb: `${testingBrSize}`,
        LibTestingGzipCompressedSizeKb: `${testingGzSize}`,
    };

    function getDynamicTextVariableReplacement(variableName: string): string {
        if (!Object.keys(replacements).includes(variableName)) {
            throw new Error(
                `Unknown dynamic markdown value {{${variableName}}}`,
            );
        }
        return replacements[variableName];
    }

    return getDynamicTextVariableReplacement;
}

// eslint-disable-next-line max-len
export const getDynamicTextVariableReplacementP = createGetDynamicTextVariableReplacementFunction();

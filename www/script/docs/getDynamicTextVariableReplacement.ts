import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { rootDir } from '../rootDir';

function getBrotliCompressedSizeKb(rootPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
        const absolutePath = path.join(rootDir, rootPath);
        const source = fs.createReadStream(absolutePath);
        let length = 0;

        source
            .pipe(zlib.createBrotliCompress())
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

const coreBrSizeP = getBrotliCompressedSizeKb(
    'packages/core/dist/awakenCore.mjs',
);
const testingBrSizeP = getBrotliCompressedSizeKb(
    'packages/testing/dist/awakenTesting.mjs',
);

async function createGetDynamicTextVariableReplacementFunction(): Promise<
    (variableName: string) => string
> {
    const [coreBrSize, testingBrSize] = await Promise.all([
        coreBrSizeP,
        testingBrSizeP,
    ]);

    const replacements: Record<string, string> = {
        LibName: 'AwakenJS',
        LibCoreImportPath: '@awaken/core',
        LibCoreBrotliCompressedSizeKb: `${coreBrSize}`,
        LibTestingImportPath: '@awaken/testing',
        LibTestingBrotliCompressedSizeKb: `${testingBrSize}`,
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

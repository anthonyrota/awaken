import * as path from 'path';
import { promisify } from 'util';
import * as zlib from 'zlib';
import * as colors from 'colors';
import * as fs from 'fs-extra';
import { exit } from '../exit';
import { rootDir } from '../rootDir';
import { CompressedFileMetadata } from './types';

const filesDir = path.join(rootDir, 'www', '_files');
const publicPath = path.join(filesDir, 'public');
const publicBrPath = path.join(filesDir, 'public-br');
const publicBrBinaryPath = path.join(publicBrPath, 'binary');
const publicBrMetadataPath = path.join(publicBrPath, 'metadata');

const brotliCompress = promisify(zlib.brotliCompress);
const compressedFiles: string[] = [];

async function brotliCompressDirectory(subPath: string): Promise<unknown> {
    const dirPublicPath = path.join(publicPath, subPath);
    const dirPublicBrBinaryPath = path.join(publicBrBinaryPath, subPath);
    const dirPublicBrMetadataPath = path.join(publicBrMetadataPath, subPath);

    console.log(`reading dir ${colors.cyan(path.join('public', subPath))}`);

    if (subPath === '') {
        await fs.ensureDir(publicBrPath);
        await Promise.all([
            fs.mkdir(publicBrBinaryPath),
            fs.mkdir(publicBrMetadataPath),
        ]);
    } else {
        await fs.mkdir(dirPublicBrBinaryPath);
        await fs.mkdir(dirPublicBrMetadataPath);
    }

    const promises: Promise<unknown>[] = [];

    for await (const thing of await fs.opendir(dirPublicPath)) {
        if (thing.isDirectory()) {
            promises.push(
                brotliCompressDirectory(path.join(subPath, thing.name)),
            );
            continue;
        }

        if (!thing.isFile()) {
            throw new Error(`${thing.name}: Not a file or directory.`);
        }

        const filePublicPath = path.join(dirPublicPath, thing.name);
        const filePublicBrBinaryPath = path.join(
            dirPublicBrBinaryPath,
            `${thing.name}.br`,
        );
        const filePublicBrMetadataPath = path.join(
            dirPublicBrMetadataPath,
            `${thing.name}.json`,
        );

        const fileSubPath = path.join(subPath, thing.name);
        const fileHumanPath = path.join('public', subPath, thing.name);

        if (fileSubPath === '404.html') {
            console.log(
                `not adding ${colors.red(fileSubPath)} to public files list`,
            );
        } else {
            compressedFiles.push(fileSubPath);
        }

        console.log(`compressing file ${colors.red(fileHumanPath)}`);

        promises.push(
            fs
                .readFile(filePublicPath)
                .then(brotliCompress)
                .then((compressed) => {
                    console.log(
                        `writing compressed file ${colors.cyan(fileHumanPath)}`,
                    );
                    const metadata: CompressedFileMetadata = {
                        contentLength: compressed.length,
                    };
                    return Promise.all([
                        fs.writeFile(filePublicBrBinaryPath, compressed),
                        fs.writeFile(
                            filePublicBrMetadataPath,
                            JSON.stringify(metadata),
                        ),
                    ]);
                }),
        );
    }

    return Promise.all(promises);
}

const publicFilesListFileName = 'publicFilesList.json';

brotliCompressDirectory('')
    .then(() => {
        console.log(
            `writing public file list ${colors.green(
                path.join('temp', publicFilesListFileName),
            )}`,
        );
        const tempDir = path.join(filesDir, 'temp');
        return fs.ensureDir(tempDir).then(() => {
            return fs.writeFile(
                path.join(filesDir, 'temp', publicFilesListFileName),
                JSON.stringify(compressedFiles),
                'utf-8',
            );
        });
    })
    .catch((error) => {
        console.error('error compressing public directory...');
        console.log(error);
        exit();
    });

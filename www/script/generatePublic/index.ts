import * as path from 'path';
import { promisify } from 'util';
import * as zlib from 'zlib';
import * as colors from 'colors';
import * as etag from 'etag';
import * as fs from 'fs-extra';
import { exit } from '../exit';
import { rootDir } from '../rootDir';
import { PublicFileMetadata } from './types';

const filesDir = path.join(rootDir, 'www', '_files');
const publicPath = path.join(filesDir, 'public');
const publicBrPath = path.join(filesDir, 'public-br');
const publicGzipPath = path.join(filesDir, 'public-gzip');
const publicMetaPath = path.join(filesDir, 'public-meta');

const brotliCompress = promisify(
    (
        buf: zlib.InputType,
        options: zlib.BrotliOptions,
        callback: zlib.CompressCallback,
    ) => zlib.brotliCompress(buf, options, callback),
);
const gzipCompress = promisify(
    (
        buf: zlib.InputType,
        options: zlib.ZlibOptions,
        callback: zlib.CompressCallback,
    ) => zlib.gzip(buf, options, callback),
);
const compressedFiles: string[] = [];

async function brotliCompressDirectory(subPath: string): Promise<unknown> {
    const dirPublicPath = path.join(publicPath, subPath);
    const dirPublicBrPath = path.join(publicBrPath, subPath);
    const dirPublicGzipPath = path.join(publicGzipPath, subPath);
    const dirPublicMetaPath = path.join(publicMetaPath, subPath);

    console.log(`reading dir ${colors.cyan(path.join('public', subPath))}`);

    await Promise.all([
        await fs.mkdir(dirPublicBrPath),
        await fs.mkdir(dirPublicGzipPath),
        await fs.mkdir(dirPublicMetaPath),
    ]);

    const promises: Promise<unknown>[] = [];

    for await (const thing of await fs.opendir(dirPublicPath)) {
        const { name } = thing;

        if (thing.isDirectory()) {
            promises.push(brotliCompressDirectory(path.join(subPath, name)));
            continue;
        }

        if (!thing.isFile()) {
            throw new Error(`${name}: Not a file or directory.`);
        }

        const filePublicPath = path.join(dirPublicPath, name);
        const filePublicBrPath = path.join(dirPublicBrPath, `${name}.br`);
        const filePublicGzipPath = path.join(dirPublicGzipPath, `${name}.gz`);
        const filePublicMetaPath = path.join(dirPublicMetaPath, `${name}.json`);

        const fileSubPath = path.join(subPath, name);

        if (fileSubPath === '404.html') {
            console.log(
                `not adding ${colors.red(fileSubPath)} to public files list`,
            );
        } else {
            compressedFiles.push(fileSubPath);
        }

        console.log(`compressing file ${colors.red(fileSubPath)}`);

        promises.push(
            fs.readFile(filePublicPath).then(async (buffer) => {
                const [brotliCompressed, gzipCompressed] = await Promise.all([
                    brotliCompress(buffer, {
                        params: {
                            [zlib.constants.BROTLI_PARAM_QUALITY]:
                                zlib.constants.BROTLI_MAX_QUALITY,
                        },
                    }),
                    gzipCompress(buffer, {
                        level: zlib.constants.Z_BEST_COMPRESSION,
                    }),
                ]);
                const metadata: PublicFileMetadata = {
                    brotliEncodingMeta: {
                        contentLength: brotliCompressed.length,
                        etag: etag(brotliCompressed),
                    },
                    gzipEncodingMeta: {
                        contentLength: gzipCompressed.length,
                        etag: etag(gzipCompressed),
                    },
                    identityEncodingMeta: {
                        contentLength: buffer.length,
                        etag: etag(buffer),
                    },
                };
                return Promise.all([
                    fs.writeFile(filePublicBrPath, brotliCompressed),
                    fs.writeFile(filePublicGzipPath, gzipCompressed),
                    fs.writeFile(filePublicMetaPath, JSON.stringify(metadata)),
                ]);
            }),
        );
    }

    return Promise.all(promises);
}

const publicFilesListFileName = 'publicFilesList.json';

brotliCompressDirectory('')
    .then(async () => {
        console.log(
            `writing public file list ${colors.green(
                path.join('temp', publicFilesListFileName),
            )}`,
        );
        const tempDir = path.join(filesDir, 'temp');
        await fs.ensureDir(tempDir);
        return fs.writeFile(
            path.join(filesDir, 'temp', publicFilesListFileName),
            JSON.stringify(compressedFiles),
            'utf-8',
        );
    })
    .catch((error) => {
        console.error('error compressing public directory...');
        console.log(error);
        exit();
    });

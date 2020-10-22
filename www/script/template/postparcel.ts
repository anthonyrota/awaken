import * as path from 'path';
import { promisify } from 'util';
import * as babel from '@babel/core';
import * as fs from 'fs-extra';
import * as glob from 'glob';
import * as terser from 'terser';
import { computeFileHash } from '../computeFileHash';
import { globAbsolute } from '../docs/util/glob';
import { exit } from '../exit';
import { rootDir } from '../rootDir';

const globP = promisify(glob);

async function fixParcelBuild(): Promise<void> {
    const manifestPathP = (async () => {
        const webmanifestPaths = await globAbsolute(
            'www/vercel-public/manifest.*.webmanifest',
            {
                nodir: true,
            },
        );
        if (webmanifestPaths.length !== 1) {
            throw new Error(
                `No or too many webmanifest paths found (n=${webmanifestPaths.length})`,
            );
        }
        return webmanifestPaths[0];
    })();

    const newManifestName = 'manifest.webmanifest';
    const fixManifestP = (async () => {
        const manifestPath = await manifestPathP;
        const manifestText = await fs.readFile(manifestPath, 'utf-8');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const manifestValue = JSON.parse(manifestText);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const { icons } = manifestValue;
        if (!Array.isArray(icons)) {
            throw new Error('Manifest icons field is not an array.');
        }
        const manifestIconChangeSrcPromises: Promise<unknown>[] = [];
        const manifestIconCopyPromises: Promise<unknown>[] = [];
        for (const icon of icons) {
            let { src } = icon as { src: string };
            if (typeof src !== 'string') {
                throw new Error('Manifest icon src field is not a string.');
            }
            if (!src.startsWith('/')) {
                throw new Error(
                    'Manifest src field does not start with a slash.',
                );
            }
            src = src.slice(1);
            if (src.startsWith('/') || src.startsWith('.')) {
                throw new Error('Bad manifest icon src.');
            }
            if (!src.startsWith('static/')) {
                throw new Error('Manifest icon not in static directory.');
            }
            const ext = path.extname(src);
            const fileName = path.basename(src, ext);
            const getBufferP = fs.readFile(path.join(rootDir, 'www/src', src));
            const getNewSrcP = getBufferP.then((buffer) => {
                const hash = computeFileHash(buffer);
                return `${fileName}.${hash}${ext}`;
            });
            manifestIconChangeSrcPromises.push(
                getNewSrcP.then((newSrc) => {
                    (icon as { src: string }).src = newSrc;
                }),
            );
            manifestIconCopyPromises.push(
                Promise.all([getBufferP, getNewSrcP]).then(([buffer, newSrc]) =>
                    fs.writeFile(
                        path.join(rootDir, 'www/vercel-public', newSrc),
                        buffer,
                    ),
                ),
            );
        }
        const newManifestPath = path.join(
            manifestPath,
            `../${newManifestName}`,
        );
        return Promise.all([
            manifestIconCopyPromises,
            fs.unlink(manifestPath),
            Promise.all(manifestIconChangeSrcPromises).then(() =>
                fs.writeFile(newManifestPath, JSON.stringify(manifestValue)),
            ),
        ]);
    })();

    const relativeManifestPathP = manifestPathP.then((p) => path.basename(p));
    const pagesPathP = fs
        .readFile(path.join(rootDir, 'www/temp/pagesHash'), 'utf-8')
        .then((pagesHash) => `/pages.${pagesHash}.json`);

    const retrieveHtmlAtPath = (path: string) =>
        Promise.all([
            fs.readFile(path, 'utf-8'),
            relativeManifestPathP,
            pagesPathP,
        ]).then(([html, relativeManifestPath, pagesPath]) =>
            html
                .replace('::pages.json::', pagesPath)
                .replace(relativeManifestPath, newManifestName),
        );

    const publicHtmlP = (async () => {
        const publicHtmlPaths = await globAbsolute(
            'www/vercel-public/**/*.html',
            {
                nodir: true,
            },
        );

        await Promise.all(
            publicHtmlPaths.map((path) =>
                retrieveHtmlAtPath(path).then((newHtml) =>
                    fs.writeFile(path, newHtml, 'utf-8'),
                ),
            ),
        );
    })();

    const swP = (async () => {
        // Secondary static paths are the paths which are not necessary for the
        // offline experience, and which shouldn't cancel the installation of
        // the service worker in the event that they can't be retrieved.
        function isSecondaryStaticPath(
            filePath: string,
        ): boolean | Promise<boolean> {
            // Parcel bundles all hashed files to the root directory regardless
            // of which subdirectory it originated in.
            const dirName = path.dirname(filePath);
            if (dirName !== '.') {
                // Not in root directory, meaning it is not hashed.
                return false;
            }
            const ext = path.extname(filePath);
            const parts = path.basename(filePath, ext).split('.');
            if (parts.length === 1) {
                // Not hashed.
                return false;
            }
            parts.pop();
            // Check if matches path of any icon.
            return fs
                .stat(
                    path.join(
                        rootDir,
                        'www/src/static/icons',
                        dirName,
                        parts.join('.') + ext,
                    ),
                )
                .then((stats) => stats.isFile())
                .catch(() => false);
        }

        const swFilesP = (async () => {
            await fixManifestP;
            const staticFiles = await globP('**/*', {
                cwd: path.join(rootDir, 'www/vercel-public'),
                nodir: true,
                ignore: ['sw.js', newManifestName, '**/*.html'],
            });
            staticFiles.sort();
            const isSecondaryStaticFilesFilterList = await Promise.all(
                staticFiles.map(isSecondaryStaticPath),
            );
            const primaryStaticFiles = staticFiles.filter(
                (_, i) => !isSecondaryStaticFilesFilterList[i],
            );
            const secondaryStaticFiles = staticFiles.filter(
                (_, i) => isSecondaryStaticFilesFilterList[i],
            );
            return {
                primaryStaticFiles,
                secondaryStaticFiles,
                dynamicFiles: [newManifestName],
            };
        })();

        const swCacheNameP = (async () => {
            const { primaryStaticFiles, secondaryStaticFiles } = await swFilesP;

            const makeFileNameAndContentList = (fileList: string[]) =>
                Promise.all([
                    fileList.map(async (filePath) => [
                        filePath,
                        await fs.readFile(
                            path.join(rootDir, 'www/vercel-public', filePath),
                            'utf-8',
                        ),
                    ]),
                ]);

            return computeFileHash(
                JSON.stringify({
                    primaryStaticFiles: await makeFileNameAndContentList(
                        primaryStaticFiles,
                    ),
                    secondaryStaticFiles: await makeFileNameAndContentList(
                        secondaryStaticFiles,
                    ),
                    // No need to include the dynamic files in the hash because
                    // they are network first and so are re-cached on the fly.
                }),
            );
        })();

        const spaHtmlPath = path.join(rootDir, 'www/vercel-public/_spa.html');
        const spaHtmlP = retrieveHtmlAtPath(spaHtmlPath);
        const unlinkSpaHtmlPathP = Promise.all([
            spaHtmlP,
            // Ensure the files glob is finished and not accessing the file.
            swFilesP,
        ]).then(() => fs.unlink(spaHtmlPath));

        const writeSwJsTextP = (async () => {
            const swTsPath = path.join(__dirname, 'sw.ts');

            const [
                swTsRawText,
                swCacheName,
                swFiles,
                spaHtmlQuoted,
            ] = await Promise.all([
                fs.readFile(swTsPath, 'utf-8'),
                swCacheNameP,
                swFilesP,
                spaHtmlP.then(JSON.stringify),
            ]);

            function toInsertablePathListString(paths: string[]): string {
                return paths.map((path) => `/${path}`).join("','");
            }

            const swTsText = swTsRawText
                .replace(/::cacheName::/g, swCacheName)
                .replace(
                    /::primaryStaticPaths::/g,
                    toInsertablePathListString(swFiles.primaryStaticFiles),
                )
                .replace(
                    /::secondaryStaticPaths::/g,
                    toInsertablePathListString(swFiles.secondaryStaticFiles),
                )
                .replace(
                    /::dynamicPaths::/g,
                    toInsertablePathListString(swFiles.dynamicFiles),
                )
                .replace(/'::spaHtml::'/g, spaHtmlQuoted);

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const swJsTranspiledText = (await babel.transformAsync(swTsText, {
                filename: swTsPath,
            }))!.code!.replace(/export *{};?/, '');

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const swJsMinifiedText = (
                await terser.minify(swJsTranspiledText, {
                    toplevel: true,
                })
            ).code!;

            await fs.writeFile(
                path.join(rootDir, 'www/vercel-public/sw.js'),
                swJsMinifiedText,
                'utf-8',
            );
        })();

        await Promise.all([unlinkSpaHtmlPathP, writeSwJsTextP]);
    })();

    await Promise.all([fixManifestP, publicHtmlP, swP]);
}

async function main(): Promise<void> {
    await fixParcelBuild();
}

main().catch((error) => {
    console.error('error running post-parcel script...');
    exit(error);
});

import { promises as fs } from 'fs';
import * as path from 'path';
import { isDev } from './env';
import { pagesMetadata } from './setGlobalAppVars';

export async function createBuildHtmlFileFunction(): Promise<
    (contentHtml: string) => string
> {
    const template = await fs.readFile(
        path.join(__dirname, 'template.html'),
        'utf-8',
    );
    const stringifiedPagesMetadata = JSON.stringify(pagesMetadata);

    return (contentHtml) => {
        return template
            .replace(
                '::manifestLink::',
                isDev
                    ? ''
                    : '<link rel="manifest" href="/manifest.webmanifest" />',
            )
            .replace(
                '::preloadPagesLink::',
                isDev
                    ? ''
                    : '<link rel="preload" href="::pages.json::" as="fetch" crossorigin="anonymous" />',
            )
            .replace(
                '::css::',
                isDev
                    ? '<link rel="stylesheet" href="/index.scss">' // HMR.
                    : `<style>@import '/index.scss';</style>`,
            )
            .replace('::ssr::', contentHtml)
            .replace('__pagesMetadata__', stringifiedPagesMetadata);
    };
}

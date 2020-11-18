import { promises as fs } from 'fs';
import * as path from 'path';
import { SSRHeadValues } from '../../src/Head';
import { isDev } from './env';
import { pagesMetadata } from './setGlobalAppVars';

export async function createBuildHtmlFileFunction(): Promise<
    (contentHtml: string, ssrHeadValues?: SSRHeadValues) => string
> {
    const template = await fs.readFile(
        path.join(__dirname, 'template.html'),
        'utf-8',
    );
    const stringifiedPagesMetadata = JSON.stringify(pagesMetadata);

    return (contentHtml, ssrHeadValues) => {
        return template
            .replace(
                '::ssrHead::',
                ssrHeadValues
                    ? [`<title>${ssrHeadValues.title}</title>`].join(
                          '\n' + ' '.repeat(8),
                      )
                    : '',
            )
            .replace(
                '::preloadPagesLink::',
                isDev
                    ? ''
                    : [
                          '<link rel="preload" href="/static/fonts/open-sans-v18-latin-regular.woff2" as="font" type="font/woff2" crossorigin>',
                          '<link rel="preload" href="/static/fonts/open-sans-v18-latin-600.woff2" as="font" type="font/woff2" crossorigin>',
                          '<link rel="preload" href="::pages.json::" as="fetch" crossorigin="anonymous" />',
                      ].join('\n'),
            )
            .replace(
                '::manifestLink::',
                isDev
                    ? ''
                    : '<link rel="manifest" href="/manifest.webmanifest" />',
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

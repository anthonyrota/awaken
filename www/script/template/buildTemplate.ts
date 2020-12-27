import * as fs from 'fs';
import * as path from 'path';
import { SSRHeadValues } from '../../src/Head';
import { isDev } from './env';
import { pagesMetadata } from './setGlobalAppVars';

const template = fs.readFileSync(
    path.join(__dirname, 'template.html'),
    'utf-8',
);

const stringifiedPagesMetadata = JSON.stringify(pagesMetadata);

export function buildTemplate(): string {
    return template
        .replace(
            '::preloadPagesLink::',
            isDev
                ? ''
                : [
                      '<link rel="preload" href="::pages.json::" as="fetch" crossorigin="anonymous" />',
                  ].join('\n'),
        )
        .replace(
            '::manifestLink::',
            isDev ? '' : '<link rel="manifest" href="/manifest.webmanifest" />',
        )
        .replace(
            '::css::',
            isDev
                ? '<link rel="stylesheet" href="/index.scss">' // HMR.
                : `<style>@import '/index.scss';</style>`,
        )
        .replace('__pagesMetadata__', stringifiedPagesMetadata);
}

export function insertSsr(
    template: string,
    ssrContent: string,
    ssrHeadValues?: SSRHeadValues,
): string {
    return template
        .replace(
            '::ssrHead::',
            ssrHeadValues
                ? [`<title>${ssrHeadValues.title}</title>`].join(
                      '\n' + ' '.repeat(8),
                  )
                : '',
        )
        .replace('::ssr::', ssrContent);
}

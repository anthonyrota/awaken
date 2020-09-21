import * as fs from 'fs';
import * as path from 'path';
import { encodings as parseEncodingsHeader } from '@hapi/accept';
import { NowRequest, NowResponse } from '@vercel/node';
import * as fresh_ from 'fresh';
import { CompressedFileMetadata } from '../script/generatePublic/types';

let fresh = fresh_;
if ('default' in fresh) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    fresh = fresh_.default; // I don't know why.
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const publicFilesList: string[] = (require(path.join(
    __dirname,
    '..',
    '_files/temp/publicFilesList.json',
)) as string[]).map((path) => `/${path}`);
const publicUrlToPublicFilePath = new Map(
    publicFilesList.map((filePath) => [
        transformFilePathToUrl(filePath) || '/',
        filePath,
    ]),
);

function transformFilePathToUrl(filePath: string): string {
    const slashIndexDotHtml = '/index.html';
    if (filePath.endsWith(slashIndexDotHtml)) {
        return filePath.slice(0, -slashIndexDotHtml.length);
    }

    const dotHtml = '.html';
    if (filePath.endsWith(dotHtml)) {
        return filePath.slice(0, -dotHtml.length);
    }

    return filePath;
}

const hashedCacheControl = 'public, max-age=31536000, immutable';
const defaultCacheControl = 'public, max-age=0, must-revalidate';

function setFileSpecificHeaders(response: NowResponse, filePath: string): void {
    const extension = path.extname(filePath);
    switch (extension) {
        case '.js': {
            response.setHeader('Content-Type', 'text/javascript');
            response.setHeader('Cache-Control', hashedCacheControl);
            break;
        }
        case '.json': {
            response.setHeader('Content-Type', 'application/json');
            response.setHeader('Cache-Control', hashedCacheControl);
            break;
        }
        case '.html': {
            response.setHeader('Content-Type', 'text/html');
            response.setHeader('Cache-Control', defaultCacheControl);
            break;
        }
        default: {
            throw new Error(`Unexpected extension ${extension}.`);
        }
    }
}

function isAcceptingBrotli(request: NowRequest): boolean {
    const acceptEncodingHeader = request.headers['accept-encoding'];
    if (typeof acceptEncodingHeader === 'string') {
        const encodings = parseEncodingsHeader(acceptEncodingHeader);
        if (encodings.includes('br')) {
            return true;
        }
    }
    return false;
}

function sendPublicFileBrotli(
    response: NowResponse,
    publicFilePath: string,
): void {
    response.setHeader('Content-Encoding', 'br');

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { contentLength } = require(path.join(
        __dirname,
        '..',
        '_files',
        'public-br',
        'metadata',
        `${publicFilePath}.json`,
    )) as CompressedFileMetadata;
    response.setHeader('Content-Length', contentLength);

    fs.createReadStream(
        path.join(
            __dirname,
            '..',
            '_files',
            'public-br',
            'binary',
            `${publicFilePath}.br`,
        ),
    ).pipe(response);
}

function sendPublicFile(
    request: NowRequest,
    response: NowResponse,
    publicFilePath: string,
): void {
    setFileSpecificHeaders(response, publicFilePath);

    if (isAcceptingBrotli(request)) {
        sendPublicFileBrotli(response, publicFilePath);
        return;
    }

    fs.createReadStream(
        path.join(__dirname, '..', '_files', 'public', publicFilePath),
    ).pipe(response);
}

const notFoundPublicFilePath = '404.html';

export default (request: NowRequest, response: NowResponse) => {
    const { url } = request;

    if (!url) {
        throw new Error('Unexpected: no url.');
    }

    if (url.endsWith('/') && url !== '/') {
        response.redirect(308, url.slice(0, -1));
        return;
    }

    const publicFilePath = publicUrlToPublicFilePath.get(url);

    if (publicFilePath) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { etag } = require(path.join(
            __dirname,
            '..',
            '_files',
            'public-br',
            'metadata',
            `${publicFilePath}.json`,
        )) as CompressedFileMetadata;

        if (fresh(request.headers, { etag })) {
            response.status(304).end();
            return;
        }

        response.setHeader('ETag', etag);
        response.status(200);
        sendPublicFile(request, response, publicFilePath);
    } else {
        response.status(400);
        sendPublicFile(request, response, notFoundPublicFilePath);
    }
};

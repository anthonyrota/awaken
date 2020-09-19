import * as fs from 'fs';
import * as path from 'path';
import { encodings as parseEncodingsHeader } from '@hapi/accept';
import { NowRequest, NowResponse } from '@vercel/node';
import { CompressedFileMetadata } from 'script/compressPublic/types';

console.log(fs.readdirSync(path.join(__dirname, '..')));

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

const hashedCacheControl = 'public, max-age=31536000';
const defaultCacheControl = 'public, max-age=2678400';

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

    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
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
        response.status(200);
        sendPublicFile(request, response, publicFilePath);
    } else {
        response.status(400);
        sendPublicFile(request, response, '404.html');
    }
};

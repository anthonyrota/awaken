import * as fs from 'fs';
import * as path from 'path';
import { encodings as parseEncodingsHeader } from '@hapi/accept';
import { NowRequest, NowResponse } from '@vercel/node';
import * as fresh_ from 'fresh';
import { PublicFileMetadata } from '../script/generatePublic/types';

let fresh = fresh_;
if ('default' in fresh) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    fresh = fresh_.default; // I don't know why.
}

const filesPath = path.join(__dirname, '..', '_files');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const publicFilesList: string[] = (require(path.join(
    filesPath,
    'temp/publicFilesList.json',
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

function getPublicFileMetadata(publicFilePath: string): PublicFileMetadata {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return require(path.join(
        filesPath,
        'public-meta',
        `${publicFilePath}.json`,
    ));
}

type SupportedContentEncoding = 'br' | 'gzip' | 'identity';

interface SendPublicFileInEncoding {
    publicFilePath: string;
    contentEncoding: SupportedContentEncoding;
    useETag: boolean;
    status: number;
}

function sendPublicFileInEncoding(
    request: NowRequest,
    response: NowResponse,
    params: SendPublicFileInEncoding,
): void {
    const { publicFilePath, contentEncoding, useETag, status } = params;
    const meta = getPublicFileMetadata(publicFilePath);
    const encodingMeta =
        contentEncoding === 'br'
            ? meta.brotliEncodingMeta
            : contentEncoding === 'gzip'
            ? meta.gzipEncodingMeta
            : meta.identityEncodingMeta;

    if (useETag) {
        if (fresh(request.headers, { etag: encodingMeta.etag })) {
            response.status(304).end();
            return;
        }

        response.setHeader('ETag', encodingMeta.etag);
    }

    response.status(status);
    response.setHeader('Content-Encoding', contentEncoding);
    response.setHeader('Content-Length', encodingMeta.contentLength);

    fs.createReadStream(
        contentEncoding === 'identity'
            ? path.join(filesPath, 'public', publicFilePath)
            : path.join(
                  filesPath,
                  `public-${contentEncoding}`,
                  `${publicFilePath}.${
                      contentEncoding === 'gzip' ? 'gz' : contentEncoding
                  }`,
              ),
    ).pipe(response);
}

interface SendPublicFileParams {
    publicFilePath: string;
    useETag: boolean;
    status: number;
}

function sendPublicFile(
    request: NowRequest,
    response: NowResponse,
    params: SendPublicFileParams,
): void {
    const { publicFilePath, useETag, status } = params;

    let contentEncoding: SupportedContentEncoding = 'identity';
    const acceptEncodingHeader = request.headers['accept-encoding'];
    if (typeof acceptEncodingHeader === 'string') {
        const encodings = parseEncodingsHeader(acceptEncodingHeader);
        if (encodings.includes('br')) {
            contentEncoding = 'br';
        } else if (encodings.includes('gzip')) {
            contentEncoding = 'gzip';
        }
    }

    sendPublicFileInEncoding(request, response, {
        publicFilePath,
        contentEncoding,
        useETag,
        status,
    });
}

const immutableCacheControl = 'public, max-age=31536000, immutable';
const mustRevalidateCacheControl = 'public, max-age=0, must-revalidate';
const noCacheCacheControl = 'no-store, must-revalidate';

const htmlContentType = 'text/html; charset=utf-8';
const htmlCacheControl = mustRevalidateCacheControl;

const jsonContentType = 'application/json; charset=utf-8';
const jsonCacheControl = immutableCacheControl;

const javascriptContentType = 'text/javascript; charset=utf-8';
const javascriptCacheControl = immutableCacheControl;

const notFoundPublicFilePath = '404.html';
const notFoundContentType = htmlContentType;
const notFoundCacheControl = noCacheCacheControl;

export default (request: NowRequest, response: NowResponse) => {
    const { url } = request;

    if (!url) {
        throw new Error('Unexpected: no url.');
    }

    if (url.endsWith('/') && url !== '/') {
        response.redirect(308, url.slice(0, -1));
        return;
    }

    response.setHeader('Vary', 'Accept-Encoding');

    const publicFilePath = publicUrlToPublicFilePath.get(url);

    if (!publicFilePath) {
        response.setHeader('Content-Type', notFoundContentType);
        response.setHeader('Cache-Control', notFoundCacheControl);
        sendPublicFile(request, response, {
            publicFilePath: notFoundPublicFilePath,
            useETag: false,
            status: 404,
        });
        return;
    }

    const extension = path.extname(publicFilePath);
    switch (extension) {
        case '.html': {
            response.setHeader('Content-Type', htmlContentType);
            response.setHeader('Cache-Control', htmlCacheControl);
            break;
        }
        case '.json': {
            response.setHeader('Content-Type', jsonContentType);
            response.setHeader('Cache-Control', jsonCacheControl);
            break;
        }
        case '.js': {
            response.setHeader('Content-Type', javascriptContentType);
            response.setHeader('Cache-Control', javascriptCacheControl);
            break;
        }
        default: {
            throw new Error(`Unexpected extension ${extension}.`);
        }
    }

    sendPublicFile(request, response, {
        publicFilePath,
        useETag: true,
        status: 200,
    });
};

import * as fs from 'fs';
import * as path from 'path';
import { encodings as parseEncodingsHeader } from '@hapi/accept';
import { NowRequest, NowResponse } from '@vercel/node';
// import * as fresh from 'fresh';
import { parsePath } from 'history';
import { PublicFileMetadata } from '../script/template/types';

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
        // Handled by vercel.
        // if (fresh(request.headers, { etag: encodingMeta.etag })) {
        //     response.status(304).end();
        //     return;
        // }
        response.setHeader('ETag', encodingMeta.etag);
    }

    response.status(status);
    response.setHeader('Content-Encoding', contentEncoding);
    response.setHeader('Content-Length', encodingMeta.contentLength);

    if (request.method === 'HEAD') {
        response.status(204).end();
        return;
    }

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
    const ext = path.extname(publicFilePath);
    if (ext !== '.png') {
        const acceptEncodingHeader = request.headers['accept-encoding'];
        if (typeof acceptEncodingHeader === 'string') {
            const encodings = parseEncodingsHeader(acceptEncodingHeader);
            if (encodings.includes('br')) {
                contentEncoding = 'br';
            } else if (encodings.includes('gzip')) {
                contentEncoding = 'gzip';
            }
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
const mustRevalidateCacheControl = 'public, s-maxage=31536000, max-age=0';
// const noCacheCacheControl = 'no-cache, no-store, max-age=0, must-revalidate';

const allowHeaderValue = 'GET, HEAD, OPTIONS';

export default (request: NowRequest, response: NowResponse) => {
    if (!request.url || !request.method) {
        throw new Error('Unexpected: no url or no method.');
    }

    if (request.method === 'OPTIONS') {
        response.writeHead(204, {
            Allow: allowHeaderValue,
        });
        response.end();
        return;
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.writeHead(405, {
            Allow: allowHeaderValue,
        });
        response.end();
        return;
    }

    const { pathname = '/', search = '' } = parsePath(request.url);

    if (pathname.endsWith('/') && pathname !== '/') {
        response.redirect(308, pathname.slice(0, -1) + search);
        return;
    }

    response.setHeader('Vary', 'Accept-Encoding');

    const publicFilePath = publicUrlToPublicFilePath.get(pathname);

    if (!publicFilePath) {
        response.setHeader('Content-Type', 'text/html; charset=utf-8');
        response.setHeader('Cache-Control', mustRevalidateCacheControl);
        sendPublicFile(request, response, {
            publicFilePath: '404.html',
            useETag: true,
            status: 404,
        });
        return;
    }

    const extension = path.extname(publicFilePath);
    switch (extension) {
        case '.html': {
            response.setHeader('Content-Type', 'text/html; charset=utf-8');
            response.setHeader('Cache-Control', mustRevalidateCacheControl);
            break;
        }
        case '.json': {
            response.setHeader(
                'Content-Type',
                'application/json; charset=utf-8',
            );
            response.setHeader('Cache-Control', immutableCacheControl);
            break;
        }
        case '.js': {
            response.setHeader(
                'Content-Type',
                'text/javascript; charset=utf-8',
            );
            if (publicFilePath === '/sw.js') {
                // Service worker changes basically every build.
                response.setHeader('Cache-Control', mustRevalidateCacheControl);
            } else {
                response.setHeader('Cache-Control', immutableCacheControl);
            }
            break;
        }
        case '.webmanifest': {
            response.setHeader(
                'Content-Type',
                'application/manifest+json; charset=utf-8',
            );
            response.setHeader('Cache-Control', mustRevalidateCacheControl);
            break;
        }
        case '.png': {
            response.setHeader('Content-Type', 'image/png');
            response.setHeader('Cache-Control', immutableCacheControl);
            break;
        }
        case '.svg': {
            response.setHeader('Content-Type', 'image/svg+xml');
            response.setHeader('Cache-Control', immutableCacheControl);
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

import { promises as fs } from 'fs';
import { join } from 'path';
import { encodings as parseEncodingsHeader } from '@hapi/accept';
import { NowRequest, NowResponse } from '@vercel/node';
import * as pageNodeMapMetadata from '../_files/api-doc/page-node-map-metadata.json';
import * as pageNodeMapUpdateResponseMetadata from '../_files/api-doc/page-node-map-update-response-metadata.json';
import {
    ApiDocMapResponseType,
    ApiDocMapUpToDateResponse,
    ApiDocMapErrorResponse,
} from '../types/ApiDocMapResponse';

const pageNodeMapUpdateResponseJsonPromise = fs.readFile(
    join(
        __dirname,
        '..',
        '_files',
        'api-doc',
        'page-node-map-update-response.json',
    ),
);
const pageNodeMapUpdateResponseBrotliPromise = fs.readFile(
    join(
        __dirname,
        '..',
        '_files',
        'api-doc',
        'page-node-map-update-response.br',
    ),
);

async function sendUpdateResponse(
    req: NowRequest,
    res: NowResponse,
): Promise<void> {
    res.status(200);

    const acceptEncodingHeader = req.headers['accept-encoding'];
    if (
        acceptEncodingHeader === undefined ||
        typeof acceptEncodingHeader === 'string'
    ) {
        const encodings = parseEncodingsHeader(acceptEncodingHeader);
        if (encodings.includes('br')) {
            res.setHeader('Content-Encoding', 'br');
            res.setHeader(
                'Content-Length',
                pageNodeMapUpdateResponseMetadata.contentLength,
            );
            res.send(await pageNodeMapUpdateResponseBrotliPromise);
            return;
        }
    }

    res.send(await pageNodeMapUpdateResponseJsonPromise);
}

export default async (req: NowRequest, res: NowResponse) => {
    res.setHeader('Content-Type', 'application/json');

    if (!('hash' in req.query)) {
        await sendUpdateResponse(req, res);
        return;
    }

    if (typeof req.query.hash !== 'string') {
        const errorResponse: ApiDocMapErrorResponse = {
            type: ApiDocMapResponseType.Error,
            message: 'Non-string hash',
        };
        res.status(400).json(errorResponse);
        return;
    }

    if (req.query.hash === pageNodeMapMetadata.hash) {
        const upToDateResponse: ApiDocMapUpToDateResponse = {
            type: ApiDocMapResponseType.UpToDate,
        };
        res.status(200).json(upToDateResponse);
        return;
    }

    await sendUpdateResponse(req, res);
};

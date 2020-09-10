import { promises as fs } from 'fs';
import { join } from 'path';
import { NowRequest, NowResponse } from '@vercel/node';
import {
    PageNodeMapWithMetadata,
    PageNodeMapMetadata,
} from '../script/docs/apigen/types';

const metadataPromise = fs
    .readFile(
        join(
            __dirname,
            '..',
            '_files',
            'api-doc',
            'page-node-map-metadata.json',
        ),
        'utf-8',
    )
    .then<PageNodeMapMetadata>(JSON.parse);
const apiMapWithMetadataPromise = fs.readFile(
    join(
        __dirname,
        '..',
        '_files',
        'api-doc',
        'page-node-map-with-metadata.json',
    ),
    'utf-8',
);

export enum ResponseType {
    Update = 'update',
    UpToDate = 'up-to-date',
    Error = 'error',
}

export interface UpdateResponse {
    type: ResponseType.Update;
    payload: PageNodeMapWithMetadata;
}
export interface UpToDateResponse {
    type: ResponseType.UpToDate;
}
export interface ErrorResponse {
    type: ResponseType.Error;
    message: string;
}
export type Response = UpdateResponse | UpToDateResponse | ErrorResponse;

const updateResponsePromise = apiMapWithMetadataPromise.then(
    (payload) => `{"type":"${ResponseType.Update}","payload":${payload}}`,
);
const upToDateResponseObject: UpToDateResponse = {
    type: ResponseType.UpToDate,
};
const upToDateResponse = JSON.stringify(upToDateResponseObject);
const invalidHashResponseObject: ErrorResponse = {
    type: ResponseType.Error,
    message: 'Invalid hash',
};
const invalidHashResponse = JSON.stringify(invalidHashResponseObject);

export default async (req: NowRequest, res: NowResponse) => {
    res.setHeader('Content-Type', 'application/json');

    if (!('hash' in req.query)) {
        res.status(200).send(await updateResponsePromise);
        return;
    }

    if (typeof req.query.hash !== 'string') {
        res.status(400).send(invalidHashResponse);
        return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { hash } = await metadataPromise;

    if (req.query.hash === hash) {
        res.status(200).send(upToDateResponse);
        return;
    }

    res.status(200).send(await updateResponsePromise);
};

import { PageNodeMapWithMetadata } from '../script/docs/apigen/types';

export enum ApiDocMapResponseType {
    Update = 'update',
    UpToDate = 'up-to-date',
    Error = 'error',
}

export interface ApiDocMapUpdateResponse {
    type: ApiDocMapResponseType.Update;
    payload: PageNodeMapWithMetadata;
}
export interface ApiDocMapUpToDateResponse {
    type: ApiDocMapResponseType.UpToDate;
}
export interface ApiDocMapErrorResponse {
    type: ApiDocMapResponseType.Error;
    message: string;
}
export type ApiDocMapResponse =
    | ApiDocMapUpdateResponse
    | ApiDocMapUpToDateResponse
    | ApiDocMapErrorResponse;

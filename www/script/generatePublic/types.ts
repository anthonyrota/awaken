export interface EncodingMetadata {
    contentLength: number;
    etag: string;
}

export interface PublicFileMetadata {
    brotliEncodingMeta: EncodingMetadata;
    gzipEncodingMeta: EncodingMetadata;
    identityEncodingMeta: EncodingMetadata;
}

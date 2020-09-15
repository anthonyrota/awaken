import { DeepCoreNode } from './core/nodes';

export type PageNodeMap = Record<string, DeepCoreNode>;

export interface PageNodeMapMetadata {
    hash: string;
    github: null | {
        org: string;
        repo: string;
        ref: string;
        sha: string;
    };
    version: number;
}

export interface PageNodeMapWithMetadata {
    metadata: PageNodeMapMetadata;
    pageNodeMap: PageNodeMap;
}

export interface TableOfContentsInlineReference {
    text: string;
    urlHashText: string;
}

export interface TableOfContentsNestedReference
    extends TableOfContentsInlineReference {
    inlineReferences?: TableOfContentsInlineReference[];
}

export interface TableOfContentsMainReference
    extends TableOfContentsNestedReference {
    nested_references?: TableOfContentsNestedReference[];
}

export type TableOfContents = TableOfContentsMainReference[];

export interface PageMetadata {
    title: string;
    tableOfContents: TableOfContents;
}

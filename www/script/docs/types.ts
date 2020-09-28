import { DeepCoreNode } from './core/nodes';
import { PageNode } from './core/nodes/Page';

export type PageOrder = /* PageId[] */ string[];
export type Pages = PageNode<DeepCoreNode>[];

export interface PagesMetadata {
    order: PageOrder;
    github: null | {
        org: string;
        repo: string;
        ref: string;
        sha: string;
    };
}

export interface PagesWithMetadata {
    metadata: PagesMetadata;
    pages: Pages;
}

export type PageIdToWebsitePath = Record<string, string>;

export interface TableOfContentsInlineReference {
    text: string;
    urlHashText: string;
}

export interface TableOfContentsMainReference
    extends TableOfContentsInlineReference {
    inlineReferences?: TableOfContentsInlineReference[];
    nestedReferences?: TableOfContentsMainReference[];
}

export type TableOfContents = TableOfContentsMainReference[];

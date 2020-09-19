import { DeepCoreNode } from './core/nodes';
import { PageNode } from './core/nodes/Page';

export type Pages = PageNode<DeepCoreNode>[];

export interface PagesMetadata {
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

export type PagesUrlList = string[];

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

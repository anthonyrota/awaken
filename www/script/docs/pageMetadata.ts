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

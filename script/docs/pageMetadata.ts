export interface TableOfContentsInlineReference {
    text: string;
    url_hash_text: string;
}

export interface TableOfContentsNestedReference
    extends TableOfContentsInlineReference {
    inline_references?: TableOfContentsInlineReference[];
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

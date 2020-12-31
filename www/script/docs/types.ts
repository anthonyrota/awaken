import type { Theme } from '../../src/theme';
import type { DeepCoreNode } from './core/nodes';
import type { PageNode } from './core/nodes/Page';

export type Pages = PageNode<DeepCoreNode>[];

export interface PageGroup {
    title: string;
    // HACK: null represents separator.
    pageIds: (string | null)[];
}

export interface CodeBlockStyle {
    foreground: string;
    background: string;
    colorMap: string[];
}

export type CodeBlockStyleMap = Record<Theme, CodeBlockStyle>;

export interface PagesMetadata {
    pageIdToWebsitePath: Record<string, string>;
    pageIdToPageTitle: Record<string, string>;
    pageGroups: PageGroup[];
    codeBlockStyleMap: CodeBlockStyleMap;
    github: null | {
        org: string;
        repo: string;
        ref: string;
        sha: string;
    };
}

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

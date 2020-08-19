import { TableOfContents as TableOfContents_ } from '../../pageMetadata';
import { Node, CoreNodeType } from '.';

export interface TableOfContents extends Node {
    type: CoreNodeType.TableOfContents;
    tableOfContents: TableOfContents_;
    relativePagePath: string;
}

export interface TableOfContentsParameters {
    tableOfContents: TableOfContents_;
    relativePagePath?: string;
}

export function TableOfContents(
    parameters: TableOfContentsParameters,
): TableOfContents {
    return {
        type: CoreNodeType.TableOfContents,
        tableOfContents: parameters.tableOfContents,
        relativePagePath: parameters.relativePagePath ?? '',
    };
}

import { TableOfContents } from '../../pageMetadata';
import { Node, CoreNodeType } from '.';

export interface TableOfContentsList extends Node {
    type: CoreNodeType.TableOfContentsList;
    tableOfContents: TableOfContents;
    relativePagePath: string;
}

export interface TableOfContentsListParameters {
    tableOfContents: TableOfContents;
    relativePagePath?: string;
}

export function TableOfContentsList(
    parameters: TableOfContentsListParameters,
): TableOfContentsList {
    return {
        type: CoreNodeType.TableOfContentsList,
        tableOfContents: parameters.tableOfContents,
        relativePagePath: parameters.relativePagePath ?? '',
    };
}

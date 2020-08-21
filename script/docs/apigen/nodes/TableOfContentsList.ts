import { TableOfContents } from '../../pageMetadata';
import { Node, CoreNodeType } from '.';

export interface TableOfContentsListParameters {
    tableOfContents: TableOfContents;
    relativePagePath?: string;
}

export interface TableOfContentsListBase {
    tableOfContents: TableOfContents;
    relativePagePath: string;
}

export function TableOfContentsListBase(
    parameters: TableOfContentsListParameters,
): TableOfContentsListBase {
    return {
        tableOfContents: parameters.tableOfContents,
        relativePagePath: parameters.relativePagePath ?? '',
    };
}

export interface TableOfContentsListNode extends TableOfContentsListBase, Node {
    type: CoreNodeType.TableOfContentsList;
}

export function TableOfContentsListNode(
    parameters: TableOfContentsListParameters,
): TableOfContentsListNode {
    return {
        type: CoreNodeType.TableOfContentsList,
        ...TableOfContentsListBase(parameters),
    };
}

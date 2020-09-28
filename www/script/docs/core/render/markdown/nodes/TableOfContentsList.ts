import { TableOfContents } from '../../../../types';
import { Node } from '../../../nodes';
import { RenderMarkdownNodeType } from '.';

export interface TableOfContentsListParameters {
    tableOfContents: TableOfContents;
}

export interface TableOfContentsListBase {
    tableOfContents: TableOfContents;
}

export function TableOfContentsListBase(
    parameters: TableOfContentsListParameters,
): TableOfContentsListBase {
    return {
        tableOfContents: parameters.tableOfContents,
    };
}

export interface TableOfContentsListNode extends TableOfContentsListBase, Node {
    type: RenderMarkdownNodeType.TableOfContentsList;
}

export function TableOfContentsListNode(
    parameters: TableOfContentsListParameters,
): TableOfContentsListNode {
    return {
        type: RenderMarkdownNodeType.TableOfContentsList,
        ...TableOfContentsListBase(parameters),
    };
}

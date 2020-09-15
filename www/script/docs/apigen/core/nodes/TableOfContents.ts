import { TableOfContents } from '../../types';
import { Node, CoreNodeType } from '.';

export interface TableOfContentsParameters {
    tableOfContents: TableOfContents;
    relativePagePath?: string;
}

export interface TableOfContentsBase {
    tableOfContents: TableOfContents;
    relativePagePath: string;
}

export function TableOfContentsBase(
    parameters: TableOfContentsParameters,
): TableOfContentsBase {
    return {
        tableOfContents: parameters.tableOfContents,
        relativePagePath: parameters.relativePagePath ?? '',
    };
}

export interface TableOfContentsNode extends TableOfContentsBase, Node {
    type: CoreNodeType.TableOfContents;
}

export function TableOfContentsNode(
    parameters: TableOfContentsParameters,
): TableOfContentsNode {
    return {
        type: CoreNodeType.TableOfContents,
        ...TableOfContentsBase(parameters),
    };
}

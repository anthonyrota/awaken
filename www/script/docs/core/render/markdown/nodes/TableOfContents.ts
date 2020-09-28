import { TableOfContents } from '../../../../types';
import { Node } from '../../../nodes';
import { RenderMarkdownNodeType } from '.';

export interface TableOfContentsParameters {
    tableOfContents: TableOfContents;
}

export interface TableOfContentsBase {
    tableOfContents: TableOfContents;
}

export function TableOfContentsBase(
    parameters: TableOfContentsParameters,
): TableOfContentsBase {
    return {
        tableOfContents: parameters.tableOfContents,
    };
}

export interface TableOfContentsNode extends TableOfContentsBase, Node {
    type: RenderMarkdownNodeType.TableOfContents;
}

export function TableOfContentsNode(
    parameters: TableOfContentsParameters,
): TableOfContentsNode {
    return {
        type: RenderMarkdownNodeType.TableOfContents,
        ...TableOfContentsBase(parameters),
    };
}

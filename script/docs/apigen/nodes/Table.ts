import { ContainerBase } from './abstract/ContainerBase';
import { Node, CoreNodeType } from '.';

export type TableRow<CellNode extends Node> = ContainerBase<CellNode>;

export function TableRow<CellNode extends Node>(): TableRow<CellNode> {
    return ContainerBase<CellNode>();
}

export interface Table<HeaderCellNode extends Node, BodyCellNode extends Node>
    extends Node {
    type: CoreNodeType.Table;
    header: TableRow<HeaderCellNode>;
    rows: TableRow<BodyCellNode>[];
}

export interface TableParameters<HeaderCellNode extends Node> {
    header: TableRow<HeaderCellNode>;
}

export function Table<HeaderCellNode extends Node, BodyCellNode extends Node>(
    parameters: TableParameters<HeaderCellNode>,
): Table<HeaderCellNode, BodyCellNode> {
    return {
        type: CoreNodeType.Table,
        header: parameters.header,
        rows: [],
    };
}

export function addTableRowC<
    HeaderCellNode extends Node,
    BodyCellNode extends Node
>(
    table: Table<HeaderCellNode, BodyCellNode>,
    ...rows: TableRow<BodyCellNode>[]
): Table<HeaderCellNode, BodyCellNode> {
    table.rows.push(...rows);
    return table;
}

export function addTableRow<BodyCellNode extends Node>(
    table: Table<Node, BodyCellNode>,
    ...rows: TableRow<BodyCellNode>[]
): void {
    table.rows.push(...rows);
}

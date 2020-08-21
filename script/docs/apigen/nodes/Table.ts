import { ContainerBase, ContainerParameters } from './Container';
import { Node, CoreNodeType } from '.';

export interface TableRow<CellNode extends Node>
    extends ContainerBase<CellNode> {}

export interface TableRowParameters<CellNode extends Node>
    extends ContainerParameters<CellNode> {}

export function TableRow<CellNode extends Node>(
    parameters: TableRowParameters<CellNode>,
): TableRow<CellNode> {
    return ContainerBase<CellNode>({ children: parameters.children });
}

export interface TableParameters<
    HeaderCellNode extends Node,
    BodyCellNode extends Node
> {
    header: TableRow<HeaderCellNode>;
    rows?: TableRow<BodyCellNode>[];
}

export interface TableBase<
    HeaderCellNode extends Node,
    BodyCellNode extends Node
> {
    header: TableRow<HeaderCellNode>;
    rows: TableRow<BodyCellNode>[];
}

export function TableBase<
    HeaderCellNode extends Node,
    BodyCellNode extends Node
>(
    parameters: TableParameters<HeaderCellNode, BodyCellNode>,
): TableBase<HeaderCellNode, BodyCellNode> {
    return {
        header: parameters.header,
        rows: parameters.rows ?? [],
    };
}

export interface TableNode<
    HeaderCellNode extends Node,
    BodyCellNode extends Node
> extends TableBase<HeaderCellNode, BodyCellNode>, Node {
    type: CoreNodeType.Table;
}

export function TableNode<
    HeaderCellNode extends Node,
    BodyCellNode extends Node
>(
    parameters: TableParameters<HeaderCellNode, BodyCellNode>,
): TableNode<HeaderCellNode, BodyCellNode> {
    return {
        type: CoreNodeType.Table,
        ...TableBase(parameters),
    };
}

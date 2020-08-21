import { Node } from '../../nodes';
import { HtmlElementNode } from '../../nodes/HtmlElement';
import { TableBase, TableRow } from '../../nodes/Table';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteChildNode, ParamWriteCoreNode } from '.';

function writeTableRow<CellNode extends Node>(
    tableRow: TableRow<CellNode>,
    columnCount: number,
    output: MarkdownOutput,
    writeChildNode: ParamWriteChildNode<CellNode>,
): void {
    output.write('|');
    for (const cell of tableRow.children) {
        output.write(' ');
        output.markStartOfParagraph();
        output.withInTable(() => {
            writeChildNode(cell, output);
        });
        output.write(' |');
    }
    output.write(
        '  |'.repeat(Math.max(0, columnCount - tableRow.children.length)),
    );
}

function getColumnCount(table: TableBase<Node, Node>): number {
    const columnCount = Math.max(
        table.header.children.length,
        ...table.rows.map((row) => row.children.length),
    );

    if (columnCount === 0) {
        throw new Error('No columns in table.');
    }

    return columnCount;
}

function buildRowAsHtmlElement<CellNode extends Node>(
    row: TableRow<CellNode>,
    cellTagName: string,
    columnCount: number,
): HtmlElementNode<HtmlElementNode<CellNode>> {
    const tableRow = HtmlElementNode({
        tagName: 'tr',
        children: row.children.map((child) => {
            return HtmlElementNode({
                tagName: cellTagName,
                children: [child],
            });
        }),
    });
    for (let i = row.children.length; i < columnCount; i++) {
        tableRow.children.push(
            HtmlElementNode({
                tagName: cellTagName,
            }),
        );
    }
    return tableRow;
}

export function writeTable<
    HeaderCellNode extends Node,
    BodyCellNode extends Node
>(
    table: TableBase<HeaderCellNode, BodyCellNode>,
    output: MarkdownOutput,
    writeCoreNode: ParamWriteCoreNode,
    writeHeaderCellNode: ParamWriteChildNode<HeaderCellNode>,
    writeBodyCellNode: ParamWriteChildNode<BodyCellNode>,
) {
    const columnCount = getColumnCount(table);

    if (output.constrainedToSingleLine) {
        const tableElement = HtmlElementNode({
            tagName: 'table',
            children: [
                buildRowAsHtmlElement(table.header, 'th', columnCount),
                ...table.rows.map((row) =>
                    buildRowAsHtmlElement(row, 'td', columnCount),
                ),
            ],
        });
        let isHeader = true;
        writeCoreNode(tableElement, output, (node) => {
            writeCoreNode<HtmlElementNode<HeaderCellNode | BodyCellNode>>(
                node,
                output,
                (node) => {
                    writeCoreNode<HeaderCellNode | BodyCellNode>(
                        node,
                        output,
                        (node) => {
                            if (isHeader) {
                                writeHeaderCellNode(
                                    node as HeaderCellNode,
                                    output,
                                );
                            } else {
                                writeBodyCellNode(node as BodyCellNode, output);
                            }
                        },
                    );
                },
            );
            isHeader = false;
        });
    }

    output.withParagraphBreak(() => {
        if (table.header) {
            writeTableRow(
                table.header,
                columnCount,
                output,
                writeHeaderCellNode,
            );
        } else {
            output.write('|  '.repeat(columnCount));
            output.write('|');
        }

        // Divider.
        output.writeLine();
        output.write('| --- '.repeat(columnCount));
        output.write('|');

        for (const row of table.rows) {
            output.ensureNewLine();
            writeTableRow(row, columnCount, output, writeBodyCellNode);
        }
    });
}

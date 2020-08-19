import { addChildrenC, addChildren } from '../../nodes/abstract/ContainerBase';
import { HtmlElement } from '../../nodes/HtmlElement';
import { Table, TableRow } from '../../nodes/Table';
import { Node } from '../../nodes';
import { MarkdownOutput } from './MarkdownOutput';
import { writeHtmlElement } from './HtmlElement';

function writeTableRow<CellNode extends Node>(
    tableRow: TableRow<CellNode>,
    columnCount: number,
    output: MarkdownOutput,
    writeCellNode: (node: CellNode, output: MarkdownOutput) => void,
): void {
    output.write('|');
    for (const cell of tableRow.children) {
        output.write(' ');
        output.markStartOfParagraph();
        output.withInTable(() => {
            writeCellNode(cell, output);
        });
        output.write(' |');
    }
    output.write(
        '  |'.repeat(Math.max(0, columnCount - tableRow.children.length)),
    );
}

function getColumnCount(table: Table<Node, Node>): number {
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
): HtmlElement<HtmlElement<CellNode>> {
    const tableRow = HtmlElement<HtmlElement<CellNode>>({ tagName: 'tr' });
    for (const child of row.children) {
        addChildren(
            tableRow,
            addChildrenC(
                HtmlElement<CellNode>({ tagName: cellTagName }),
                child,
            ),
        );
    }
    for (let i = row.children.length; i < columnCount; i++) {
        addChildren(tableRow, HtmlElement({ tagName: cellTagName }));
    }
    return tableRow;
}

export function writeTable<
    HeaderCellNode extends Node,
    BodyCellNode extends Node
>(
    table: Table<HeaderCellNode, BodyCellNode>,
    output: MarkdownOutput,
    writeCellNode: (
        node: HeaderCellNode | BodyCellNode,
        output: MarkdownOutput,
    ) => void,
) {
    const columnCount = getColumnCount(table);

    if (output.constrainedToSingleLine) {
        const tableElement = HtmlElement<
            HtmlElement<HtmlElement<HeaderCellNode | BodyCellNode>>
        >({ tagName: 'table' });
        addChildren(
            tableElement,
            buildRowAsHtmlElement(table.header, 'th', columnCount),
        );
        for (const row of table.rows) {
            addChildren(
                tableElement,
                buildRowAsHtmlElement(row, 'td', columnCount),
            );
        }
        // TODO.
        writeHtmlElement(tableElement, output, (node) => {
            writeHtmlElement(node, output, (node) => {
                writeHtmlElement(node, output, (node) => {
                    writeCellNode(node, output);
                });
            });
        });
    }

    output.withParagraphBreak(() => {
        if (table.header) {
            writeTableRow(table.header, columnCount, output, writeCellNode);
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
            writeTableRow(row, columnCount, output, writeCellNode);
        }
    });
}

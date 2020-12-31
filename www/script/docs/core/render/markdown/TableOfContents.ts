import { BoldNode } from '../../nodes/Bold';
import { CollapsibleSectionNode } from '../../nodes/CollapsibleSection';
import { PlainTextNode } from '../../nodes/PlainText';
import { MarkdownOutput } from './MarkdownOutput';
import { TableOfContentsBase } from './nodes/TableOfContents';
import { TableOfContentsListNode } from './nodes/TableOfContentsList';
import { ParamWriteRenderMarkdownNode, writeDeepRenderMarkdownNode } from '.';

export function writeTableOfContents(
    tableOfContents: TableOfContentsBase,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
): void {
    writeDeepRenderMarkdownNode(
        CollapsibleSectionNode({
            summaryNode: BoldNode({
                children: [PlainTextNode({ text: 'Table of Contents' })],
            }),
            children: [
                TableOfContentsListNode({
                    tableOfContents: tableOfContents.tableOfContents,
                }),
            ],
        }),
        output,
        writeRenderMarkdownNode,
    );
}

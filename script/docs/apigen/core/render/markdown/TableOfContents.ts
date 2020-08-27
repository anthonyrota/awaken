import { DeepCoreNode } from '../../nodes';
import { BoldNode } from '../../nodes/Bold';
import { CollapsibleSectionNode } from '../../nodes/CollapsibleSection';
import { HtmlElementNode } from '../../nodes/HtmlElement';
import { PlainTextNode } from '../../nodes/PlainText';
import { TableOfContentsBase } from '../../nodes/TableOfContents';
import { TableOfContentsListNode } from '../../nodes/TableOfContentsList';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteCoreNode, writeDeepCoreNode } from '.';

export function writeTableOfContents(
    tableOfContents: TableOfContentsBase,
    output: MarkdownOutput,
    writeCoreNode: ParamWriteCoreNode,
): void {
    writeDeepCoreNode(
        CollapsibleSectionNode<DeepCoreNode, DeepCoreNode>({
            summaryNode: BoldNode<DeepCoreNode>({
                children: [PlainTextNode({ text: 'Table of Contents' })],
            }),
            children: [
                HtmlElementNode({ tagName: 'br' }),
                TableOfContentsListNode({
                    tableOfContents: tableOfContents.tableOfContents,
                    relativePagePath: tableOfContents.relativePagePath,
                }),
            ],
        }),
        output,
        writeCoreNode,
    );
}

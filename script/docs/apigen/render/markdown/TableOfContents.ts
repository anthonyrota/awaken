import { PlainText } from './../../nodes/PlainText';
import { Bold } from './../../nodes/Bold';
import { TableOfContentsList } from './../../nodes/TableOfContentsList';
import { HtmlElement } from './../../nodes/HtmlElement';
import { CollapsibleSection } from './../../nodes/CollapsibleSection';
import { DeepCoreNode } from './../../nodes';
import { addChildrenC } from '../../nodes/abstract/ContainerBase';
import { TableOfContents } from '../../nodes/TableOfContents';
import { MarkdownOutput } from './MarkdownOutput';

export function writeTableOfContents(
    tableOfContents: TableOfContents,
    output: MarkdownOutput,
    writeDeepCoreNode: (node: DeepCoreNode, output: MarkdownOutput) => void,
): void {
    writeDeepCoreNode(
        addChildrenC<
            DeepCoreNode,
            CollapsibleSection<DeepCoreNode, DeepCoreNode>
        >(
            CollapsibleSection<DeepCoreNode, DeepCoreNode>({
                summaryNode: addChildrenC<DeepCoreNode, Bold<DeepCoreNode>>(
                    Bold<DeepCoreNode>(),
                    PlainText({ text: 'Table of Contents' }),
                ),
            }),
            HtmlElement({ tagName: 'br' }),
            TableOfContentsList({
                tableOfContents: tableOfContents.tableOfContents,
                relativePagePath: tableOfContents.relativePagePath,
            }),
        ),
        output,
    );
}

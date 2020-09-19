import { Node } from '../../nodes';
import { ContainerNode } from '../../nodes/Container';
import { PageBase } from '../../nodes/Page';
import { PageTitleNode } from '../../nodes/PageTitle';
import { PlainTextNode } from '../../nodes/PlainText';
import { MarkdownOutput } from './MarkdownOutput';
import { DoNotEditCommentNode } from './nodes/DoNotEditComment';
import { TableOfContentsNode } from './nodes/TableOfContents';
import {
    ParamWriteRenderMarkdownNode,
    ParamWriteChildNode,
    writeDeepRenderMarkdownNode,
} from '.';

export function writePage<ChildNode extends Node>(
    page: PageBase<ChildNode>,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void {
    writeRenderMarkdownNode(DoNotEditCommentNode({}), output);
    writeDeepRenderMarkdownNode(
        PageTitleNode({
            children: [PlainTextNode({ text: page.metadata.title })],
        }),
        output,
        writeRenderMarkdownNode,
    );
    writeRenderMarkdownNode(
        TableOfContentsNode({
            tableOfContents: page.metadata.tableOfContents,
            pagePath: page.pagePath,
        }),
        output,
    );
    writeRenderMarkdownNode(
        ContainerNode({ children: page.children }),
        output,
        writeChildNode,
    );
    output.ensureNewLine();
}

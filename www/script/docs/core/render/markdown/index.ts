import { Node, CoreNodeType } from '../../nodes';
import { writeBlockQuote } from './BlockQuote';
import { writeBold } from './Bold';
import { writeCodeBlock } from './CodeBlock';
import { writeCodeSpan } from './CodeSpan';
import { writeCollapsibleSection } from './CollapsibleSection';
import { writeContainer } from './ContainerBase';
import { writeDocPageLink } from './DocPageLink';
import { writeDoNotEditComment } from './DoNotEditComment';
import { writeFunctional } from './Functional';
import { writeGithubSourceLink } from './GithubSourceLink';
import { writeHeading } from './Heading';
import { writeHeading123456 } from './Heading123456';
import { writeHorizontalRule } from './HorizontalRule';
import { writeHtmlComment } from './HtmlComment';
import { writeHtmlElement } from './HtmlElement';
import { writeImage } from './Image';
import { writeItalics } from './Italics';
import { writeLineBreak } from './LineBreak';
import { writeLink } from './Link';
import { writeList } from './List';
import { MarkdownOutput, MarkdownOutputParameters } from './MarkdownOutput';
import { writeNamedAnchor } from './NamedAnchor';
import {
    LeafRenderMarkdownNode,
    RenderMarkdownNode,
    DeepRenderMarkdownNode,
    RenderMarkdownNodeType,
} from './nodes';
import { writePage } from './Page';
import { writePageTitle } from './PageTitle';
import { writeParagraph } from './Paragraph';
import { writePlainText } from './PlainText';
import { writeRichCodeBlock } from './RichCodeBlock';
import { writeStrikethrough } from './Strikethrough';
import { writeSubheading } from './Subheading';
import { writeSubscript } from './Subscript';
import { writeSuperscript } from './Superscript';
import { writeTable } from './Table';
import { writeTableOfContents } from './TableOfContents';
import { writeTableOfContentsList } from './TableOfContentsList';
import { writeTitle } from './Title';

export interface ParamWriteChildNode<ChildNode extends Node> {
    (node: ChildNode, output: MarkdownOutput): void;
}

export interface ParamWriteRenderMarkdownNode {
    (node: LeafRenderMarkdownNode, output: MarkdownOutput): void;
    <ChildNode extends Node>(
        node: RenderMarkdownNode<ChildNode>,
        output: MarkdownOutput,
        writeChildNode: ParamWriteChildNode<ChildNode>,
    ): void;
}

export function writeDeepRenderMarkdownNode(
    node: DeepRenderMarkdownNode,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
): void {
    (function writeChildNode(
        node: DeepRenderMarkdownNode,
        output: MarkdownOutput,
    ): void {
        writeRenderMarkdownNode(node, output, writeChildNode);
    })(node, output);
}

export function writeRenderMarkdownNode(
    node: LeafRenderMarkdownNode,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
): void;
export function writeRenderMarkdownNode<ChildNode extends Node>(
    node: RenderMarkdownNode<ChildNode>,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void;
export function writeRenderMarkdownNode<ChildNode extends Node>(
    node: RenderMarkdownNode<ChildNode>,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
    writeChildNode?: ParamWriteChildNode<ChildNode>,
): void {
    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    switch (node.type) {
        case CoreNodeType.Container: {
            writeContainer(
                node,
                output,
                writeRenderMarkdownNode,
                writeChildNode!,
            );
            break;
        }
        case CoreNodeType.PlainText: {
            writePlainText(node, output, writeRenderMarkdownNode);
            break;
        }
        case CoreNodeType.HorizontalRule: {
            writeHorizontalRule(node, output, writeRenderMarkdownNode);
            break;
        }
        case RenderMarkdownNodeType.HtmlComment: {
            writeHtmlComment(node, output, writeRenderMarkdownNode);
            break;
        }
        case CoreNodeType.BlockQuote: {
            writeBlockQuote(
                node,
                output,
                writeRenderMarkdownNode,
                writeChildNode!,
            );
            break;
        }
        case CoreNodeType.HtmlElement: {
            writeHtmlElement(
                node,
                output,
                writeRenderMarkdownNode,
                writeChildNode!,
            );
            break;
        }
        case CoreNodeType.Italics: {
            writeItalics(
                node,
                output,
                writeRenderMarkdownNode,
                writeChildNode!,
            );
            break;
        }
        case CoreNodeType.Bold: {
            writeBold(node, output, writeRenderMarkdownNode, writeChildNode!);
            break;
        }
        case CoreNodeType.Strikethrough: {
            writeStrikethrough(
                node,
                output,
                writeRenderMarkdownNode,
                writeChildNode!,
            );
            break;
        }
        case CoreNodeType.CodeSpan: {
            writeCodeSpan(
                node,
                output,
                writeRenderMarkdownNode,
                writeChildNode!,
            );
            break;
        }
        case CoreNodeType.CodeBlock: {
            writeCodeBlock(node, output, writeRenderMarkdownNode);
            break;
        }
        case CoreNodeType.RichCodeBlock: {
            writeRichCodeBlock(
                node,
                output,
                writeRenderMarkdownNode,
                writeChildNode!,
            );
            break;
        }
        case CoreNodeType.Link: {
            writeLink(node, output, writeRenderMarkdownNode, writeChildNode!);
            break;
        }
        case CoreNodeType.DocPageLink: {
            writeDocPageLink(
                node,
                output,
                writeRenderMarkdownNode,
                writeChildNode!,
            );
            break;
        }
        case CoreNodeType.GithubSourceLink: {
            writeGithubSourceLink(
                node,
                output,
                writeRenderMarkdownNode,
                writeChildNode!,
            );
            break;
        }
        case CoreNodeType.Image: {
            writeImage(node, output, writeRenderMarkdownNode);
            break;
        }
        case CoreNodeType.Paragraph: {
            writeParagraph(
                node,
                output,
                writeRenderMarkdownNode,
                writeChildNode!,
            );
            break;
        }
        case CoreNodeType.Heading123456: {
            writeHeading123456(
                node,
                output,
                writeRenderMarkdownNode,
                writeChildNode!,
            );
            break;
        }
        case CoreNodeType.Heading: {
            writeHeading(
                node,
                output,
                writeRenderMarkdownNode,
                writeChildNode!,
            );
            break;
        }
        case CoreNodeType.Subheading: {
            writeSubheading(
                node,
                output,
                writeRenderMarkdownNode,
                writeChildNode!,
            );
            break;
        }
        case CoreNodeType.Title: {
            writeTitle(node, output, writeRenderMarkdownNode, writeChildNode!);
            break;
        }
        case CoreNodeType.List: {
            writeList(node, output, writeRenderMarkdownNode, writeChildNode!);
            break;
        }
        case CoreNodeType.Table: {
            writeTable(
                node,
                output,
                writeRenderMarkdownNode,
                writeChildNode!,
                writeChildNode!,
            );
            break;
        }
        case CoreNodeType.CollapsibleSection: {
            writeCollapsibleSection(
                node,
                output,
                writeRenderMarkdownNode,
                writeChildNode!,
                writeChildNode!,
            );
            break;
        }
        case CoreNodeType.Subscript: {
            writeSubscript(
                node,
                output,
                writeRenderMarkdownNode,
                writeChildNode!,
            );
            break;
        }
        case CoreNodeType.Superscript: {
            writeSuperscript(
                node,
                output,
                writeRenderMarkdownNode,
                writeChildNode!,
            );
            break;
        }
        case CoreNodeType.NamedAnchor: {
            writeNamedAnchor(node, output, writeRenderMarkdownNode);
            break;
        }
        case CoreNodeType.LineBreak: {
            writeLineBreak(node, output, writeRenderMarkdownNode);
            break;
        }
        case CoreNodeType.PageTitle: {
            writePageTitle(
                node,
                output,
                writeRenderMarkdownNode,
                writeChildNode!,
            );
            break;
        }
        case CoreNodeType.Page: {
            writePage(node, output, writeRenderMarkdownNode, writeChildNode!);
            break;
        }
        case RenderMarkdownNodeType.TableOfContentsList: {
            writeTableOfContentsList(node, output, writeRenderMarkdownNode);
            break;
        }
        case RenderMarkdownNodeType.TableOfContents: {
            writeTableOfContents(node, output, writeRenderMarkdownNode);
            break;
        }
        case RenderMarkdownNodeType.DoNotEditComment: {
            writeDoNotEditComment(node, output, writeRenderMarkdownNode);
            break;
        }
        case RenderMarkdownNodeType.FunctionalNode: {
            writeFunctional(node, output, writeRenderMarkdownNode);
            break;
        }
        default: {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error Should already implement writing all node types.
            // eslint-disable-next-line max-len
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new Error(`Unexpected node type ${node.type}`);
        }
    }
    /* eslint-enable @typescript-eslint/no-non-null-assertion */
}

export function renderRenderMarkdownNodeAsMarkdown<ChildNode extends Node>(
    node: RenderMarkdownNode<ChildNode>,
    writeRenderMarkdownNode_: ParamWriteRenderMarkdownNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
    parameters: MarkdownOutputParameters,
): string {
    const output = new MarkdownOutput(parameters);
    writeRenderMarkdownNode(
        node,
        output,
        writeRenderMarkdownNode_,
        writeChildNode,
    );
    return output.toString();
}

export function renderDeepRenderMarkdownNodeAsMarkdown(
    node: DeepRenderMarkdownNode,
    parameters: MarkdownOutputParameters,
): string {
    const output = new MarkdownOutput(parameters);

    const writeRenderMarkdownNode_: ParamWriteRenderMarkdownNode = <
        ChildNode extends Node
    >(
        node: RenderMarkdownNode<ChildNode>,
        output: MarkdownOutput,
        writeChildNode?: ParamWriteChildNode<ChildNode>,
    ) => {
        writeRenderMarkdownNode(
            node,
            output,
            writeRenderMarkdownNode_,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            writeChildNode!,
        );
    };

    function writeChildNode(
        node: DeepRenderMarkdownNode,
        output: MarkdownOutput,
    ): void {
        writeRenderMarkdownNode(
            node,
            output,
            writeRenderMarkdownNode_,
            writeChildNode,
        );
    }

    writeRenderMarkdownNode(
        node,
        output,
        writeRenderMarkdownNode_,
        writeChildNode,
    );
    return output.toString();
}

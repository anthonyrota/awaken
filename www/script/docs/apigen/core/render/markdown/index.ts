import {
    Node,
    LeafCoreNode,
    CoreNode,
    DeepCoreNode,
    CoreNodeType,
} from '../../nodes';
import { writeBlockQuote } from './BlockQuote';
import { writeBold } from './Bold';
import { writeCodeBlock } from './CodeBlock';
import { writeCodeSpan } from './CodeSpan';
import { writeCollapsibleSection } from './CollapsibleSection';
import { writeContainer } from './ContainerBase';
import { writeDoNotEditComment } from './DoNotEditComment';
import { writeGithubSourceLink } from './GithubSourceLink';
import { writeHeading } from './Heading';
import { writeHeading123456 } from './Heading123456';
import { writeHorizontalRule } from './HorizontalRule';
import { writeHtmlComment } from './HtmlComment';
import { writeHtmlElement } from './HtmlElement';
import { writeImage } from './Image';
import { writeItalics } from './Italics';
import { writeLink } from './Link';
import { writeList } from './List';
import { writeLocalPageLink } from './LocalPageLink';
import { MarkdownOutput } from './MarkdownOutput';
import { writePage } from './Page';
import { writePageTitle } from './PageTitle';
import { writeParagraph } from './Paragraph';
import { writePlainText } from './PlainText';
import { writeRichCodeBlock } from './RichCodeBlock';
import { writeStrikethrough } from './Strikethrough';
import { writeSubheading } from './Subheading';
import { writeTable } from './Table';
import { writeTableOfContents } from './TableOfContents';
import { writeTableOfContentsList } from './TableOfContentsList';
import { writeTitle } from './Title';

export interface ParamWriteChildNode<ChildNode extends Node> {
    (node: ChildNode, output: MarkdownOutput): void;
}

export interface ParamWriteCoreNode {
    (node: LeafCoreNode, output: MarkdownOutput): void;
    <ChildNode extends Node>(
        node: CoreNode<ChildNode>,
        output: MarkdownOutput,
        writeChildNode: ParamWriteChildNode<ChildNode>,
    ): void;
}

export function writeDeepCoreNode(
    node: DeepCoreNode,
    output: MarkdownOutput,
    writeCoreNode: ParamWriteCoreNode,
): void {
    (function writeChildNode(node: DeepCoreNode, output: MarkdownOutput): void {
        writeCoreNode(node, output, writeChildNode);
    })(node, output);
}

export function writeCoreNode(
    node: LeafCoreNode,
    output: MarkdownOutput,
    writeCoreNode: ParamWriteCoreNode,
): void;
export function writeCoreNode<ChildNode extends Node>(
    node: CoreNode<ChildNode>,
    output: MarkdownOutput,
    writeCoreNode: ParamWriteCoreNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): void;
export function writeCoreNode<ChildNode extends Node>(
    node: CoreNode<ChildNode>,
    output: MarkdownOutput,
    writeCoreNode: ParamWriteCoreNode,
    writeChildNode?: ParamWriteChildNode<ChildNode>,
): void {
    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    switch (node.type) {
        case CoreNodeType.Container: {
            writeContainer(node, output, writeCoreNode, writeChildNode!);
            break;
        }
        case CoreNodeType.PlainText: {
            writePlainText(node, output, writeCoreNode);
            break;
        }
        case CoreNodeType.HorizontalRule: {
            writeHorizontalRule(node, output, writeCoreNode);
            break;
        }
        case CoreNodeType.HtmlComment: {
            writeHtmlComment(node, output, writeCoreNode);
            break;
        }
        case CoreNodeType.BlockQuote: {
            writeBlockQuote(node, output, writeCoreNode, writeChildNode!);
            break;
        }
        case CoreNodeType.HtmlElement: {
            writeHtmlElement(node, output, writeCoreNode, writeChildNode!);
            break;
        }
        case CoreNodeType.Italics: {
            writeItalics(node, output, writeCoreNode, writeChildNode!);
            break;
        }
        case CoreNodeType.Bold: {
            writeBold(node, output, writeCoreNode, writeChildNode!);
            break;
        }
        case CoreNodeType.Strikethrough: {
            writeStrikethrough(node, output, writeCoreNode, writeChildNode!);
            break;
        }
        case CoreNodeType.CodeSpan: {
            writeCodeSpan(node, output, writeCoreNode, writeChildNode!);
            break;
        }
        case CoreNodeType.CodeBlock: {
            writeCodeBlock(node, output, writeCoreNode);
            break;
        }
        case CoreNodeType.RichCodeBlock: {
            writeRichCodeBlock(node, output, writeCoreNode, writeChildNode!);
            break;
        }
        case CoreNodeType.Link: {
            writeLink(node, output, writeCoreNode, writeChildNode!);
            break;
        }
        case CoreNodeType.LocalPageLink: {
            writeLocalPageLink(node, output, writeCoreNode, writeChildNode!);
            break;
        }
        case CoreNodeType.GithubSourceLink: {
            writeGithubSourceLink(node, output, writeCoreNode, writeChildNode!);
            break;
        }
        case CoreNodeType.Image: {
            writeImage(node, output, writeCoreNode);
            break;
        }
        case CoreNodeType.Paragraph: {
            writeParagraph(node, output, writeCoreNode, writeChildNode!);
            break;
        }
        case CoreNodeType.Heading123456: {
            writeHeading123456(node, output, writeCoreNode, writeChildNode!);
            break;
        }
        case CoreNodeType.Heading: {
            writeHeading(node, output, writeCoreNode, writeChildNode!);
            break;
        }
        case CoreNodeType.Subheading: {
            writeSubheading(node, output, writeCoreNode, writeChildNode!);
            break;
        }
        case CoreNodeType.Title: {
            writeTitle(node, output, writeCoreNode, writeChildNode!);
            break;
        }
        case CoreNodeType.List: {
            writeList(node, output, writeCoreNode, writeChildNode!);
            break;
        }
        case CoreNodeType.Table: {
            writeTable(
                node,
                output,
                writeCoreNode,
                writeChildNode!,
                writeChildNode!,
            );
            break;
        }
        case CoreNodeType.CollapsibleSection: {
            writeCollapsibleSection(
                node,
                output,
                writeCoreNode,
                writeChildNode!,
                writeChildNode!,
            );
            break;
        }
        case CoreNodeType.PageTitle: {
            writePageTitle(node, output, writeCoreNode, writeChildNode!);
            break;
        }
        case CoreNodeType.TableOfContentsList: {
            writeTableOfContentsList(node, output, writeCoreNode);
            break;
        }
        case CoreNodeType.TableOfContents: {
            writeTableOfContents(node, output, writeCoreNode);
            break;
        }
        case CoreNodeType.DoNotEditComment: {
            writeDoNotEditComment(node, output, writeCoreNode);
            break;
        }
        case CoreNodeType.Page: {
            writePage(node, output, writeCoreNode, writeChildNode!);
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

export function renderCoreNodeAsMarkdown<ChildNode extends Node>(
    node: CoreNode<ChildNode>,
    writeCoreNode_: ParamWriteCoreNode,
    writeChildNode: ParamWriteChildNode<ChildNode>,
): string {
    const output = new MarkdownOutput();
    writeCoreNode(node, output, writeCoreNode_, writeChildNode);
    return output.toString();
}

export function renderDeepCoreNodeAsMarkdown(node: DeepCoreNode): string {
    const output = new MarkdownOutput();

    const writeCoreNode_: ParamWriteCoreNode = <ChildNode extends Node>(
        node: CoreNode<ChildNode>,
        output: MarkdownOutput,
        writeChildNode?: ParamWriteChildNode<ChildNode>,
    ) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        writeCoreNode(node, output, writeCoreNode_, writeChildNode!);
    };

    function writeChildNode(node: DeepCoreNode, output: MarkdownOutput): void {
        writeCoreNode(node, output, writeCoreNode_, writeChildNode);
    }

    writeCoreNode(node, output, writeCoreNode_, writeChildNode);
    return output.toString();
}

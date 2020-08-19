import {
    DeepCoreNode,
    Node,
    CoreNode,
    CoreNodeType,
} from './../../nodes/index';
import { MarkdownOutput } from './MarkdownOutput';
import { writeContainerBase } from './ContainerBase';
import { writePlainText } from './PlainText';
import { writeHorizontalRule } from './HorizontalRule';
import { writeHtmlComment } from './HtmlComment';
import { writeBlockQuote } from './BlockQuote';
import { writeHtmlElement } from './HtmlElement';
import { writeItalics } from './Italics';
import { writeBold } from './Bold';
import { writeStrikethrough } from './Strikethrough';
import { writeCodeBlock } from './CodeBlock';
import { writeCodeSpan } from './CodeSpan';
import { writeRichCodeBlock } from './RichCodeBlock';
import { writeLink } from './Link';
import { writeLocalPageLink } from './LocalPageLink';
import { writeGithubSourceLink } from './GithubSourceLink';
import { writeImage } from './Image';
import { writeParagraph } from './Paragraph';
import { writeHeading123456 } from './Heading123456';
import { writeHeading } from './Heading';
import { writeSubheading } from './Subheading';
import { writeTitle } from './Title';
import { writeList } from './List';
import { writeTable } from './Table';
import { writeCollapsibleSection } from './CollapsibleSection';
import { writePageTitle } from './PageTitle';
import { writeTableOfContentsList } from './TableOfContentsList';
import { writeTableOfContents } from './TableOfContents';
import { writeDoNotEditComment } from './DoNotEditComment';
import { writePage } from './Page';

export function writeCoreNode<ChildNode extends Node>(
    node: CoreNode<ChildNode>,
    output: MarkdownOutput,
    writeChildNode: (node: ChildNode, output: MarkdownOutput) => void,
    writeDeepCoreNode: (node: DeepCoreNode, output: MarkdownOutput) => void,
): void {
    switch (node.type) {
        case CoreNodeType.Container: {
            writeContainerBase(node, output, writeChildNode);
            break;
        }
        case CoreNodeType.PlainText: {
            writePlainText(node, output);
            break;
        }
        case CoreNodeType.HorizontalRule: {
            writeHorizontalRule(node, output);
            break;
        }
        case CoreNodeType.HtmlComment: {
            writeHtmlComment(node, output);
            break;
        }
        case CoreNodeType.BlockQuote: {
            writeBlockQuote(node, output, writeChildNode);
            break;
        }
        case CoreNodeType.HtmlElement: {
            writeHtmlElement(node, output, writeChildNode);
            break;
        }
        case CoreNodeType.Italics: {
            writeItalics(node, output, writeChildNode);
            break;
        }
        case CoreNodeType.Bold: {
            writeBold(node, output, writeChildNode);
            break;
        }
        case CoreNodeType.Strikethrough: {
            writeStrikethrough(node, output, writeChildNode);
            break;
        }
        case CoreNodeType.CodeSpan: {
            writeCodeSpan(node, output, writeChildNode);
            break;
        }
        case CoreNodeType.CodeBlock: {
            writeCodeBlock(node, output);
            break;
        }
        case CoreNodeType.RichCodeBlock: {
            writeRichCodeBlock(node, output, writeChildNode);
            break;
        }
        case CoreNodeType.Link: {
            writeLink(node, output, writeChildNode);
            break;
        }
        case CoreNodeType.LocalPageLink: {
            writeLocalPageLink(node, output, writeChildNode);
            break;
        }
        case CoreNodeType.GithubSourceLink: {
            writeGithubSourceLink(node, output, writeChildNode);
            break;
        }
        case CoreNodeType.Image: {
            writeImage(node, output);
            break;
        }
        case CoreNodeType.Paragraph: {
            writeParagraph(node, output, writeChildNode);
            break;
        }
        case CoreNodeType.Heading123456: {
            writeHeading123456(node, output, writeChildNode);
            break;
        }
        case CoreNodeType.Heading: {
            writeHeading(node, output, writeChildNode);
            break;
        }
        case CoreNodeType.Subheading: {
            writeSubheading(node, output, writeChildNode);
            break;
        }
        case CoreNodeType.Title: {
            writeTitle(node, output, writeChildNode);
            break;
        }
        case CoreNodeType.List: {
            writeList(node, output, writeChildNode);
            break;
        }
        case CoreNodeType.Table: {
            writeTable(node, output, writeChildNode);
            break;
        }
        case CoreNodeType.CollapsibleSection: {
            writeCollapsibleSection(
                node,
                output,
                writeChildNode,
                writeChildNode,
            );
            break;
        }
        case CoreNodeType.PageTitle: {
            writePageTitle(node, output, writeChildNode);
            break;
        }
        case CoreNodeType.TableOfContentsList: {
            writeTableOfContentsList(node, output, writeDeepCoreNode);
            break;
        }
        case CoreNodeType.TableOfContents: {
            writeTableOfContents(node, output, writeDeepCoreNode);
            break;
        }
        case CoreNodeType.DoNotEditComment: {
            writeDoNotEditComment(node, output, writeDeepCoreNode);
            break;
        }
        case CoreNodeType.Page: {
            writePage(node, output, writeChildNode, writeDeepCoreNode);
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
}

export function writeDeepCoreNode(
    node: DeepCoreNode,
    output: MarkdownOutput,
): void {
    writeCoreNode(node, output, writeDeepCoreNode, writeDeepCoreNode);
}

export function renderCoreNodeAsMarkdown<ChildNode extends Node>(
    node: CoreNode<ChildNode>,
    writeChildNode: (node: ChildNode, output: MarkdownOutput) => void,
    writeDeepCoreNode: (node: DeepCoreNode, output: MarkdownOutput) => void,
): string {
    const output = new MarkdownOutput();
    writeCoreNode(node, output, writeChildNode, writeDeepCoreNode);
    return output.toString();
}

export function renderDeepCoreNodeAsMarkdown(node: DeepCoreNode): string {
    const output = new MarkdownOutput();
    writeDeepCoreNode(node, output);
    return output.toString();
}

import * as htmlparser2 from 'htmlparser2';
import * as mdast from 'mdast';
import * as definitions from 'mdast-util-definitions';
import * as remarkParse from 'remark-parse';
import * as unified from 'unified';
import { DeepCoreNode } from '..';
import { BlockQuoteNode } from '../BlockQuote';
import { BoldNode } from '../Bold';
import { CodeBlockNode } from '../CodeBlock';
import { CodeSpanNode } from '../CodeSpan';
import { ContainerBase, ContainerNode } from '../Container';
import { HeadingNode } from '../Heading';
import { HorizontalRuleNode } from '../HorizontalRule';
import { HtmlCommentNode } from '../HtmlComment';
import { ImageNode, ImageParameters } from '../Image';
import { ItalicsNode } from '../Italics';
import { LinkNode, LinkParameters } from '../Link';
import { ListNode, ListParameters, ListType } from '../List';
import { ParagraphNode } from '../Paragraph';
import { PlainTextNode } from '../PlainText';
import { StrikethroughNode } from '../Strikethrough';
import { SubheadingNode } from '../Subheading';
import { TableNode, TableRow } from '../Table';
import { TitleNode } from '../Title';

const remark = unified().use(remarkParse);

export function parseMarkdown(
    text: string,
    opt?: {
        unwrapFirstLineParagraph?: boolean;
    },
): ContainerNode<DeepCoreNode> {
    const rootNode = remark.parse(text) as mdast.Root;
    const definition = definitions(rootNode);

    let htmlParserContainer: ContainerBase<DeepCoreNode>;
    const htmlParser = new htmlparser2.Parser({
        onerror(error): void {
            throw error;
        },
        onopentag(tagName, attributes): void {
            tagName;
            attributes;
            // TODO.
            throw new Error('Unexpected html tag.');
        },
        onclosetag(tagName): void {
            tagName;
            // TODO.
        },
        ontext(text: string): void {
            text;
            // TODO.
            throw new Error('Unexpected html text.');
        },
        oncomment(comment: string): void {
            htmlParserContainer.children.push(HtmlCommentNode({ comment }));
        },
        oncdatastart(): void {
            throw new Error('Unexpected CDATA.');
        },
        onprocessinginstruction(): void {
            throw new Error('Unexpected processing instruction.');
        },
    });

    // https://github.com/syntax-tree/mdast
    function traverseNode(
        container: ContainerBase<DeepCoreNode>,
        node: mdast.Content,
    ): void {
        switch (node.type) {
            case 'paragraph': {
                if (!node.position) {
                    throw new Error('No.');
                }
                if (
                    opt?.unwrapFirstLineParagraph &&
                    node.position.start.column === 1 &&
                    node.position.start.line === 1
                ) {
                    traverseChildren(container, node);
                    break;
                }
                const paragraph = ParagraphNode<DeepCoreNode>({});
                container.children.push(paragraph);
                traverseChildren(paragraph, node);
                break;
            }
            case 'heading': {
                let heading: DeepCoreNode;
                switch (node.depth) {
                    case 2: {
                        heading = HeadingNode<DeepCoreNode>({});
                        break;
                    }
                    case 3: {
                        heading = SubheadingNode<DeepCoreNode>({});
                        break;
                    }
                    case 4: {
                        heading = TitleNode<DeepCoreNode>({});
                        break;
                    }
                    default: {
                        throw new Error(
                            `Unsupported heading depth: ${node.depth}.`,
                        );
                    }
                }
                container.children.push(heading);
                traverseChildren(heading, node);
                break;
            }
            case 'thematicBreak': {
                container.children.push(HorizontalRuleNode({}));
                break;
            }
            case 'blockquote': {
                const blockQuote = BlockQuoteNode<DeepCoreNode>({});
                container.children.push(blockQuote);
                traverseChildren(blockQuote, node);
                break;
            }
            case 'listItem': {
                throw new Error('Unexpected list item node.');
            }
            case 'list': {
                const parameters: ListParameters<DeepCoreNode> = node.ordered
                    ? {
                          listType: ListType.Ordered,
                          start: node.start ?? undefined,
                      }
                    : {
                          listType: ListType.Unordered,
                      };
                const list = ListNode<DeepCoreNode>(parameters);
                container.children.push(list);
                for (const childNode of node.children) {
                    const container = ContainerNode<DeepCoreNode>({});
                    list.children.push(container);
                    if (childNode.type === 'listItem') {
                        if (childNode.checked !== null) {
                            throw new Error(
                                `Unsupported list item type. ${JSON.stringify(
                                    node,
                                    null,
                                    2,
                                )}`,
                            );
                        }
                        traverseChildren(container, childNode);
                        continue;
                    }
                    traverseNode(container, childNode);
                }
                break;
            }
            case 'table': {
                // TODO: support different align types.
                if (node.align && node.align.some((item) => item !== null)) {
                    throw new Error('Unsupported table align.');
                }
                if (node.children.length === 0) {
                    throw new Error('Table has no rows.');
                }
                const header = parseTableRow(node.children[0]);
                const table = TableNode<DeepCoreNode, DeepCoreNode>({
                    header,
                    rows: node.children.slice(1).map(parseTableRow),
                });
                container.children.push(table);
                break;
            }
            case 'tableRow': {
                throw new Error('Unexpected table row.');
            }
            case 'tableCell': {
                throw new Error('Unexpected table cell.');
            }
            case 'html': {
                htmlParserContainer = container;
                htmlParser.write(node.value);
                break;
            }
            case 'code': {
                if (node.meta !== null) {
                    throw new Error('Invalid code block.');
                }
                const codeBlock = CodeBlockNode({
                    language: node.lang,
                    code: node.value,
                });
                container.children.push(codeBlock);
                break;
            }
            case 'definition': {
                // Don't output.
                break;
            }
            case 'footnoteDefinition': {
                throw new Error('Footnote definitions are not supported.');
            }
            case 'text': {
                container.children.push(PlainTextNode({ text: node.value }));
                break;
            }
            case 'emphasis': {
                const italics = ItalicsNode<DeepCoreNode>({});
                container.children.push(italics);
                traverseChildren(italics, node);
                break;
            }
            case 'strong': {
                const bold = BoldNode<DeepCoreNode>({});
                container.children.push(bold);
                traverseChildren(bold, node);
                break;
            }
            case 'delete': {
                const strikethrough = StrikethroughNode<DeepCoreNode>({});
                container.children.push(strikethrough);
                traverseChildren(strikethrough, node);
                break;
            }
            case 'inlineCode': {
                const inlineCode = CodeSpanNode<PlainTextNode>({
                    children: [PlainTextNode({ text: node.value })],
                });
                container.children.push(inlineCode);
                break;
            }
            case 'break': {
                throw new Error(
                    'Markdown breaks are not supported. Trailing spaces representing line breaks is unpleasant.',
                );
            }
            case 'link': {
                const parameters: LinkParameters<DeepCoreNode> = {
                    destination: node.url,
                };
                if (node.title !== undefined) {
                    parameters.title = node.title;
                }
                const link = LinkNode<DeepCoreNode>(parameters);
                container.children.push(link);
                traverseChildren(link, node);
                break;
            }
            case 'image': {
                const parameters: ImageParameters = { src: node.url };
                if (node.title !== undefined) {
                    parameters.title = node.title;
                }
                if (node.alt !== undefined) {
                    parameters.alt = node.alt;
                }
                const image = ImageNode(parameters);
                container.children.push(image);
                break;
            }
            case 'linkReference': {
                const definitionNode = definition(node.identifier);
                if (!definitionNode) {
                    throw new Error(
                        `No definition found for identifier ${node.identifier}`,
                    );
                }
                const parameters: LinkParameters<DeepCoreNode> = {
                    destination: definitionNode.url,
                };
                if (definitionNode.title !== undefined) {
                    parameters.title = definitionNode.title;
                }
                const link = LinkNode<DeepCoreNode>(parameters);
                container.children.push(link);
                if (node.children.length > 0) {
                    traverseChildren(link, node);
                } else {
                    link.children.push(
                        PlainTextNode({
                            text:
                                node.label ||
                                definitionNode.label ||
                                node.identifier,
                        }),
                    );
                }
                break;
            }
            case 'imageReference': {
                const definitionNode = definition(node.identifier);
                if (!definitionNode) {
                    throw new Error(
                        `No definition found for identifier ${node.identifier}`,
                    );
                }
                const parameters: ImageParameters = { src: definitionNode.url };
                if (definitionNode.title !== undefined) {
                    parameters.title = definitionNode.title;
                }
                if (node.alt !== undefined) {
                    parameters.alt = node.alt;
                }
                const image = ImageNode(parameters);
                container.children.push(image);
                break;
            }
            case 'footnoteReference': {
                throw new Error('Footnote references are not supported.');
            }
            case 'footnote': {
                // TODO: support footnotes.
                throw new Error('Footnotes are not supported.');
            }
            case 'yaml': {
                throw new Error('Unexpected YAML.');
            }
            default: {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error Should already implement all node types.
                // eslint-disable-next-line max-len
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                console.error(`Unknown node type ${node.type}`);
                console.dir(node);
            }
        }
    }

    function parseTableRow(node: mdast.TableRow): TableRow<DeepCoreNode> {
        const row = TableRow<DeepCoreNode>({});
        // Loop over cells.
        for (const childNode of node.children) {
            const container = ContainerNode<DeepCoreNode>({});
            row.children.push(container);
            traverseChildren(container, childNode);
        }
        return row;
    }

    function traverseChildren(
        container: ContainerBase<DeepCoreNode>,
        parent: mdast.Parent,
    ): void {
        for (const node of parent.children) {
            traverseNode(container, node);
        }
    }

    const container = ContainerNode<DeepCoreNode>({});
    traverseChildren(container, rootNode);
    return container;
}

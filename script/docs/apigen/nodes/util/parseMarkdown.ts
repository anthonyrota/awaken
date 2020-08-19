import { ImageParameters, Image } from '../Image';
import { Link, LinkParameters } from '../Link';
import { CodeSpan } from '../CodeSpan';
import { Strikethrough } from '../Strikethrough';
import { Bold } from '../Bold';
import { Italics } from '../Italics';
import { CodeBlock } from '../CodeBlock';
import { Table, TableRow, addTableRow } from '../Table';
import { List, ListParameters } from '../List';
import { HorizontalRule } from '../HorizontalRule';
import { BlockQuote } from '../BlockQuote';
import { Title } from '../Title';
import { Subheading } from '../Subheading';
import { Heading } from '../Heading';
import { Paragraph } from '../Paragraph';
import { HtmlComment } from '../HtmlComment';
import {
    ContainerBase,
    addChildren,
    addChildrenC,
} from '../abstract/ContainerBase';
import * as unified from 'unified';
import * as remarkParse from 'remark-parse';
import * as mdast from 'mdast';
import * as definitions from 'mdast-util-definitions';
import * as htmlparser2 from 'htmlparser2';
import { Container } from '../Container';

import { DeepCoreNode } from '..';
import { PlainText } from '../PlainText';

const remark = unified().use(remarkParse);

export function parseMarkdown(
    text: string,
    opt?: {
        unwrapFirstLineParagraph?: boolean;
    },
): Container<DeepCoreNode> {
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
            addChildren(htmlParserContainer, HtmlComment({ comment }));
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
                const paragraph = Paragraph<DeepCoreNode>();
                addChildren(container, paragraph);
                traverseChildren(paragraph, node);
                break;
            }
            case 'heading': {
                let heading: DeepCoreNode;
                switch (node.depth) {
                    case 2: {
                        heading = Heading<DeepCoreNode>({});
                        break;
                    }
                    case 3: {
                        heading = Subheading<DeepCoreNode>({});
                        break;
                    }
                    case 4: {
                        heading = Title<DeepCoreNode>({});
                        break;
                    }
                    default: {
                        throw new Error(
                            `Unsupported heading depth: ${node.depth}.`,
                        );
                    }
                }
                addChildren(container, heading);
                traverseChildren(heading, node);
                break;
            }
            case 'thematicBreak': {
                addChildren(container, HorizontalRule());
                break;
            }
            case 'blockquote': {
                const blockQuote = BlockQuote<DeepCoreNode>();
                addChildren(container, blockQuote);
                traverseChildren(blockQuote, node);
                break;
            }
            case 'listItem': {
                throw new Error('Unexpected list item node.');
            }
            case 'list': {
                const parameters: ListParameters = {};
                if (node.ordered) {
                    parameters.ordered = {};
                    if (node.start != null) {
                        parameters.ordered.start = node.start;
                    }
                }
                const list = List<DeepCoreNode>(parameters);
                addChildren(container, list);
                for (const childNode of node.children) {
                    const container = Container<DeepCoreNode>();
                    addChildren(list, container);
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
                const table = Table<DeepCoreNode, DeepCoreNode>({ header });
                for (const child of node.children.slice(1)) {
                    addTableRow(table, parseTableRow(child));
                }
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
                const codeBlock = CodeBlock({
                    language: node.lang,
                    code: node.value,
                });
                addChildren(container, codeBlock);
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
                addChildren(container, PlainText({ text: node.value }));
                break;
            }
            case 'emphasis': {
                const italics = Italics<DeepCoreNode>();
                addChildren(container, italics);
                traverseChildren(italics, node);
                break;
            }
            case 'strong': {
                const bold = Bold<DeepCoreNode>();
                addChildren(container, bold);
                traverseChildren(bold, node);
                break;
            }
            case 'delete': {
                const strikethrough = Strikethrough<DeepCoreNode>();
                addChildren(container, strikethrough);
                traverseChildren(strikethrough, node);
                break;
            }
            case 'inlineCode': {
                const inlineCode = addChildrenC(
                    CodeSpan<PlainText>(),
                    PlainText({ text: node.value }),
                );
                addChildren(container, inlineCode);
                break;
            }
            case 'break': {
                throw new Error(
                    'Markdown breaks are not supported. Trailing spaces representing line breaks is unpleasant.',
                );
            }
            case 'link': {
                const parameters: LinkParameters = { destination: node.url };
                if (node.title !== undefined) {
                    parameters.title = node.title;
                }
                const link = Link<DeepCoreNode>(parameters);
                addChildren(container, link);
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
                const image = Image(parameters);
                addChildren(container, image);
                break;
            }
            case 'linkReference': {
                const definitionNode = definition(node.identifier);
                if (!definitionNode) {
                    throw new Error(
                        `No definition found for identifier ${node.identifier}`,
                    );
                }
                const parameters: LinkParameters = {
                    destination: definitionNode.url,
                };
                if (definitionNode.title !== undefined) {
                    parameters.title = definitionNode.title;
                }
                const link = Link<DeepCoreNode>(parameters);
                addChildren(container, link);
                if (node.children.length > 0) {
                    traverseChildren(link, node);
                } else {
                    addChildren(
                        link,
                        PlainText({
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
                const image = Image(parameters);
                addChildren(container, image);
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
        const row = TableRow<DeepCoreNode>();
        // Loop over cells.
        for (const childNode of node.children) {
            const container = Container<DeepCoreNode>();
            addChildren(row, container);
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

    const container = Container<DeepCoreNode>();
    traverseChildren(container, rootNode);
    return container;
}

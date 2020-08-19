import { Page } from './Page';
import { DoNotEditComment } from './DoNotEditComment';
import { TableOfContents } from './TableOfContents';
import { TableOfContentsList } from './TableOfContentsList';
import { PageTitle } from './PageTitle';
import { CollapsibleSection } from './CollapsibleSection';
import { Table } from './Table';
import { List } from './List';
import { Title } from './Title';
import { Subheading } from './Subheading';
import { Heading } from './Heading';
import { Heading123456 } from './Heading123456';
import { Paragraph } from './Paragraph';
import { Image } from './Image';
import { GithubSourceLink } from './GithubSourceLink';
import { LocalPageLink } from './LocalPageLink';
import { Link } from './Link';
import { RichCodeBlock } from './RichCodeBlock';
import { CodeBlock } from './CodeBlock';
import { CodeSpan } from './CodeSpan';
import { Strikethrough } from './Strikethrough';
import { Bold } from './Bold';
import { Italics } from './Italics';
import { HtmlElement } from './HtmlElement';
import { BlockQuote } from './BlockQuote';
import { HtmlComment } from './HtmlComment';
import { HorizontalRule } from './HorizontalRule';
import { PlainText } from './PlainText';
import { Container } from './Container';

export interface Node {
    type: string;
}

export type CoreNode<ChildType extends Node> =
    | Container<ChildType>
    | PlainText
    | HorizontalRule
    | HtmlComment
    | BlockQuote<ChildType>
    | HtmlElement<ChildType>
    | Italics<ChildType>
    | Bold<ChildType>
    | Strikethrough<ChildType>
    | CodeSpan<ChildType>
    | CodeBlock
    | RichCodeBlock<ChildType>
    | Link<ChildType>
    | LocalPageLink<ChildType>
    | GithubSourceLink<ChildType>
    | Image
    | Paragraph<ChildType>
    | Heading123456<ChildType>
    | Heading<ChildType>
    | Subheading<ChildType>
    | Title<ChildType>
    | List<ChildType>
    | Table<ChildType, ChildType>
    | CollapsibleSection<ChildType, ChildType>
    | PageTitle<ChildType>
    | TableOfContentsList
    | TableOfContents
    | DoNotEditComment
    | Page<ChildType>;

export type DeepCoreNode =
    | Container<DeepCoreNode>
    | PlainText
    | HorizontalRule
    | HtmlComment
    | BlockQuote<DeepCoreNode>
    | HtmlElement<DeepCoreNode>
    | Italics<DeepCoreNode>
    | Bold<DeepCoreNode>
    | Strikethrough<DeepCoreNode>
    | CodeSpan<DeepCoreNode>
    | CodeBlock
    | RichCodeBlock<DeepCoreNode>
    | Link<DeepCoreNode>
    | LocalPageLink<DeepCoreNode>
    | GithubSourceLink<DeepCoreNode>
    | Image
    | Paragraph<DeepCoreNode>
    | Heading123456<DeepCoreNode>
    | Heading<DeepCoreNode>
    | Subheading<DeepCoreNode>
    | Title<DeepCoreNode>
    | List<DeepCoreNode>
    | Table<DeepCoreNode, DeepCoreNode>
    | CollapsibleSection<DeepCoreNode, DeepCoreNode>
    | PageTitle<DeepCoreNode>
    | TableOfContentsList
    | TableOfContents
    | DoNotEditComment
    | Page<DeepCoreNode>;

export enum CoreNodeType {
    Container = 'core/Container',
    PlainText = 'core/PlainText',
    HorizontalRule = 'core/HorizontalRule',
    HtmlComment = 'core/HtmlComment',
    HtmlElement = 'core/HtmlElement',
    BlockQuote = 'core/BlockQuote',
    Italics = 'core/Italics',
    Bold = 'core/Bold',
    Strikethrough = 'core/Strikethrough',
    CodeSpan = 'core/CodeSpan',
    CodeBlock = 'core/CodeBlock',
    RichCodeBlock = 'core/RichCodeBlock',
    Link = 'core/Link',
    LocalPageLink = 'core/LocalPageLink',
    GithubSourceLink = 'core/GithubSourceLink',
    Image = 'core/Image',
    Paragraph = 'core/Paragraph',
    Heading123456 = 'core/Heading123456',
    Heading = 'core/Heading',
    Subheading = 'core/Subheading',
    Title = 'core/Title',
    List = 'core/List',
    Table = 'core/Table',
    CollapsibleSection = 'core/CollapsibleSection',
    PageTitle = 'core/PageTitle',
    TableOfContentsList = 'core/TableOfContentsList',
    TableOfContents = 'core/TableOfContents',
    DoNotEditComment = 'core/DoNotEditComment',
    Page = 'core/Page',
}

import { BlockQuoteNode } from './BlockQuote';
import { BoldNode } from './Bold';
import { CodeBlockNode } from './CodeBlock';
import { CodeSpanNode } from './CodeSpan';
import { CollapsibleSectionNode } from './CollapsibleSection';
import { ContainerNode } from './Container';
import { DoNotEditCommentNode } from './DoNotEditComment';
import { GithubSourceLinkNode } from './GithubSourceLink';
import { HeadingNode } from './Heading';
import { Heading123456Node } from './Heading123456';
import { HorizontalRuleNode } from './HorizontalRule';
import { HtmlCommentNode } from './HtmlComment';
import { HtmlElementNode } from './HtmlElement';
import { ImageNode } from './Image';
import { ItalicsNode } from './Italics';
import { LinkNode } from './Link';
import { ListNode } from './List';
import { LocalPageLinkNode } from './LocalPageLink';
import { PageNode } from './Page';
import { PageTitleNode } from './PageTitle';
import { ParagraphNode } from './Paragraph';
import { PlainTextNode } from './PlainText';
import { RichCodeBlockNode } from './RichCodeBlock';
import { StrikethroughNode } from './Strikethrough';
import { SubheadingNode } from './Subheading';
import { TableNode } from './Table';
import { TableOfContentsNode } from './TableOfContents';
import { TableOfContentsListNode } from './TableOfContentsList';
import { TitleNode } from './Title';

export interface Node {
    type: string;
}

export type LeafCoreNode =
    | PlainTextNode
    | HorizontalRuleNode
    | HtmlCommentNode
    | CodeBlockNode
    | ImageNode
    | TableOfContentsListNode
    | TableOfContentsNode
    | DoNotEditCommentNode;

export type ParentCoreNode<ChildType extends Node> =
    | ContainerNode<ChildType>
    | BlockQuoteNode<ChildType>
    | HtmlElementNode<ChildType>
    | ItalicsNode<ChildType>
    | BoldNode<ChildType>
    | StrikethroughNode<ChildType>
    | CodeSpanNode<ChildType>
    | RichCodeBlockNode<ChildType>
    | LinkNode<ChildType>
    | LocalPageLinkNode<ChildType>
    | GithubSourceLinkNode<ChildType>
    | ParagraphNode<ChildType>
    | Heading123456Node<ChildType>
    | HeadingNode<ChildType>
    | SubheadingNode<ChildType>
    | TitleNode<ChildType>
    | ListNode<ChildType>
    | TableNode<ChildType, ChildType>
    | CollapsibleSectionNode<ChildType, ChildType>
    | PageTitleNode<ChildType>
    | PageNode<ChildType>;

export type CoreNode<ChildType extends Node> =
    | LeafCoreNode
    | ParentCoreNode<ChildType>;

export type DeepCoreNode =
    | LeafCoreNode
    | ContainerNode<DeepCoreNode>
    | BlockQuoteNode<DeepCoreNode>
    | HtmlElementNode<DeepCoreNode>
    | ItalicsNode<DeepCoreNode>
    | BoldNode<DeepCoreNode>
    | StrikethroughNode<DeepCoreNode>
    | CodeSpanNode<DeepCoreNode>
    | RichCodeBlockNode<DeepCoreNode>
    | LinkNode<DeepCoreNode>
    | LocalPageLinkNode<DeepCoreNode>
    | GithubSourceLinkNode<DeepCoreNode>
    | ParagraphNode<DeepCoreNode>
    | Heading123456Node<DeepCoreNode>
    | HeadingNode<DeepCoreNode>
    | SubheadingNode<DeepCoreNode>
    | TitleNode<DeepCoreNode>
    | ListNode<DeepCoreNode>
    | TableNode<DeepCoreNode, DeepCoreNode>
    | CollapsibleSectionNode<DeepCoreNode, DeepCoreNode>
    | PageTitleNode<DeepCoreNode>
    | PageNode<DeepCoreNode>;

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

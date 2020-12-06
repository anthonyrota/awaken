import { BlockQuoteNode } from './BlockQuote';
import { BoldNode } from './Bold';
import { CodeBlockNode } from './CodeBlock';
import { CodeSpanNode } from './CodeSpan';
import { CollapsibleSectionNode } from './CollapsibleSection';
import { ContainerNode } from './Container';
import { DocPageLinkNode } from './DocPageLink';
import { GithubSourceLinkNode } from './GithubSourceLink';
import { HeadingNode } from './Heading';
import { Heading123456Node } from './Heading123456';
import { HorizontalRuleNode } from './HorizontalRule';
import { HtmlElementNode } from './HtmlElement';
import { ImageNode } from './Image';
import { ItalicsNode } from './Italics';
import { LineBreakNode } from './LineBreak';
import { LinkNode } from './Link';
import { ListNode } from './List';
import { NamedAnchorNode } from './NamedAnchor';
import { PageNode } from './Page';
import { PageTitleNode } from './PageTitle';
import { ParagraphNode } from './Paragraph';
import { PlainTextNode } from './PlainText';
import { StrikethroughNode } from './Strikethrough';
import { SubheadingNode } from './Subheading';
import { SubscriptNode } from './Subscript';
import { SuperscriptNode } from './Superscript';
import { TableNode } from './Table';
import { TitleNode } from './Title';

export interface Node {
    type: string;
}

export type LeafCoreNode =
    | PlainTextNode
    | HorizontalRuleNode
    | CodeBlockNode
    | ImageNode
    | NamedAnchorNode
    | LineBreakNode;

export type ContainerCoreNode<ChildType extends Node> =
    | ContainerNode<ChildType>
    | BlockQuoteNode<ChildType>
    | HtmlElementNode<ChildType>
    | ItalicsNode<ChildType>
    | BoldNode<ChildType>
    | StrikethroughNode<ChildType>
    | CodeSpanNode<ChildType>
    | LinkNode<ChildType>
    | DocPageLinkNode<ChildType>
    | GithubSourceLinkNode<ChildType>
    | ParagraphNode<ChildType>
    | Heading123456Node<ChildType>
    | HeadingNode<ChildType>
    | SubheadingNode<ChildType>
    | TitleNode<ChildType>
    | ListNode<ChildType>
    | CollapsibleSectionNode<ChildType, ChildType>
    | SubscriptNode<ChildType>
    | SuperscriptNode<ChildType>
    | PageTitleNode<ChildType>
    | PageNode<ChildType>;

export type ParentCoreNode<ChildType extends Node> =
    | ContainerCoreNode<ChildType>
    | TableNode<ChildType, ChildType>;

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
    | LinkNode<DeepCoreNode>
    | DocPageLinkNode<DeepCoreNode>
    | GithubSourceLinkNode<DeepCoreNode>
    | ParagraphNode<DeepCoreNode>
    | Heading123456Node<DeepCoreNode>
    | HeadingNode<DeepCoreNode>
    | SubheadingNode<DeepCoreNode>
    | TitleNode<DeepCoreNode>
    | ListNode<DeepCoreNode>
    | TableNode<DeepCoreNode, DeepCoreNode>
    | CollapsibleSectionNode<DeepCoreNode, DeepCoreNode>
    | SubscriptNode<DeepCoreNode>
    | SuperscriptNode<DeepCoreNode>
    | PageTitleNode<DeepCoreNode>
    | PageNode<DeepCoreNode>;

export enum CoreNodeType {
    Container = 'core/Container',
    PlainText = 'core/PlainText',
    HorizontalRule = 'core/HorizontalRule',
    HtmlElement = 'core/HtmlElement',
    BlockQuote = 'core/BlockQuote',
    Italics = 'core/Italics',
    Bold = 'core/Bold',
    Strikethrough = 'core/Strikethrough',
    CodeSpan = 'core/CodeSpan',
    CodeBlock = 'core/CodeBlock',
    Link = 'core/Link',
    DocPageLink = 'core/DocPageLink',
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
    NamedAnchor = 'core/NamedAnchor',
    Subscript = 'core/Subscript',
    Superscript = 'core/Superscript',
    LineBreak = 'core/LineBreak',
    PageTitle = 'core/PageTitle',
    Page = 'core/Page',
}

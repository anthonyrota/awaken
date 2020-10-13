import { SubscriptNode } from 'script/docs/core/nodes/Subscript';
import { Node, LeafCoreNode, ParentCoreNode } from '../../../nodes';
import { BlockQuoteNode } from '../../../nodes/BlockQuote';
import { BoldNode } from '../../../nodes/Bold';
import { CodeSpanNode } from '../../../nodes/CodeSpan';
import { CollapsibleSectionNode } from '../../../nodes/CollapsibleSection';
import { ContainerNode } from '../../../nodes/Container';
import { DocPageLinkNode } from '../../../nodes/DocPageLink';
import { GithubSourceLinkNode } from '../../../nodes/GithubSourceLink';
import { HeadingNode } from '../../../nodes/Heading';
import { Heading123456Node } from '../../../nodes/Heading123456';
import { HtmlElementNode } from '../../../nodes/HtmlElement';
import { ItalicsNode } from '../../../nodes/Italics';
import { LinkNode } from '../../../nodes/Link';
import { ListNode } from '../../../nodes/List';
import { NamedAnchorNode } from '../../../nodes/NamedAnchor';
import { PageNode } from '../../../nodes/Page';
import { PageTitleNode } from '../../../nodes/PageTitle';
import { ParagraphNode } from '../../../nodes/Paragraph';
import { RichCodeBlockNode } from '../../../nodes/RichCodeBlock';
import { StrikethroughNode } from '../../../nodes/Strikethrough';
import { SubheadingNode } from '../../../nodes/Subheading';
import { SuperscriptNode } from '../../../nodes/Superscript';
import { TableNode } from '../../../nodes/Table';
import { TitleNode } from '../../../nodes/Title';
import { DoNotEditCommentNode } from './DoNotEditComment';
import { FunctionalNode } from './FunctionalNode';
import { HtmlCommentNode } from './HtmlComment';
import { TableOfContentsNode } from './TableOfContents';
import { TableOfContentsListNode } from './TableOfContentsList';

export type LeafRenderMarkdownNode =
    | LeafCoreNode
    | FunctionalNode
    | DoNotEditCommentNode
    | HtmlCommentNode
    | TableOfContentsNode
    | TableOfContentsListNode
    | NamedAnchorNode;

export type ParentRenderMarkdownNode<ChildType extends Node> = ParentCoreNode<
    ChildType
>;

export type RenderMarkdownNode<ChildType extends Node> =
    | LeafRenderMarkdownNode
    | ParentRenderMarkdownNode<ChildType>;

export type DeepRenderMarkdownNode =
    | LeafRenderMarkdownNode
    | ContainerNode<DeepRenderMarkdownNode>
    | BlockQuoteNode<DeepRenderMarkdownNode>
    | HtmlElementNode<DeepRenderMarkdownNode>
    | ItalicsNode<DeepRenderMarkdownNode>
    | BoldNode<DeepRenderMarkdownNode>
    | StrikethroughNode<DeepRenderMarkdownNode>
    | CodeSpanNode<DeepRenderMarkdownNode>
    | RichCodeBlockNode<DeepRenderMarkdownNode>
    | LinkNode<DeepRenderMarkdownNode>
    | DocPageLinkNode<DeepRenderMarkdownNode>
    | GithubSourceLinkNode<DeepRenderMarkdownNode>
    | ParagraphNode<DeepRenderMarkdownNode>
    | Heading123456Node<DeepRenderMarkdownNode>
    | HeadingNode<DeepRenderMarkdownNode>
    | SubheadingNode<DeepRenderMarkdownNode>
    | TitleNode<DeepRenderMarkdownNode>
    | ListNode<DeepRenderMarkdownNode>
    | TableNode<DeepRenderMarkdownNode, DeepRenderMarkdownNode>
    | CollapsibleSectionNode<DeepRenderMarkdownNode, DeepRenderMarkdownNode>
    | SubscriptNode<DeepRenderMarkdownNode>
    | SuperscriptNode<DeepRenderMarkdownNode>
    | PageTitleNode<DeepRenderMarkdownNode>
    | PageNode<DeepRenderMarkdownNode>;

export enum RenderMarkdownNodeType {
    FunctionalNode = 'core/render/markdown/FunctionalNode',
    DoNotEditComment = 'core/render/markdown/DoNotEditComment',
    HtmlComment = 'core/render/markdown/HtmlComment',
    TableOfContents = 'core/render/markdown/TableOfContents',
    TableOfContentsList = 'core/render/markdown/TableOfContentsList',
}

import { Fragment, h, VNode } from 'preact';
import { useRef } from 'preact/hooks';
import { DeepCoreNode, CoreNodeType } from '../../script/docs/core/nodes';
import { ListType } from '../../script/docs/core/nodes/List';
import { getGithubUrl, getPagesMetadata } from '../data/docPages';
import { customHistory } from '../hooks/useHistory';
import { DocPageLink } from './DocPageLink';
import { Link } from './Link';

const linkClass = 'cls-node-link';

function relativeToRootPath(relativePath: string): string {
    const currentPath = customHistory.location.pathname;
    if (relativePath[0] === '/') {
        return '/';
    }
    if (relativePath[0] === '.' && relativePath[1] === '/') {
        return (
            currentPath.replace(/\/+$/, '') +
            relativePath.slice(relativePath.slice(1).search(/[^/]/))
        );
    }
    if (
        relativePath[0] === '.' &&
        relativePath[1] === '.' &&
        relativePath[2] === '/'
    ) {
        return (
            '/' +
            currentPath.replace(/\/+[^/]*\/*$/, '') +
            relativePath.slice(relativePath.slice(2).search(/[^/]/))
        );
    }
    return currentPath + '/' + relativePath;
}

const mapChildren = (
    children: DeepCoreNode[],
    pagePath: string,
    headingRefs: { current: HTMLHeadingElement }[] | undefined,
): VNode[] =>
    children.map((childNode) => (
        <DeepCoreNodeComponent
            node={childNode}
            pagePath={pagePath}
            headingRefs={headingRefs}
        />
    ));

export interface DeepCoreNodeComponentProps {
    node: DeepCoreNode;
    pagePath: string;
    headingRefs?: { current: HTMLHeadingElement }[];
}

export function DeepCoreNodeComponent({
    node,
    pagePath,
    headingRefs,
}: DeepCoreNodeComponentProps): VNode {
    switch (node.type) {
        case CoreNodeType.Container: {
            return (
                <Fragment>
                    {mapChildren(node.children, pagePath, headingRefs)}
                </Fragment>
            );
        }
        case CoreNodeType.PlainText: {
            return <Fragment>{node.text}</Fragment>;
        }
        case CoreNodeType.HorizontalRule: {
            throw new Error();
        }
        case CoreNodeType.BlockQuote: {
            return (
                <blockquote class="cls-node-blockquote">
                    {mapChildren(node.children, pagePath, headingRefs)}
                </blockquote>
            );
        }
        case CoreNodeType.HtmlElement: {
            throw new Error();
        }
        case CoreNodeType.Italics: {
            return (
                <i class="cls-node-italics">
                    {mapChildren(node.children, pagePath, headingRefs)}
                </i>
            );
        }
        case CoreNodeType.Bold: {
            return (
                <b class="cls-node-bold">
                    {mapChildren(node.children, pagePath, headingRefs)}
                </b>
            );
        }
        case CoreNodeType.Strikethrough: {
            return (
                <del class="cls-node-strikethrough">
                    {mapChildren(node.children, pagePath, headingRefs)}
                </del>
            );
        }
        case CoreNodeType.CodeSpan: {
            return (
                <span class="cls-node-code-span">
                    {mapChildren(node.children, pagePath, headingRefs)}
                </span>
            );
        }
        case CoreNodeType.CodeBlock: {
            const {
                foreground,
                background,
            } = getPagesMetadata().codeBlockStyle;
            const { code, tokenizedLines, codeLinks } = node;
            const ChildNodeType$Text = 1;
            const ChildNodeType$Link = 0;
            interface ChildText {
                type: typeof ChildNodeType$Text;
                text: string;
                style: preact.JSX.HTMLAttributes<HTMLSpanElement>['style'];
            }
            interface ChildLink {
                type: typeof ChildNodeType$Link;
                pageId: string;
                hash?: string;
                children: ChildText[];
            }
            type ChildNode = ChildText | ChildLink;
            const childNodes: ChildNode[] = [];
            if (tokenizedLines) {
                tokenizedLines.lines.forEach((line, lineIndex) => {
                    line.tokens.forEach((token, tokenIndex) => {
                        childNodes.push({
                            type: ChildNodeType$Text,
                            text: code.slice(
                                line.startIndex + token.startIndex,
                                tokenIndex === line.tokens.length - 1
                                    ? lineIndex ===
                                      tokenizedLines.lines.length - 1
                                        ? code.length
                                        : tokenizedLines.lines[lineIndex + 1]
                                              .startIndex
                                    : line.startIndex +
                                          line.tokens[tokenIndex + 1]
                                              .startIndex,
                            ),
                            style: {
                                color:
                                    token.color === undefined
                                        ? foreground
                                        : token.color,
                                fontStyle: (token.isItalic
                                    ? 'italic'
                                    : undefined) as string,
                                fontWeight: (token.isBold
                                    ? 'bold'
                                    : undefined) as string,
                                textDecoration: (token.isUnderline
                                    ? 'underline'
                                    : undefined) as string,
                            },
                        });
                    });
                });
            } else {
                childNodes.push({
                    type: ChildNodeType$Text,
                    text: code,
                    style: {
                        color: foreground,
                    },
                });
            }
            const getChildNodeLength = (childNode: ChildNode) => {
                if (childNode.type === ChildNodeType$Link) {
                    let childNodeLength = 0;
                    childNode.children.forEach((textNode) => {
                        childNodeLength += textNode.text.length;
                    });
                    return childNodeLength;
                }
                return childNode.text.length;
            };
            if (codeLinks) {
                codeLinks.forEach(({ startIndex, endIndex, pageId, hash }) => {
                    let i = 0;
                    let codePos = 0;
                    while (true) {
                        const childNodeLength = getChildNodeLength(
                            childNodes[i],
                        );
                        if (codePos + childNodeLength > startIndex) {
                            break;
                        }
                        codePos += childNodeLength;
                        i++;
                    }
                    const linkChildren: ChildText[] = [];
                    const startNode = childNodes[i] as ChildText;
                    childNodes.splice(i + 1, 0, {
                        type: ChildNodeType$Link,
                        children: linkChildren,
                        pageId,
                        hash,
                    });
                    if (codePos === startIndex) {
                        childNodes.splice(i, 1);
                    } else {
                        childNodes[i] = {
                            type: ChildNodeType$Text,
                            style: startNode.style,
                            text: startNode.text.slice(0, startIndex - codePos),
                        };
                        i++;
                    }
                    i++;
                    linkChildren.push({
                        type: ChildNodeType$Text,
                        style: startNode.style,
                        text: startNode.text.slice(
                            startIndex - codePos,
                            endIndex - codePos,
                        ),
                    });
                    if (endIndex <= codePos + startNode.text.length) {
                        const endText = startNode.text.slice(
                            endIndex - codePos,
                        );
                        if (endText) {
                            childNodes.splice(i, 0, {
                                type: ChildNodeType$Text,
                                style: startNode.style,
                                text: endText,
                            });
                        }
                        return;
                    }
                    codePos += getChildNodeLength(startNode);
                    while (true) {
                        const childNode = childNodes[i];
                        const childNodeLength = getChildNodeLength(childNode);
                        if (codePos + childNodeLength > endIndex) {
                            break;
                        }
                        childNodes.splice(i, 1);
                        linkChildren.push(childNode as ChildText);
                        codePos += childNodeLength;
                    }
                    const endNode = childNodes[i] as ChildText;
                    if (codePos === endIndex) {
                        return;
                    }
                    linkChildren.push({
                        type: ChildNodeType$Text,
                        style: endNode.style,
                        text: endNode.text.slice(0, endIndex - codePos),
                    });
                    childNodes.splice(i, 1, {
                        type: ChildNodeType$Text,
                        style: endNode.style,
                        text: endNode.text.slice(endIndex - codePos),
                    });
                });
            }
            const renderChildNode = (childNode: ChildNode) => {
                if (childNode.type === ChildNodeType$Text) {
                    return (
                        <span style={childNode.style}>{childNode.text}</span>
                    );
                }
                return (
                    <DocPageLink
                        class="cls-node-code-block__link"
                        pageId={childNode.pageId}
                        hash={childNode.hash}
                    >
                        {childNode.children.map(renderChildNode)}
                    </DocPageLink>
                );
            };
            return (
                <pre
                    class="cls-node-code-block"
                    style={{
                        backgroundColor: background,
                    }}
                >
                    {childNodes.map((childNode) => {
                        if (childNode.type === ChildNodeType$Text) {
                            return (
                                <span style={childNode.style}>
                                    {childNode.text}
                                </span>
                            );
                        }
                        return (
                            <DocPageLink
                                class="cls-node-code-block__link"
                                pageId={childNode.pageId}
                                hash={childNode.hash}
                            >
                                {childNode.children.map((childText) => (
                                    <span
                                        class="cls-node-code-block__link__text"
                                        style={childText.style}
                                    >
                                        {childText.text}
                                    </span>
                                ))}
                            </DocPageLink>
                        );
                    })}
                </pre>
            );
        }
        case CoreNodeType.Link: {
            let Comp: 'a' | typeof Link;
            let href: string;
            if (
                node.destination.indexOf('://') > 0 ||
                node.destination.indexOf('//') === 0
            ) {
                Comp = 'a';
                href = node.destination;
            } else {
                Comp = Link;
                href = relativeToRootPath(node.destination);
            }
            return (
                <Comp class={linkClass} href={href} title={node.title}>
                    {mapChildren(node.children, pagePath, headingRefs)}
                </Comp>
            );
        }
        case CoreNodeType.DocPageLink: {
            return (
                <DocPageLink
                    class={linkClass}
                    pageId={node.pageId}
                    hash={node.hash}
                    title={node.title}
                >
                    {mapChildren(node.children, pagePath, headingRefs)}
                </DocPageLink>
            );
        }
        case CoreNodeType.GithubSourceLink: {
            return (
                <a
                    class={linkClass}
                    href={getGithubUrl(node.pathFromRoot)}
                    title={node.title}
                >
                    {mapChildren(node.children, pagePath, headingRefs)}
                </a>
            );
        }
        case CoreNodeType.Image: {
            throw new Error();
        }
        case CoreNodeType.Paragraph: {
            return (
                <p class="cls-node-paragraph">
                    {mapChildren(node.children, pagePath, headingRefs)}
                </p>
            );
        }
        case CoreNodeType.Heading123456: {
            const Comp = `h${node.level}` as
                | 'h1'
                | 'h2'
                | 'h3'
                | 'h4'
                | 'h5'
                | 'h6';
            const ref = useRef<HTMLHeadingElement>();
            headingRefs?.push(ref);
            return (
                <Comp
                    class={
                        // Needs to be statically analyzed and replaced to
                        // to minified class names during production.
                        node.level === 1
                            ? 'cls-node-header-1'
                            : node.level === 2
                            ? 'cls-node-header-2'
                            : node.level === 3
                            ? 'cls-node-header-3'
                            : node.level === 4
                            ? 'cls-node-header-4'
                            : node.level === 5
                            ? 'cls-node-header-5'
                            : 'cls-node-header-6'
                    }
                    id={node.alternateId}
                    ref={ref}
                >
                    {node.alternateId !== undefined && (
                        <a
                            href={`${pagePath}#${node.alternateId}`}
                            aria-hidden="true"
                            class="cls-node-header__anchor"
                            tabIndex={-1}
                        >
                            <svg
                                height="16"
                                version="1.1"
                                viewBox="0 0 16 16"
                                width="16"
                            >
                                <path
                                    fill-rule="evenodd"
                                    d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"
                                ></path>
                            </svg>
                        </a>
                    )}
                    {mapChildren(node.children, pagePath, headingRefs)}
                </Comp>
            );
        }
        case CoreNodeType.Heading: {
            return (
                <DeepCoreNodeComponent
                    node={{
                        type: CoreNodeType.Heading123456,
                        alternateId: node.alternateId,
                        level: 2,
                        children: node.children,
                    }}
                    pagePath={pagePath}
                    headingRefs={headingRefs}
                />
            );
        }
        case CoreNodeType.Subheading: {
            return (
                <DeepCoreNodeComponent
                    node={{
                        type: CoreNodeType.Heading123456,
                        alternateId: node.alternateId,
                        level: 3,
                        children: node.children,
                    }}
                    pagePath={pagePath}
                    headingRefs={headingRefs}
                />
            );
        }
        case CoreNodeType.Title: {
            return (
                <DeepCoreNodeComponent
                    node={{
                        type: CoreNodeType.Heading123456,
                        alternateId: node.alternateId,
                        level: 4,
                        children: node.children,
                    }}
                    pagePath={pagePath}
                    headingRefs={headingRefs}
                />
            );
        }
        case CoreNodeType.List: {
            const children = node.children.map((childNode) => (
                <li class="cls-node-list__item">
                    <DeepCoreNodeComponent
                        node={childNode}
                        pagePath={pagePath}
                        headingRefs={headingRefs}
                    />
                </li>
            ));
            return node.listType.type === ListType.Ordered ? (
                <ol class="cls-node-ordered-list" start={node.listType.start}>
                    {children}
                </ol>
            ) : (
                <ul class="cls-node-unordered-list">{children}</ul>
            );
        }
        case CoreNodeType.Table: {
            return (
                <table class="cls-node-table">
                    <thead>
                        <tr>
                            {node.header.children.map((childNode) => (
                                <th>
                                    <DeepCoreNodeComponent
                                        node={childNode}
                                        pagePath={pagePath}
                                        headingRefs={headingRefs}
                                    />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {node.rows.map((row) => (
                            <tr>
                                {row.children.map((childNode) => (
                                    <td>
                                        <DeepCoreNodeComponent
                                            node={childNode}
                                            pagePath={pagePath}
                                            headingRefs={headingRefs}
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }
        case CoreNodeType.CollapsibleSection: {
            return (
                <details class="cls-node-collapsible-section">
                    {node.summaryNode && (
                        <summary class="cls-node-collapsible-section__summary">
                            <DeepCoreNodeComponent
                                node={node.summaryNode}
                                pagePath={pagePath}
                                headingRefs={headingRefs}
                            />
                        </summary>
                    )}
                    {mapChildren(node.children, pagePath, headingRefs)}
                </details>
            );
        }
        case CoreNodeType.Subscript: {
            return (
                <sub class="cls-node-subscript">
                    {mapChildren(node.children, pagePath, headingRefs)}
                </sub>
            );
        }
        case CoreNodeType.Superscript: {
            return (
                <sup class="cls-node-superscript">
                    {mapChildren(node.children, pagePath, headingRefs)}
                </sup>
            );
        }
        case CoreNodeType.NamedAnchor: {
            return <span id={node.name} />;
        }
        case CoreNodeType.LineBreak: {
            return <br />;
        }
        case CoreNodeType.PageTitle: {
            throw new Error();
        }
        case CoreNodeType.Page: {
            throw new Error();
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

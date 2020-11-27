import { Fragment, h, VNode } from 'preact';
import { useRef } from 'preact/hooks';
import { DeepCoreNode, CoreNodeType } from '../../script/docs/core/nodes';
import { ListType } from '../../script/docs/core/nodes/List';
import { getGithubUrl } from '../data/docPages';
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
    headingRefs: { current: HTMLHeadingElement }[] | undefined,
): VNode[] =>
    children.map((childNode) => (
        <DeepCoreNodeComponent node={childNode} headingRefs={headingRefs} />
    ));

export interface DeepCoreNodeComponentProps {
    node: DeepCoreNode;
    headingRefs?: { current: HTMLHeadingElement }[];
}

export function DeepCoreNodeComponent({
    node,
    headingRefs,
}: DeepCoreNodeComponentProps): VNode {
    switch (node.type) {
        case CoreNodeType.Container: {
            return (
                <Fragment>{mapChildren(node.children, headingRefs)}</Fragment>
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
                    {mapChildren(node.children, headingRefs)}
                </blockquote>
            );
        }
        case CoreNodeType.HtmlElement: {
            throw new Error();
        }
        case CoreNodeType.Italics: {
            return (
                <i class="cls-node-italics">
                    {mapChildren(node.children, headingRefs)}
                </i>
            );
        }
        case CoreNodeType.Bold: {
            return (
                <b class="cls-node-bold">
                    {mapChildren(node.children, headingRefs)}
                </b>
            );
        }
        case CoreNodeType.Strikethrough: {
            return (
                <del class="cls-node-strikethrough">
                    {mapChildren(node.children, headingRefs)}
                </del>
            );
        }
        case CoreNodeType.CodeSpan: {
            return (
                <span class="cls-node-code-span">
                    {mapChildren(node.children, headingRefs)}
                </span>
            );
        }
        case CoreNodeType.CodeBlock: {
            return <pre class="cls-node-code-block">{node.code}</pre>;
        }
        case CoreNodeType.RichCodeBlock: {
            return (
                <pre class="cls-node-rich-code-block">
                    {mapChildren(node.children, headingRefs)}
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
                    {mapChildren(node.children, headingRefs)}
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
                    {mapChildren(node.children, headingRefs)}
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
                    {mapChildren(node.children, headingRefs)}
                </a>
            );
        }
        case CoreNodeType.Image: {
            throw new Error();
        }
        case CoreNodeType.Paragraph: {
            return (
                <p class="cls-node-paragraph">
                    {mapChildren(node.children, headingRefs)}
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
                    {mapChildren(node.children, headingRefs)}
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
                    headingRefs={headingRefs}
                />
            );
        }
        case CoreNodeType.List: {
            const children = node.children.map((childNode) => (
                <li class="cls-node-list__item">
                    <DeepCoreNodeComponent
                        node={childNode}
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
                                <td>
                                    <DeepCoreNodeComponent
                                        node={childNode}
                                        headingRefs={headingRefs}
                                    />
                                </td>
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
                                headingRefs={headingRefs}
                            />
                        </summary>
                    )}
                    {mapChildren(node.children, headingRefs)}
                </details>
            );
        }
        case CoreNodeType.Subscript: {
            return (
                <sub class="cls-node-subscript">
                    {mapChildren(node.children, headingRefs)}
                </sub>
            );
        }
        case CoreNodeType.Superscript: {
            return (
                <sup class="cls-node-superscript">
                    {mapChildren(node.children, headingRefs)}
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

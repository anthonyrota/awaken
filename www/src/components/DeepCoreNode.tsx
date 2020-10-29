import { Fragment, h, VNode } from 'preact';
import { DeepCoreNode, CoreNodeType } from '../../script/docs/core/nodes';
import { ListType } from '../../script/docs/core/nodes/List';
import { getGithubUrl } from '../data/docPages';
import { customHistory } from '../hooks/useHistory';
import { DocPageLink } from './DocPageLink';
import { Link } from './Link';

export interface DeepCoreNodeProps {
    node: DeepCoreNode;
}

const mapChildren = (children: DeepCoreNode[]): VNode[] =>
    children.map((childNode) => <DeepCoreNodeComponent node={childNode} />);

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

export function DeepCoreNodeComponent({ node }: DeepCoreNodeProps): VNode {
    switch (node.type) {
        case CoreNodeType.Container: {
            return <Fragment>{mapChildren(node.children)}</Fragment>;
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
                    {mapChildren(node.children)}
                </blockquote>
            );
        }
        case CoreNodeType.HtmlElement: {
            throw new Error();
        }
        case CoreNodeType.Italics: {
            return <i class="cls-node-italics">{mapChildren(node.children)}</i>;
        }
        case CoreNodeType.Bold: {
            return <b class="cls-node-bold">{mapChildren(node.children)}</b>;
        }
        case CoreNodeType.Strikethrough: {
            return (
                <del class="cls-node-strikethrough">
                    {mapChildren(node.children)}
                </del>
            );
        }
        case CoreNodeType.CodeSpan: {
            return (
                <span class="cls-node-code-span">
                    {mapChildren(node.children)}
                </span>
            );
        }
        case CoreNodeType.CodeBlock: {
            return <pre class="cls-node-code-block">{node.code}</pre>;
        }
        case CoreNodeType.RichCodeBlock: {
            return (
                <pre class="cls-node-rich-code-block">
                    {mapChildren(node.children)}
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
                    {mapChildren(node.children)}
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
                    {mapChildren(node.children)}
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
                    {mapChildren(node.children)}
                </a>
            );
        }
        case CoreNodeType.Image: {
            throw new Error();
        }
        case CoreNodeType.Paragraph: {
            return (
                <p class="cls-node-paragraph">{mapChildren(node.children)}</p>
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
                >
                    {mapChildren(node.children)}
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
                />
            );
        }
        case CoreNodeType.List: {
            const children = node.children.map((childNode) => (
                <li class="cls-node-list__item">
                    <DeepCoreNodeComponent node={childNode} />
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
                                    <DeepCoreNodeComponent node={childNode} />
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
                            <DeepCoreNodeComponent node={node.summaryNode} />
                        </summary>
                    )}
                    {mapChildren(node.children)}
                </details>
            );
        }
        case CoreNodeType.Subscript: {
            return (
                <sub class="cls-node-subscript">
                    {mapChildren(node.children)}
                </sub>
            );
        }
        case CoreNodeType.Superscript: {
            return (
                <sup class="cls-node-superscript">
                    {mapChildren(node.children)}
                </sup>
            );
        }
        case CoreNodeType.NamedAnchor: {
            return <a id={node.name} />;
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

import { Node, DeepCoreNode, CoreNodeType } from '..';
import { BoldNode } from '../Bold';
import { CollapsibleSectionNode } from '../CollapsibleSection';
import { ContainerNode } from '../Container';
import { HtmlElementNode } from '../HtmlElement';
import { ItalicsNode } from '../Italics';
import { LineBreakNode } from '../LineBreak';
import { LinkNode } from '../Link';
import { NamedAnchorNode } from '../NamedAnchor';
import { StrikethroughNode } from '../Strikethrough';
import { SubscriptNode } from '../Subscript';
import { SuperscriptNode } from '../Superscript';
import { walkDeepCoreNode } from './walk';

function assertAttributes(
    tagName: string,
    attributes: Record<string, string> | undefined,
    allowedAttributeNames: Set<string>,
    requiredAttributeNames?: Set<string>,
): void {
    if (!attributes) {
        return;
    }
    for (const attributeName of Object.keys(attributes)) {
        if (!allowedAttributeNames.has(attributeName)) {
            throw new Error(
                `${attributeName} is not allowed on html element ${tagName}.`,
            );
        }
    }
    if (requiredAttributeNames) {
        for (const attributeName of requiredAttributeNames) {
            if (!(attributeName in attributes)) {
                throw new Error(
                    `${attributeName} is required on html element ${tagName}.`,
                );
            }
        }
    }
}

function assertNodeAttributes(
    node: HtmlElementNode<Node>,
    allowedAttributeNames: Set<string>,
    requiredAttributeNames?: Set<string>,
): void {
    assertAttributes(
        node.tagName,
        node.attributes,
        allowedAttributeNames,
        requiredAttributeNames,
    );
}

export function replaceHtml(node: DeepCoreNode): DeepCoreNode | undefined {
    let newNode: DeepCoreNode | undefined;
    function onNode(
        node: DeepCoreNode,
        replaceNode: ((newNode: DeepCoreNode) => void) | null,
    ): boolean | void {
        if (node.type !== CoreNodeType.HtmlElement) {
            return;
        }
        const replacements: DeepCoreNode[] = [];
        if (node.attributes && node.attributes.name !== undefined) {
            replacements.push(
                NamedAnchorNode({
                    name: node.attributes.name,
                }),
            );
        }
        const { children } = node;
        switch (node.tagName) {
            case 'b':
            case 'strong': {
                assertNodeAttributes(node, new Set(['name']));
                replacements.push(BoldNode({ children }));
                break;
            }
            case 'i':
            case 'em': {
                assertNodeAttributes(node, new Set(['name']));
                replacements.push(ItalicsNode({ children }));
                break;
            }
            case 's':
            case 'del': {
                assertNodeAttributes(node, new Set(['name']));
                replacements.push(StrikethroughNode({ children }));
                break;
            }
            case 'sub': {
                assertNodeAttributes(node, new Set(['name']));
                replacements.push(SubscriptNode({ children }));
                break;
            }
            case 'sup': {
                assertNodeAttributes(node, new Set(['name']));
                replacements.push(SuperscriptNode({ children }));
                break;
            }
            case 'a': {
                if (!node.attributes) {
                    // TODO: emit source location information.
                    throw new Error('No attributes in anchor tag.');
                }
                const { name, ...attributes } = node.attributes;
                if (
                    name !== undefined &&
                    Object.keys(attributes).length === 0
                ) {
                    return;
                }
                assertAttributes(
                    node.tagName,
                    attributes,
                    new Set(['href', 'title']),
                    new Set(['href']),
                );
                const { href, title } = attributes;
                replacements.push(
                    LinkNode({ destination: href, title, children }),
                );
                break;
            }
            case 'br': {
                assertNodeAttributes(node, new Set(['name']));
                if (node.children.length !== 0) {
                    throw new Error(
                        `HTML element ${node.tagName} cannot contain children.`,
                    );
                }
                replacements.push(LineBreakNode({}));
                break;
            }
            case 'details': {
                assertNodeAttributes(node, new Set(['name']));
                const summaryNodeIndex = node.children.findIndex(
                    (node) =>
                        node.type === CoreNodeType.HtmlElement &&
                        node.tagName === 'summary',
                );
                if (summaryNodeIndex !== -1) {
                    const childrenWithoutSummaryNode = children.filter(
                        (_, i) => i !== summaryNodeIndex,
                    );
                    const summaryNode = node.children[
                        summaryNodeIndex
                    ] as HtmlElementNode<DeepCoreNode>;
                    assertNodeAttributes(summaryNode, new Set(['name']));
                    const summaryNodeChildren: DeepCoreNode[] = [];
                    if (
                        summaryNode.attributes &&
                        summaryNode.attributes.name !== undefined
                    ) {
                        summaryNodeChildren.push(
                            NamedAnchorNode({
                                name: summaryNode.attributes.name,
                            }),
                        );
                    }
                    summaryNodeChildren.push(...summaryNode.children);
                    replacements.push(
                        CollapsibleSectionNode({
                            summaryNode: ContainerNode({
                                children: summaryNodeChildren,
                            }),
                            children: childrenWithoutSummaryNode,
                        }),
                    );
                } else {
                    replacements.push(
                        CollapsibleSectionNode({
                            children,
                        }),
                    );
                }
                break;
            }
            default: {
                throw new Error(`Invalid HTML element ${node.tagName}.`);
            }
        }
        const replacementNode =
            replacements.length === 1
                ? replacements[0]
                : ContainerNode({ children: replacements });
        if (replaceNode !== null) {
            replaceNode(replacementNode);
        } else {
            newNode = replacementNode;
        }
        walkDeepCoreNode(replacementNode, onNode);
        return true;
    }
    walkDeepCoreNode(node, onNode);
    return newNode;
}

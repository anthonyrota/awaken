import { Node } from '..';

const $$Container = Symbol('Container');

export interface ContainerBase<ChildNode extends Node> {
    [$$Container]: void;
    children: ChildNode[];
}

export function ContainerBase<ChildNode extends Node>(): ContainerBase<
    ChildNode
> {
    return {
        [$$Container]: undefined,
        children: [],
    };
}

export function addChildrenC<
    ChildNode extends Node,
    C extends ContainerBase<ChildNode>
>(container: C, ...children: ChildNode[]): C {
    container.children.push(...children);
    return container;
}

export function addChildren<ChildNode extends Node>(
    container: ContainerBase<ChildNode>,
    ...children: ChildNode[]
): void {
    container.children.push(...children);
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function isContainerBase(node: object): node is ContainerBase<Node> {
    return $$Container in node;
}

export function getLastNestedChild(
    container: ContainerBase<Node>,
): Node | void {
    for (let i = container.children.length - 1; i >= 0; i--) {
        const child = container.children[i];
        if (isContainerBase(child)) {
            if (child.children.length !== 0) {
                const last = getLastNestedChild(child);
                if (last) {
                    return last;
                }
            }
        } else {
            return child;
        }
    }
}

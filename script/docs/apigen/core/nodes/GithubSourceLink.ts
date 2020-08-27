import { ContainerBase, ContainerParameters } from './Container';
import { Node, CoreNodeType } from '.';

export interface GithubSourceLinkParameters<ChildNode extends Node>
    extends ContainerParameters<ChildNode> {
    destination: string;
    title?: string;
}

export interface GithubSourceLinkBase<ChildNode extends Node>
    extends ContainerBase<ChildNode> {
    destination: string;
    title?: string;
}

export function GithubSourceLinkBase<ChildNode extends Node>(
    parameters: GithubSourceLinkParameters<ChildNode>,
): GithubSourceLinkBase<ChildNode> {
    const githubSourceLinkBase: GithubSourceLinkBase<ChildNode> = {
        destination: parameters.destination,
        ...ContainerBase<ChildNode>({ children: parameters.children }),
    };
    if (parameters.title !== undefined) {
        githubSourceLinkBase.title = parameters.title;
    }
    return githubSourceLinkBase;
}

export interface GithubSourceLinkNode<ChildNode extends Node>
    extends GithubSourceLinkBase<ChildNode>,
        Node {
    type: CoreNodeType.GithubSourceLink;
}

export function GithubSourceLinkNode<ChildNode extends Node>(
    parameters: GithubSourceLinkParameters<ChildNode>,
): GithubSourceLinkNode<ChildNode> {
    return {
        type: CoreNodeType.GithubSourceLink,
        ...GithubSourceLinkBase(parameters),
    };
}

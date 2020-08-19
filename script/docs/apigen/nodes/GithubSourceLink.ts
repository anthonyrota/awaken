import { ContainerBase } from './abstract/ContainerBase';
import { Node, CoreNodeType } from '.';

export interface GithubSourceLink<ChildNode extends Node>
    extends ContainerBase<ChildNode> {
    type: CoreNodeType.GithubSourceLink;
    destination: string;
    title?: string;
}

export interface GithubSourceLinkParameters {
    destination: string;
    title?: string;
}

export function GithubSourceLink<ChildNode extends Node>(
    parameters: GithubSourceLinkParameters,
): GithubSourceLink<ChildNode> {
    const githubSourceLink: GithubSourceLink<ChildNode> = {
        type: CoreNodeType.GithubSourceLink,
        destination: parameters.destination,
        ...ContainerBase<ChildNode>(),
    };
    if (parameters.title !== undefined) {
        githubSourceLink.title = parameters.title;
    }
    return githubSourceLink;
}

import { PageMetadata } from '../../pageMetadata';
import { ContainerBase } from './abstract/ContainerBase';
import { Node, CoreNodeType } from '.';

export interface Page<ChildNode extends Node> extends ContainerBase<ChildNode> {
    type: CoreNodeType.Page;
    metadata: PageMetadata;
}

export interface PageParameters {
    metadata: PageMetadata;
}

export function Page<ChildNode extends Node>(
    parameters: PageParameters,
): Page<ChildNode> {
    return {
        type: CoreNodeType.Page,
        metadata: parameters.metadata,
        ...ContainerBase<ChildNode>(),
    };
}

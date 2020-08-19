import { ContainerBase } from './abstract/ContainerBase';
import { Node, CoreNodeType } from '.';

export interface RichCodeBlock<ChildNode extends Node>
    extends ContainerBase<ChildNode> {
    type: CoreNodeType.RichCodeBlock;
    language: string;
}

export interface RichCodeBlockParameters {
    language: string;
}

export function RichCodeBlock<ChildNode extends Node>(
    parameters: RichCodeBlockParameters,
): RichCodeBlock<ChildNode> {
    return {
        type: CoreNodeType.RichCodeBlock,
        language: parameters.language,
        ...ContainerBase<ChildNode>(),
    };
}

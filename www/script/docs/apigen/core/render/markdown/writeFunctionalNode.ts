import { MarkdownOutput } from './MarkdownOutput';
import { FunctionalBase } from './nodes/FunctionalNode';
import { ParamWriteRenderMarkdownNode } from '.';

export function writeFunctionalNode(
    functional: FunctionalBase,
    output: MarkdownOutput,
    _writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
): void {
    functional.write(output);
}

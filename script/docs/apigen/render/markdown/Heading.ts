import { Heading123456 } from '../../nodes/Heading123456';
import { Heading } from '../../nodes/Heading';
import { Node } from '../../nodes';
import { MarkdownOutput } from './MarkdownOutput';
import { writeHeading123456 } from './Heading123456';
import { addChildrenC } from '../../nodes/abstract/ContainerBase';

export function writeHeading<ChildNode extends Node>(
    heading: Heading<ChildNode>,
    output: MarkdownOutput,
    writeChildNode: (node: ChildNode, output: MarkdownOutput) => void,
): void {
    writeHeading123456(
        addChildrenC(
            Heading123456<ChildNode>({
                level: 2,
                alternateId: heading.alternateId,
            }),
            ...heading.children,
        ),
        output,
        writeChildNode,
    );
}

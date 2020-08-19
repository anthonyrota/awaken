import { Heading123456 } from '../../nodes/Heading123456';
import { Subheading } from '../../nodes/Subheading';
import { Node } from '../../nodes';
import { MarkdownOutput } from './MarkdownOutput';
import { writeHeading123456 } from './Heading123456';
import { addChildrenC } from '../../nodes/abstract/ContainerBase';

export function writeSubheading<ChildNode extends Node>(
    subheading: Subheading<ChildNode>,
    output: MarkdownOutput,
    writeChildNode: (node: ChildNode, output: MarkdownOutput) => void,
): void {
    writeHeading123456(
        addChildrenC(
            Heading123456<ChildNode>({
                level: 3,
                alternateId: subheading.alternateId,
            }),
            ...subheading.children,
        ),
        output,
        writeChildNode,
    );
}

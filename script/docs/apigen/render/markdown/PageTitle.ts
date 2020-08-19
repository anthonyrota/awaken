import { Heading123456 } from '../../nodes/Heading123456';
import { PageTitle } from '../../nodes/PageTitle';
import { Node } from '../../nodes';
import { MarkdownOutput } from './MarkdownOutput';
import { writeHeading123456 } from './Heading123456';
import { addChildrenC } from '../../nodes/abstract/ContainerBase';

export function writePageTitle<ChildNode extends Node>(
    pageTitle: PageTitle<ChildNode>,
    output: MarkdownOutput,
    writeChildNode: (node: ChildNode, output: MarkdownOutput) => void,
): void {
    writeHeading123456(
        addChildrenC(
            Heading123456<ChildNode>({
                level: 1,
                alternateId: pageTitle.alternateId,
            }),
            ...pageTitle.children,
        ),
        output,
        writeChildNode,
    );
}

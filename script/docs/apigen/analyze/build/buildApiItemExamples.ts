import { ApiItem } from '@microsoft/api-extractor-model';
import { TitleNode } from '../../nodes/Title';
import { AnalyzeContext } from '../Context';
import { getDocComment, getExampleBlocks } from '../util/tsdocConfiguration';
import { ContainerNode } from './../../nodes/Container';
import { DeepCoreNode } from './../../nodes/index';
import { PlainTextNode } from './../../nodes/PlainText';
import { buildApiItemDocNode } from './buildApiItemDocNode';

export function buildApiItemExamples(
    apiItem: ApiItem,
    context: AnalyzeContext,
    docComment = getDocComment(apiItem),
): DeepCoreNode | undefined {
    const container = ContainerNode<DeepCoreNode>({});
    for (const exampleBlock of getExampleBlocks(docComment)) {
        container.children.push(
            TitleNode({
                children: [PlainTextNode({ text: 'Example Usage' })],
            }),
        );
        for (const block of exampleBlock.getChildNodes()) {
            const container_ = buildApiItemDocNode(apiItem, block, context);
            if (container_) {
                container.children.push(container_);
            }
        }
    }
    if (container.children.length === 0) {
        return;
    }
    return container;
}

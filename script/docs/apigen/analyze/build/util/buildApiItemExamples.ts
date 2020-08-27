import { ApiItem } from '@microsoft/api-extractor-model';
import { DocComment } from '@microsoft/tsdoc';
import { ContainerNode } from '../../../core/nodes/Container';
import { DeepCoreNode } from '../../../core/nodes/index';
import { PlainTextNode } from '../../../core/nodes/PlainText';
import { TitleNode } from '../../../core/nodes/Title';
import { AnalyzeContext } from '../../Context';
import { getDocComment, getExampleBlocks } from '../../util/tsdocConfiguration';
import { buildApiItemDocNode } from './buildApiItemDocNode';

export interface BuildApiItemExamplesParameters {
    apiItem: ApiItem;
    context: AnalyzeContext;
    docComment?: DocComment;
}

export function buildApiItemExamples(
    parameters: BuildApiItemExamplesParameters,
): DeepCoreNode | undefined {
    const {
        apiItem,
        context,
        docComment = getDocComment(apiItem),
    } = parameters;
    const container = ContainerNode<DeepCoreNode>({});
    for (const exampleBlock of getExampleBlocks(docComment)) {
        container.children.push(
            TitleNode({
                children: [PlainTextNode({ text: 'Example Usage' })],
            }),
        );
        for (const block of exampleBlock.getChildNodes()) {
            const container_ = buildApiItemDocNode({
                apiItem,
                docNode: block,
                context,
            });
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

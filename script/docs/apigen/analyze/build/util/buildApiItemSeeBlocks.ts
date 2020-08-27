import { ApiItem } from '@microsoft/api-extractor-model';
import { DocComment } from '@microsoft/tsdoc';
import { ContainerNode } from '../../../core/nodes/Container';
import { DeepCoreNode } from '../../../core/nodes/index';
import { ListNode, ListType } from '../../../core/nodes/List';
import { PlainTextNode } from '../../../core/nodes/PlainText';
import { TitleNode } from '../../../core/nodes/Title';
import { AnalyzeContext } from '../../Context';
import { getDocComment, getSeeBlocks } from '../../util/tsdocConfiguration';
import { buildApiItemDocNode } from './buildApiItemDocNode';

export interface BuildApiItemSeeBlocksParameters {
    apiItem: ApiItem;
    context: AnalyzeContext;
    docComment?: DocComment;
}

export function buildApiItemSeeBlocks(
    parameters: BuildApiItemSeeBlocksParameters,
): DeepCoreNode | undefined {
    const {
        apiItem,
        context,
        docComment = getDocComment(apiItem),
    } = parameters;
    const list = ListNode<DeepCoreNode>({
        listType: {
            type: ListType.Unordered,
        },
    });
    for (const seeBlock of getSeeBlocks(docComment)) {
        const listItem = ContainerNode<DeepCoreNode>({});
        list.children.push(listItem);
        for (const block of seeBlock.getChildNodes()) {
            const node = buildApiItemDocNode({
                apiItem,
                docNode: block,
                context,
            });
            if (node) {
                listItem.children.push(node);
            }
        }
    }
    if (list.children.length > 0) {
        return ContainerNode({
            children: [
                TitleNode({
                    children: [PlainTextNode({ text: 'See Also' })],
                }),
                list,
            ],
        });
    }
    return;
}

import { ApiItem } from '@microsoft/api-extractor-model';
import { ContainerNode } from '../../nodes/Container';
import { DeepCoreNode } from '../../nodes/index';
import { ListNode, ListType } from '../../nodes/List';
import { PlainTextNode } from '../../nodes/PlainText';
import { TitleNode } from '../../nodes/Title';
import { AnalyzeContext } from '../Context';
import { getDocComment, getSeeBlocks } from '../util/tsdocConfiguration';
import { buildApiItemDocNode } from './buildApiItemDocNode';

export function buildApiItemSeeBlocks(
    apiItem: ApiItem,
    context: AnalyzeContext,
    docComment = getDocComment(apiItem),
): DeepCoreNode | undefined {
    const list = ListNode<DeepCoreNode>({
        listType: {
            type: ListType.Unordered,
        },
    });
    for (const seeBlock of getSeeBlocks(docComment)) {
        const listItem = ContainerNode<DeepCoreNode>({});
        list.children.push(listItem);
        for (const block of seeBlock.getChildNodes()) {
            const node = buildApiItemDocNode(apiItem, block, context);
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

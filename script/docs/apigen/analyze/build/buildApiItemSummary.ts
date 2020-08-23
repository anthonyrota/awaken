import { ApiItem } from '@microsoft/api-extractor-model';
import { AnalyzeContext } from '../Context';
import { getDocComment } from '../util/tsdocConfiguration';
import { DeepCoreNode } from './../../nodes/index';
import { buildApiItemDocNode } from './buildApiItemDocNode';

export function buildApiItemSummary(
    apiItem: ApiItem,
    context: AnalyzeContext,
    docComment = getDocComment(apiItem),
): DeepCoreNode | undefined {
    return buildApiItemDocNode(apiItem, docComment.summarySection, context);
}

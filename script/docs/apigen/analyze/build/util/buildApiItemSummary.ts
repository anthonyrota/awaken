import { ApiItem } from '@microsoft/api-extractor-model';
import { DocComment } from '@microsoft/tsdoc';
import { DeepCoreNode } from '../../../core/nodes';
import { AnalyzeContext } from '../../Context';
import { getDocComment } from '../../util/tsdocConfiguration';
import { buildApiItemDocNode } from './buildApiItemDocNode';

export interface BuildApiItemSummaryParameters {
    apiItem: ApiItem;
    context: AnalyzeContext;
    docComment?: DocComment;
}

export function buildApiItemSummary(
    parameters: BuildApiItemSummaryParameters,
): DeepCoreNode | undefined {
    const {
        apiItem,
        context,
        docComment = getDocComment(apiItem),
    } = parameters;
    return buildApiItemDocNode({
        apiItem,
        docNode: docComment.summarySection,
        context,
    });
}

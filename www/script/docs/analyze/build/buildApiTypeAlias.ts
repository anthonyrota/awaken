import { ApiTypeAlias } from '@microsoft/api-extractor-model';
import * as ts from 'typescript';
import { DeepCoreNode } from '../../core/nodes';
import { ContainerNode } from '../../core/nodes/Container';
import { AnalyzeContext } from '../Context';
import { getApiItemTextKind } from '../util/getApiItemTextKind';
import { buildApiItemAnchor } from './util/buildApiItemAnchor';
import { buildApiItemExamples } from './util/buildApiItemExamples';
import { buildApiItemSeeBlocks } from './util/buildApiItemSeeBlocks';
import { buildApiItemSignature } from './util/buildApiItemSignature';
import { buildApiItemSummary } from './util/buildApiItemSummary';

export interface BuildApiTypeAliasParameters {
    context: AnalyzeContext;
    typeAlias: ApiTypeAlias;
}

export function buildApiTypeAlias(
    parameters: BuildApiTypeAliasParameters,
): DeepCoreNode {
    const { typeAlias, context } = parameters;
    const anchor = buildApiItemAnchor({
        apiItem: typeAlias,
        context,
        textKind: getApiItemTextKind(typeAlias.kind),
    });
    const signature = buildApiItemSignature({
        apiItem: typeAlias,
        context,
        syntaxKind: ts.SyntaxKind.TypeAliasDeclaration,
    });
    const summary = buildApiItemSummary({ apiItem: typeAlias, context });
    const examples = buildApiItemExamples({ apiItem: typeAlias, context });
    const seeBlocks = buildApiItemSeeBlocks({ apiItem: typeAlias, context });

    const container = ContainerNode<DeepCoreNode>({});
    if (anchor) container.children.push(anchor);
    container.children.push(signature);
    if (summary) container.children.push(summary);
    if (examples) container.children.push(examples);
    if (seeBlocks) container.children.push(seeBlocks);

    return container;
}

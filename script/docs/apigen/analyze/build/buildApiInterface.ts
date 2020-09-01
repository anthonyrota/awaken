import { ApiInterface } from '@microsoft/api-extractor-model';
import * as ts from 'typescript';
import { DeepCoreNode } from '../../core/nodes';
import { ContainerNode } from '../../core/nodes/Container';
import { AnalyzeContext } from '../Context';
import { getApiItemTextKind } from '../util/getApiItemTextKind';
import { buildApiItemAnchor } from './util/buildApiItemAnchor';
import { buildApiItemExamples } from './util/buildApiItemExamples';
import { buildApiItemSeeBlocks } from './util/buildApiItemSeeBlocks';
import { buildApiItemSignature } from './util/buildApiItemSignature';
import { buildApiItemSourceLocationLink } from './util/buildApiItemSourceLocationLink';
import { buildApiItemSummary } from './util/buildApiItemSummary';

export interface BuildApiInterfaceParameters {
    context: AnalyzeContext;
    interface: ApiInterface;
}

export function buildApiInterface(
    parameters: BuildApiInterfaceParameters,
): DeepCoreNode {
    const { interface: interface_, context } = parameters;
    const anchor = buildApiItemAnchor({
        apiItem: interface_,
        context,
        textKind: getApiItemTextKind(interface_.kind),
    });
    const sourceLocationLink = buildApiItemSourceLocationLink({
        apiItem: interface_,
        context,
        syntaxKind: ts.SyntaxKind.InterfaceDeclaration,
    });
    const signature = buildApiItemSignature({ apiItem: interface_, context });
    const summary = buildApiItemSummary({ apiItem: interface_, context });
    const examples = buildApiItemExamples({ apiItem: interface_, context });
    const seeBlocks = buildApiItemSeeBlocks({ apiItem: interface_, context });

    const container = ContainerNode<DeepCoreNode>({});
    if (anchor) container.children.push(anchor);
    container.children.push(sourceLocationLink);
    container.children.push(signature);
    if (summary) container.children.push(summary);
    if (examples) container.children.push(examples);
    if (seeBlocks) container.children.push(seeBlocks);

    return container;
}

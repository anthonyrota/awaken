import { ApiFunction } from '@microsoft/api-extractor-model';
import * as ts from 'typescript';
import { DeepCoreNode } from '../../core/nodes';
import { ContainerNode } from '../../core/nodes/Container';
import { AnalyzeContext } from '../Context';
import { getApiItemTextKind } from '../util/getApiItemTextKind';
import { buildApiItemAnchor } from './util/buildApiItemAnchor';
import { buildApiItemBaseDoc } from './util/buildApiItemBaseDoc';
import { buildApiItemExamples } from './util/buildApiItemExamples';
import { buildApiItemParameters } from './util/buildApiItemParameters';
import { buildApiItemSeeBlocks } from './util/buildApiItemSeeBlocks';
import {
    buildApiItemSignatureExcerpt,
    buildApiItemSignatureTitle,
} from './util/buildApiItemSignature';
import { buildApiItemSummary } from './util/buildApiItemSummary';

export interface BuildApiFunctionParameters {
    context: AnalyzeContext;
    overloads: ApiFunction[];
}

export function buildApiFunction(
    parameters: BuildApiFunctionParameters,
): DeepCoreNode {
    if (parameters.overloads.length === 0) {
        throw new Error('No implementation.');
    }

    const { context } = parameters;
    const overloads = parameters.overloads.slice();

    overloads.sort((a, b) => a.overloadIndex - b.overloadIndex);

    const container = ContainerNode<DeepCoreNode>({});
    const anchor = buildApiItemAnchor({
        apiItem: overloads[0],
        context,
        textKind: getApiItemTextKind(overloads[0].kind),
    });
    const baseDoc = buildApiItemBaseDoc({
        apiItem: overloads[0],
        context,
        syntaxKind: ts.SyntaxKind.FunctionDeclaration,
    });

    if (anchor) container.children.push(anchor);
    if (baseDoc) container.children.push(baseDoc);

    container.children.push(
        buildApiItemSignatureTitle({
            apiItem: overloads[0],
            context,
            syntaxKind: ts.SyntaxKind.FunctionDeclaration,
        }),
    );

    for (const fn of overloads) {
        const signatureExcerpt = buildApiItemSignatureExcerpt({
            apiItem: fn,
            context,
        });
        const summary = buildApiItemSummary({ apiItem: fn, context });
        const parameters = buildApiItemParameters({ apiItem: fn, context });
        const examples = buildApiItemExamples({ apiItem: fn, context });
        const seeBlocks = buildApiItemSeeBlocks({ apiItem: fn, context });

        container.children.push(signatureExcerpt);
        if (summary) container.children.push(summary);
        if (parameters) container.children.push(parameters);
        if (examples) container.children.push(examples);
        if (seeBlocks) container.children.push(seeBlocks);
    }

    return container;
}

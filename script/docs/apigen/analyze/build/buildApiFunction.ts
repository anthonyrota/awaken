import { ApiFunction } from '@microsoft/api-extractor-model';
import * as ts from 'typescript';
import { ContainerNode } from '../../core/nodes/Container';
import { DeepCoreNode } from '../../core/nodes/index';
import { AnalyzeContext } from '../Context';
import { getApiItemTextKind } from '../util/getApiItemTextKind';
import { buildApiItemAnchor } from './util/buildApiItemAnchor';
import { buildApiItemBaseDoc } from './util/buildApiItemBaseDoc';
import { buildApiItemExamples } from './util/buildApiItemExamples';
import { buildApiItemParameters } from './util/buildApiItemParameters';
import { buildApiItemSeeBlocks } from './util/buildApiItemSeeBlocks';
import {
    buildApiItemSignature,
    buildApiItemSignatureExcerpt,
} from './util/buildApiItemSignature';
import { buildApiItemSourceLocationLink } from './util/buildApiItemSourceLocationLink';
import { buildApiItemSummary } from './util/buildApiItemSummary';

export interface BuildApiFunctionParameters {
    context: AnalyzeContext;
    overloads: ApiFunction[];
}

export function buildApiFunction(
    parameters: BuildApiFunctionParameters,
): DeepCoreNode {
    const { context } = parameters;
    const overloads = parameters.overloads.slice();

    if (parameters.overloads.length === 0) {
        throw new Error('No implementation.');
    }

    overloads.sort((a, b) => a.overloadIndex - b.overloadIndex);

    const container = ContainerNode<DeepCoreNode>({});
    const anchor = buildApiItemAnchor({
        apiItem: overloads[0],
        context,
        textKind: getApiItemTextKind(overloads[0].kind),
    });
    const sourceLocationLink = buildApiItemSourceLocationLink({
        apiItem: overloads[0],
        context,
        syntaxKind: ts.SyntaxKind.FunctionDeclaration,
    });
    const baseDoc = buildApiItemBaseDoc({
        apiItem: overloads[0],
        context,
        syntaxKind: ts.SyntaxKind.FunctionDeclaration,
    });

    if (anchor) container.children.push(anchor);
    container.children.push(sourceLocationLink);
    if (baseDoc) container.children.push(baseDoc);

    let didNotOnlyWriteSignature = true;

    for (const fn of overloads) {
        const _didNotOnlyWriteSignature = didNotOnlyWriteSignature;
        const summary = buildApiItemSummary({ apiItem: fn, context });
        const parameters = buildApiItemParameters({ apiItem: fn, context });
        const examples = buildApiItemExamples({ apiItem: fn, context });
        const seeBlocks = buildApiItemSeeBlocks({ apiItem: fn, context });

        didNotOnlyWriteSignature = !!(
            summary ||
            parameters ||
            examples ||
            seeBlocks
        );

        if (_didNotOnlyWriteSignature || didNotOnlyWriteSignature) {
            const signature = buildApiItemSignature({ apiItem: fn, context });
            container.children.push(signature);
            if (summary) container.children.push(summary);
            if (parameters) container.children.push(parameters);
            if (examples) container.children.push(examples);
            if (seeBlocks) container.children.push(seeBlocks);
        } else {
            const signatureExcerpt = buildApiItemSignatureExcerpt({
                apiItem: fn,
                context,
            });
            container.children.push(signatureExcerpt);
        }
    }

    return container;
}

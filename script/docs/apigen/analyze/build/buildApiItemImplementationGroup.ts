import {
    ApiItem,
    ApiFunction,
    ApiInterface,
    ApiVariable,
    ApiTypeAlias,
    ApiItemKind,
} from '@microsoft/api-extractor-model';
import { CodeSpanNode } from '../../core/nodes/CodeSpan';
import { ContainerNode } from '../../core/nodes/Container';
import { HeadingNode } from '../../core/nodes/Heading';
import { DeepCoreNode } from '../../core/nodes/index';
import { PlainTextNode } from '../../core/nodes/PlainText';
import { AnalyzeContext } from '../Context';
import { getApiItemIdentifier } from '../util/getApiItemIdentifier';
import { buildApiFunction } from './buildApiFunction';
import { buildApiInterface } from './buildApiInterface';
import { buildApiTypeAlias } from './buildApiTypeAlias';
import { buildApiVariable } from './buildApiVariable';

export interface BuildApiItemImplementationGroupParameters {
    apiItems: ApiItem[];
    context: AnalyzeContext;
}

export function buildApiItemImplementationGroup(
    parameters: BuildApiItemImplementationGroupParameters,
): DeepCoreNode {
    const { apiItems, context } = parameters;

    if (apiItems.length === 0) {
        throw new Error('No implementation.');
    }

    const functionOverloads: ApiFunction[] = [];
    let interface_: ApiInterface | undefined;
    let typeAlias: ApiTypeAlias | undefined;
    let variable: ApiVariable | undefined;

    for (const apiItem of apiItems) {
        switch (apiItem.kind) {
            case ApiItemKind.Function: {
                functionOverloads.push(apiItem as ApiFunction);
                break;
            }
            case ApiItemKind.Interface: {
                if (interface_) throw new Error('Duplicate interfaces.');
                interface_ = apiItem as ApiInterface;
                break;
            }
            case ApiItemKind.TypeAlias: {
                if (typeAlias) throw new Error('Duplicate type aliases.');
                typeAlias = apiItem as ApiTypeAlias;
                break;
            }
            case ApiItemKind.Variable: {
                if (variable) throw new Error('Duplicate variables.');
                variable = apiItem as ApiVariable;
                break;
            }
        }
    }

    const container = ContainerNode<DeepCoreNode>({
        children: [
            HeadingNode({
                children: [
                    CodeSpanNode({
                        children: [
                            PlainTextNode({
                                text: getApiItemIdentifier(apiItems[0])
                                    .exportName,
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });

    if (functionOverloads.length !== 0) {
        container.children.push(
            buildApiFunction({ overloads: functionOverloads, context }),
        );
    }
    if (interface_) {
        container.children.push(
            buildApiInterface({ interface: interface_, context }),
        );
    }
    if (typeAlias) {
        container.children.push(buildApiTypeAlias({ typeAlias, context }));
    }
    if (variable) {
        container.children.push(buildApiVariable({ variable, context }));
    }

    return container;
}

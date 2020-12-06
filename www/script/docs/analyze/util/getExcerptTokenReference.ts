import {
    ApiItem,
    ExcerptToken,
    ExcerptTokenKind,
} from '@microsoft/api-extractor-model';
import { DeclarationReference } from '@microsoft/tsdoc/lib/beta/DeclarationReference';
import * as colors from 'colors';
import { AnalyzeContext } from '../Context';

export interface FoundApiItemReference {
    apiItem: ApiItem;
}

const eventRegexp = /core!~?Event(_2)?:type$/;

export function getExcerptTokenReference(
    token: ExcerptToken,
    debugTokenText: string,
    debugExcerptText: string,
    context: AnalyzeContext,
): FoundApiItemReference | null {
    if (
        token.kind !== ExcerptTokenKind.Reference ||
        !token.canonicalReference ||
        // Non-module reference.
        token.canonicalReference.toString().startsWith('!')
    ) {
        return null;
    } else if (
        token.canonicalReference.toString().includes('!~') &&
        !eventRegexp.test(token.canonicalReference.toString())
    ) {
        if (token.canonicalReference.toString().endsWith('!~value')) {
            // I don't know why this is a thing.
            return null;
        }
        // Local reference.
        return null;
    }

    // Event type shadows the global type so api-extractor replaces it with
    // Event_2, but doesn't bother changing the references to the updated name.
    // Also, for some reason Event is declared to be a local reference in the
    // testing package.
    let canonicalReference = DeclarationReference.parse(
        token.canonicalReference
            .toString()
            .replace(eventRegexp, 'core!Event_2:type'),
    );
    if (canonicalReference.toString().endsWith(':function')) {
        // Requires (overloadIndex) at the end if a function.
        canonicalReference = canonicalReference.withOverloadIndex(1);
    }
    const result = context.apiModel.resolveDeclarationReference(
        canonicalReference,
        undefined,
    );

    if (result.errorMessage) {
        console.log(
            `Error resolving excerpt token ${colors.underline.bold(
                debugTokenText,
            )} reference: ${colors.red(
                result.errorMessage,
            )}. The original signature is ${colors.underline.bold(
                debugExcerptText,
            )}`,
        );
    }

    if (result.resolvedApiItem) {
        return {
            apiItem: result.resolvedApiItem,
        };
    }

    return null;
}

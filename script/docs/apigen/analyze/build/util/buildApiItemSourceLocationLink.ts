import { ApiItem } from '@microsoft/api-extractor-model';
import * as ts from 'typescript';
import { DeepCoreNode } from '../../../core/nodes';
import { BlockQuoteNode } from '../../../core/nodes/BlockQuote';
import { GithubSourceLinkNode } from '../../../core/nodes/GithubSourceLink';
import { PlainTextNode } from '../../../core/nodes/PlainText';
import { getRelativePath } from '../../../util/getRelativePath';
import { AnalyzeContext } from '../../Context';
import { getUniqueExportIdentifierKey } from '../../Identifier';
import { getApiItemIdentifier } from '../../util/getApiItemIdentifier';
import { UnsupportedApiItemError } from '../../util/UnsupportedApiItemError';

export interface BuildApiItemSourceLocationLinkParameters {
    apiItem: ApiItem;
    context: AnalyzeContext;
    syntaxKind: ts.SyntaxKind;
}

export function buildApiItemSourceLocationLink(
    parameters: BuildApiItemSourceLocationLinkParameters,
): DeepCoreNode {
    const { apiItem, context, syntaxKind } = parameters;
    const identifier = getApiItemIdentifier(apiItem);
    const identifierKey = getUniqueExportIdentifierKey(identifier);
    // eslint-disable-next-line max-len
    const exportIdentifierMetadata = context.sourceMetadata.exportIdentifierToExportIdentifierMetadata.get(
        identifierKey,
    );
    if (!exportIdentifierMetadata) {
        throw new UnsupportedApiItemError(
            apiItem,
            'No export identifier metadata.',
        );
    }
    // eslint-disable-next-line max-len
    const exportMetadata = exportIdentifierMetadata.syntaxKindToExportMetadata.get(
        syntaxKind,
    );
    if (!exportMetadata) {
        throw new UnsupportedApiItemError(
            apiItem,
            `No export metadata. Identifier key: ${identifierKey}. Syntax kind: ${ts.SyntaxKind[syntaxKind]}`,
        );
    }

    const { sourceLocation } = exportMetadata;
    const currentApiItemPath = `${
        context.outDir
    }/${context.getPathOfExportIdentifier(identifier)}`;
    const sourceGithubPath = `${sourceLocation.filePath}#L${sourceLocation.lineNumber}`;
    const relativePath = getRelativePath(currentApiItemPath, sourceGithubPath);

    return BlockQuoteNode({
        children: [
            PlainTextNode({ text: 'Source Location: ' }),
            GithubSourceLinkNode({
                destination: relativePath,
                children: [PlainTextNode({ text: sourceGithubPath })],
            }),
        ],
    });
}

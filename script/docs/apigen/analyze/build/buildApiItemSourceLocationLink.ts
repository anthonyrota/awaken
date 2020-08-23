import { ApiItem } from '@microsoft/api-extractor-model';
import * as ts from 'typescript';
import { PlainTextNode } from '../../nodes/PlainText';
import { getPathOfExportIdentifier, outDir } from '../../paths';
import { getRelativePath } from '../../util/getRelativePath';
import { getUniqueExportIdentifierKey } from '../Identifier';
import { getApiItemIdentifier } from '../util/getApiItemIdentifier';
import { BlockQuoteNode } from './../../nodes/BlockQuote';
import { GithubSourceLinkNode } from './../../nodes/GithubSourceLink';
import { DeepCoreNode } from './../../nodes/index';
import { AnalyzeContext } from './../Context';
import { UnsupportedApiItemError } from './../util/UnsupportedApiItemError';

export function buildApiItemSourceLocationLink(
    apiItem: ApiItem,
    context: AnalyzeContext,
    syntaxKind: ts.SyntaxKind,
): DeepCoreNode {
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
    const currentApiItemPath = `${outDir}/${getPathOfExportIdentifier(
        identifier,
    )}`;
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

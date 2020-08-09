import * as path from 'path';
import * as ts from 'typescript';
import * as tsdoc from '@microsoft/tsdoc';

export interface SourceLocation {
    relativeFilePath: string;
    lineNumber: number;
}

export interface BaseDocComment {
    textRange: tsdoc.TextRange;
}

export interface ExportMetadata {
    exportNameToSourceLocation: Map<string, SourceLocation>;
    exportNameToBaseDocComment: Map<string, BaseDocComment>;
}

export interface SourceMetadata {
    syntaxKindToExportNameMetadata: Map<ts.SyntaxKind, ExportMetadata>;
}

// I don't know why this isn't part of the typings.
// eslint-disable-next-line max-len
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
const getJSDocCommentRanges = (ts as any).getJSDocCommentRanges as (
    node: ts.Node,
    text: string,
) => ts.CommentRange[] | undefined;

export function generateSourceMetadata(
    program: ts.Program,
    sourceExportFilePaths: string[],
): SourceMetadata {
    const typeChecker = program.getTypeChecker();
    const sourceMetadata: SourceMetadata = {
        syntaxKindToExportNameMetadata: new Map<
            ts.SyntaxKind,
            ExportMetadata
        >(),
    };

    for (const sourceExportFilePath of sourceExportFilePaths) {
        const sourceFile = program.getSourceFile(sourceExportFilePath);

        if (!sourceFile) {
            throw new Error('Error retrieving source file.');
        }

        const exports = typeChecker.getExportsOfModule(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            typeChecker.getSymbolAtLocation(sourceFile)!,
        );

        for (const export_ of exports) {
            let symbol = export_;

            if (export_.flags & ts.SymbolFlags.Alias) {
                const aliasedSymbol = typeChecker.getAliasedSymbol(export_);
                symbol = aliasedSymbol;
            }

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            for (const declaration of symbol.getDeclarations()!) {
                // eslint-disable-next-line max-len
                let exportMetadata = sourceMetadata.syntaxKindToExportNameMetadata.get(
                    declaration.kind,
                );

                if (exportMetadata) {
                    if (
                        exportMetadata.exportNameToSourceLocation.get(
                            symbol.name,
                        )
                    ) {
                        continue;
                    }
                } else {
                    exportMetadata = {
                        exportNameToSourceLocation: new Map<
                            string,
                            SourceLocation
                        >(),
                        exportNameToBaseDocComment: new Map<
                            string,
                            BaseDocComment
                        >(),
                    };
                    sourceMetadata.syntaxKindToExportNameMetadata.set(
                        declaration.kind,
                        exportMetadata,
                    );
                }

                const declarationSourceFile = declaration.getSourceFile();
                // eslint-disable-next-line max-len
                const declarationSourceFileText = declarationSourceFile.getFullText();
                const commentRanges = getJSDocCommentRanges(
                    declaration,
                    declarationSourceFileText,
                );

                if (commentRanges && commentRanges.length > 1) {
                    if (commentRanges.length !== 2) {
                        throw new Error("Can't have multiple base comments.");
                    }
                    if (
                        declaration.kind !== ts.SyntaxKind.FunctionDeclaration
                    ) {
                        throw new Error(
                            "Can't have a base comment for a non function declaration.",
                        );
                    }
                    const firstCommentRange = commentRanges[0];
                    const baseDocComment: BaseDocComment = {
                        textRange: tsdoc.TextRange.fromStringRange(
                            declarationSourceFileText,
                            firstCommentRange.pos,
                            firstCommentRange.end,
                        ),
                    };
                    exportMetadata.exportNameToBaseDocComment.set(
                        symbol.name,
                        baseDocComment,
                    );
                }

                exportMetadata.exportNameToSourceLocation.set(symbol.name, {
                    // eslint-disable-next-line max-len
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    relativeFilePath: path.relative(
                        process.cwd(),
                        sourceFile.fileName,
                    ),
                    lineNumber:
                        sourceFile.getLineAndCharacterOfPosition(
                            declaration.getStart(),
                        ).line + 1,
                });
            }
        }
    }

    return sourceMetadata;
}

import * as path from 'path';
import * as tsdoc from '@microsoft/tsdoc';
import * as ts from 'typescript';
import { ExportIdentifier, getUniqueExportIdentifierKey } from './Identifier';

export interface SourceLocation {
    filePath: string;
    lineNumber: number;
}

export interface BaseDocComment {
    textRange: tsdoc.TextRange;
}

export interface ExportMetadata {
    sourceLocation: SourceLocation;
    baseDocComment?: BaseDocComment;
}

export interface ExportIdentifierMetadata {
    syntaxKindToExportMetadata: Map<ts.SyntaxKind, ExportMetadata>;
}

export interface SourceMetadata {
    exportIdentifierToExportIdentifierMetadata: Map<
        string,
        ExportIdentifierMetadata
    >;
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
    packageNameToExportFilePath: Map<string, string>,
): SourceMetadata {
    const sourceMetadata: SourceMetadata = {
        exportIdentifierToExportIdentifierMetadata: new Map<
            string,
            ExportIdentifierMetadata
        >(),
    };

    for (const [packageName, exportFilePath] of packageNameToExportFilePath) {
        analyzeExportFile(program, sourceMetadata, packageName, exportFilePath);
    }

    return sourceMetadata;
}

function analyzeExportFile(
    program: ts.Program,
    sourceMetadata: SourceMetadata,
    packageName: string,
    exportFilePath: string,
): void {
    const typeChecker = program.getTypeChecker();
    const sourceFile = program.getSourceFile(exportFilePath);

    if (!sourceFile) {
        throw new Error('Error retrieving source file.');
    }

    const exports = typeChecker.getExportsOfModule(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        typeChecker.getSymbolAtLocation(sourceFile)!,
    );

    for (const exportSymbol of exports) {
        let implementationSymbol = exportSymbol;

        if (exportSymbol.flags & ts.SymbolFlags.Alias) {
            implementationSymbol = typeChecker.getAliasedSymbol(exportSymbol);
        }

        const identifier: ExportIdentifier = {
            packageName,
            exportName: exportSymbol.name,
        };

        const identifierKey = getUniqueExportIdentifierKey(identifier);
        // eslint-disable-next-line max-len
        let exportIdentifierMetadata = sourceMetadata.exportIdentifierToExportIdentifierMetadata.get(
            identifierKey,
        );

        if (!exportIdentifierMetadata) {
            exportIdentifierMetadata = {
                syntaxKindToExportMetadata: new Map<
                    ts.SyntaxKind,
                    ExportMetadata
                >(),
            };
            sourceMetadata.exportIdentifierToExportIdentifierMetadata.set(
                identifierKey,
                exportIdentifierMetadata,
            );
        }

        analyzeExport(
            exportIdentifierMetadata,
            packageName,
            exportSymbol,
            implementationSymbol,
        );
    }
}

function analyzeExport(
    exportIdentifierMetadata: ExportIdentifierMetadata,
    packageName: string,
    exportSymbol: ts.Symbol,
    implementationSymbol: ts.Symbol,
): void {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    for (const declaration of implementationSymbol.getDeclarations()!) {
        const syntaxKind = declaration.kind;
        const sourceLocation = getDeclarationSourceLocation(declaration);
        const baseDocComment = getDeclarationBaseDocComment(declaration);

        const { syntaxKindToExportMetadata } = exportIdentifierMetadata;
        const exportIdentifier = syntaxKindToExportMetadata.get(syntaxKind);

        if (exportIdentifier) {
            exportIdentifier.sourceLocation = sourceLocation;
            if (baseDocComment) {
                throw new Error(
                    `Base doc comments are not allowed after the first declaration. Export: ${getUniqueExportIdentifierKey(
                        { packageName, exportName: exportSymbol.name },
                    )}.`,
                );
            }
            continue;
        }

        exportIdentifierMetadata.syntaxKindToExportMetadata.set(syntaxKind, {
            sourceLocation,
            baseDocComment,
        });
    }
}

function getDeclarationSourceLocation(
    declaration: ts.Declaration,
): SourceLocation {
    const sourceFile = declaration.getSourceFile();

    return {
        filePath: path.relative(process.cwd(), sourceFile.fileName),
        lineNumber:
            sourceFile.getLineAndCharacterOfPosition(declaration.getStart())
                .line + 1,
    };
}

function getDeclarationBaseDocComment(
    declaration: ts.Declaration,
): BaseDocComment | undefined {
    const sourceFile = declaration.getSourceFile();
    const sourceFileText = sourceFile.getFullText();
    const commentRanges = getJSDocCommentRanges(declaration, sourceFileText);

    if (commentRanges && commentRanges.length > 1) {
        if (commentRanges.length !== 2) {
            throw new Error("Can't have multiple base comments.");
        }
        if (declaration.kind !== ts.SyntaxKind.FunctionDeclaration) {
            throw new Error(
                "Can't have a base comment for a non function declaration.",
            );
        }
        const firstCommentRange = commentRanges[0];
        return {
            textRange: tsdoc.TextRange.fromStringRange(
                sourceFileText,
                firstCommentRange.pos,
                firstCommentRange.end,
            ),
        };
    }

    return;
}

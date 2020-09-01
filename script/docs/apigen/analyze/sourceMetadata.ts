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

type ExportMap = {
    exportSymbolToIdentifier: Map<ts.Symbol, ExportIdentifier>;
    exportDeclarationToIdentifier: Map<ts.Declaration, ExportIdentifier>;
};

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

    const typeChecker = program.getTypeChecker();
    const exportSymbolToIdentifier = new Map<ts.Symbol, ExportIdentifier>();

    for (const [packageName, exportFilePath] of packageNameToExportFilePath) {
        const sourceFile = program.getSourceFile(exportFilePath);

        if (!sourceFile) {
            throw new Error('Error retrieving source file.');
        }

        const exports = typeChecker.getExportsOfModule(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            typeChecker.getSymbolAtLocation(sourceFile)!,
        );

        for (const exportSymbol of exports) {
            const identifier: ExportIdentifier = {
                packageName,
                exportName: exportSymbol.name,
            };

            exportSymbolToIdentifier.set(exportSymbol, identifier);
        }
    }

    const exportDeclarationToIdentifier = new Map<
        ts.Declaration,
        ExportIdentifier
    >(
        Array.from(exportSymbolToIdentifier).flatMap(
            ([exportSymbol, identifier]) => {
                // eslint-disable-next-line max-len
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                return exportSymbol
                    .getDeclarations()!
                    .map((declaration) => [declaration, identifier] as const);
            },
        ),
    );

    analyzeExportMap(program, sourceMetadata, {
        exportSymbolToIdentifier,
        exportDeclarationToIdentifier,
    });

    return sourceMetadata;
}

function analyzeExportMap(
    program: ts.Program,
    sourceMetadata: SourceMetadata,
    exportMap: ExportMap,
): void {
    const typeChecker = program.getTypeChecker();

    for (const [
        exportSymbol,
        identifier,
    ] of exportMap.exportSymbolToIdentifier) {
        const implementationSymbol =
            exportSymbol.flags & ts.SymbolFlags.Alias
                ? typeChecker.getAliasedSymbol(exportSymbol)
                : exportSymbol;

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

        let interfaceDeclaration: ts.InterfaceDeclaration | undefined;

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        for (const declaration of implementationSymbol.getDeclarations()!) {
            if (
                !interfaceDeclaration &&
                ts.isInterfaceDeclaration(declaration)
            ) {
                interfaceDeclaration = declaration;
            }

            analyzeDeclaration(
                exportIdentifierMetadata,
                identifier.packageName,
                exportSymbol,
                declaration,
            );
        }
    }
}

function analyzeDeclaration(
    exportIdentifierMetadata: ExportIdentifierMetadata,
    packageName: string,
    exportSymbol: ts.Symbol,
    declaration: ts.Declaration,
): void {
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
        return;
    }

    exportIdentifierMetadata.syntaxKindToExportMetadata.set(syntaxKind, {
        sourceLocation,
        baseDocComment,
    });
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
        if (!ts.isFunctionDeclaration(declaration)) {
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

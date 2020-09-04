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

export interface ExportDeclarationMetadata {
    sourceLocation: SourceLocation;
    baseDocComment?: BaseDocComment;
}

export interface ExportIdentifierMetadata {
    baseDocComment?: BaseDocComment;
    syntaxKindToExportMetadata: Map<ts.SyntaxKind, ExportDeclarationMetadata>;
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
                    ExportDeclarationMetadata
                >(),
            };
            sourceMetadata.exportIdentifierToExportIdentifierMetadata.set(
                identifierKey,
                exportIdentifierMetadata,
            );
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        for (const declaration of implementationSymbol.getDeclarations()!) {
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
    const baseDocComments = getDeclarationBaseDocComments(declaration);
    const { syntaxKindToExportMetadata } = exportIdentifierMetadata;
    const exportIdentifier = syntaxKindToExportMetadata.get(syntaxKind);

    if (exportIdentifier) {
        exportIdentifier.sourceLocation = sourceLocation;
        if (
            baseDocComments.declarationBaseDocComment ||
            baseDocComments.exportBaseDocComment
        ) {
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
        baseDocComment: baseDocComments.declarationBaseDocComment,
    });

    if (baseDocComments.exportBaseDocComment) {
        if (exportIdentifierMetadata.baseDocComment) {
            throw new Error('Duplicate base doc comments');
        }
        exportIdentifierMetadata.baseDocComment =
            baseDocComments.exportBaseDocComment;
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

interface BaseDocComments {
    exportBaseDocComment?: BaseDocComment;
    declarationBaseDocComment?: BaseDocComment;
}

// eslint-disable-next-line max-len
// https://github.com/microsoft/rushstack/blob/f2c373e49937b1ebdd639c0e9fcc5ca0075c5533/apps/api-extractor/src/analyzer/TypeScriptHelpers.ts#L183
function findFirstParentOfKind(
    node: ts.Node,
    kindToMatch: ts.SyntaxKind,
): ts.Node | undefined {
    let current: ts.Node | undefined = node.parent;

    while (current) {
        if (current.kind === kindToMatch) {
            return current;
        }
        current = current.parent;
    }

    return undefined;
}

function getCommentDeclarationNode(node: ts.Node): ts.Node {
    // eslint-disable-next-line max-len
    // https://github.com/microsoft/rushstack/blob/f2c373e49937b1ebdd639c0e9fcc5ca0075c5533/apps/api-extractor/src/collector/Collector.ts#L801
    if (ts.isVariableDeclaration(node)) {
        /* eslint-disable max-len */
        // Variable declarations are special because they can be combined into a list.  For example:
        //
        // /** A */ export /** B */ const /** C */ x = 1, /** D **/ [ /** E */ y, z] = [3, 4];
        //
        // The compiler will only emit comments A and C in the .d.ts file, so in general there isn't a well-defined
        // way to document these parts.  API Extractor requires you to break them into separate exports like this:
        //
        // /** A */ export const x = 1;
        //
        // But _getReleaseTagForDeclaration() still receives a node corresponding to "x", so we need to walk upwards
        // and find the containing statement in order for getJSDocCommentRanges() to read the comment that we expect.
        /* eslint-enable max-len */

        const statement = findFirstParentOfKind(
            node,
            ts.SyntaxKind.VariableStatement,
        );
        if (statement !== undefined) {
            // eslint-disable-next-line max-len
            // For a compound declaration, fall back to looking for C instead of A
            if (
                (statement as ts.VariableStatement).declarationList.declarations
                    .length === 1
            ) {
                return statement;
            }
        }
    }

    return node;
}

function getDeclarationBaseDocComments(
    declaration_: ts.Declaration,
): BaseDocComments {
    const declaration = getCommentDeclarationNode(declaration_);
    const sourceFile = declaration.getSourceFile();
    const sourceFileText = sourceFile.getFullText();
    const commentRanges = getJSDocCommentRanges(declaration, sourceFileText);

    if (!commentRanges || commentRanges.length <= 1) {
        return {};
    }

    const declarationCommentRanges = commentRanges.slice();
    let exportBaseDocCommentRange: ts.CommentRange | undefined;

    for (let i = 0; i < declarationCommentRanges.length; i++) {
        const commentRange = declarationCommentRanges[i];
        if (hasExportBaseDocCommentTag(sourceFileText, commentRange)) {
            if (exportBaseDocCommentRange) {
                throw new Error('Multiple export base doc comments.');
            }
            exportBaseDocCommentRange = commentRange;
            declarationCommentRanges.splice(i, 1);
        }
    }

    const exportBaseDocComment:
        | BaseDocComment
        | undefined = exportBaseDocCommentRange && {
        textRange: tsdoc.TextRange.fromStringRange(
            sourceFileText,
            exportBaseDocCommentRange.pos,
            exportBaseDocCommentRange.end,
        ),
    };

    if (declarationCommentRanges.length < 2) {
        return { exportBaseDocComment };
    }

    if (declarationCommentRanges.length > 2) {
        throw new Error("Can't have multiple base comments.");
    }

    if (!ts.isFunctionDeclaration(declaration)) {
        throw new Error(
            "Can't have a base comment for a non function declaration.",
        );
    }

    const firstCommentRange = declarationCommentRanges[0];

    return {
        exportBaseDocComment,
        declarationBaseDocComment: {
            textRange: tsdoc.TextRange.fromStringRange(
                sourceFileText,
                firstCommentRange.pos,
                firstCommentRange.end,
            ),
        },
    };
}

function hasExportBaseDocCommentTag(
    sourceFileText: string,
    commentRange: ts.CommentRange,
): boolean {
    return /@baseDoc/i.test(
        sourceFileText.slice(commentRange.pos, commentRange.end),
    );
}

import * as path from 'path';
import * as ts from 'typescript';

export interface SourceLocation {
    relativeFilePath: string;
    lineNumber: number;
}

export interface SourceExportMappings {
    exportNameToSourceLocations: Map<string, SourceLocation[]>;
    // originalNameToExportName: Map<string, string>;
}

export function generateSourceExportMappings(
    program: ts.Program,
    sourceExportFilePaths: string[],
): SourceExportMappings {
    const typeChecker = program.getTypeChecker();
    const sourceExportMappings: SourceExportMappings = {
        exportNameToSourceLocations: new Map<string, SourceLocation[]>(),
        // originalNameToExportName: new Map<string, string>(),
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
                // if (export_.name !== aliasedSymbol.name) {
                //     sourceExportMappings.originalNameToExportName.set(
                //         aliasedSymbol.name,
                //         export_.name,
                //     );
                // }
            }

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const sourceLocations = symbol
                .getDeclarations()!
                .map((declaration) => {
                    const sourceFile = declaration.getSourceFile();

                    return {
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
                    };
                });

            sourceExportMappings.exportNameToSourceLocations.set(
                export_.name,
                sourceLocations,
            );
        }
    }

    return sourceExportMappings;
}

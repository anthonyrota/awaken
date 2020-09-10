import * as os from 'os';
import * as colors from 'colors';
import * as fs from 'fs-extra';
import * as ts from 'typescript';

export function exit(): never {
    throw new Error('exiting...');
}

export function logDiagnostic(diagnostic: ts.Diagnostic): void {
    const message = ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        os.EOL,
    );
    if (diagnostic.file && diagnostic.start) {
        const location = diagnostic.file.getLineAndCharacterOfPosition(
            diagnostic.start,
        );
        console.log(
            colors.red(
                `${diagnostic.file.fileName}(${location.line + 1},${
                    location.character + 1
                }): ${message}`,
            ),
        );
    } else {
        console.log(colors.red(message));
    }
}

function getTypescriptConfig(): ts.CompilerOptions {
    const configPath = ts.findConfigFile(
        './',
        // eslint-disable-next-line @typescript-eslint/unbound-method
        ts.sys.fileExists,
    );

    if (!configPath) {
        throw new Error('Could not find valid "tsconfig.json".');
    }

    const compilerOptionsConversionResult = ts.convertCompilerOptionsFromJson(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        fs.readJSONSync(configPath).compilerOptions,
        '.',
    );

    if (compilerOptionsConversionResult.errors.length) {
        console.log(
            colors.red(
                `The following errors we're received when attempting to read the tsconfig file at ${configPath}`,
            ),
        );
        compilerOptionsConversionResult.errors.forEach(logDiagnostic);
        exit();
    }

    return compilerOptionsConversionResult.options;
}

export function createProgram(sourceFilePaths: string[]): ts.Program {
    const program = ts.createProgram(sourceFilePaths, getTypescriptConfig());
    const compilerDiagnostics = program.getSemanticDiagnostics();

    if (compilerDiagnostics.length) {
        compilerDiagnostics.forEach(logDiagnostic);
        exit();
    }

    return program;
}

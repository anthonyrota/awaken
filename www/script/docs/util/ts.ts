import * as os from 'os';
import * as colors from 'colors';
import * as ts from 'typescript';
import * as configJson from '../../../../tsconfig.json';
import { exit } from '../../exit';

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
    const compilerOptionsConversionResult = ts.convertCompilerOptionsFromJson(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        { ...configJson.compilerOptions, baseUrl: '..' },
        '.',
    );

    if (compilerOptionsConversionResult.errors.length) {
        console.log(colors.red(`TSConfig Compiler Options Conversion Errors:`));
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

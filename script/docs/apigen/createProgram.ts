import * as colors from 'colors';
import * as ts from 'typescript';
import { exit, logDiagnostic } from './util';
import { readJSON } from '../../util/fileUtil';

function getTypescriptConfig(): ts.CompilerOptions {
    const configPath = ts.findConfigFile(
        './',
        // eslint-disable-next-line @typescript-eslint/unbound-method
        ts.sys.fileExists,
    );

    if (!configPath) {
        throw new Error('Could not find valid "tsconfig.json".');
    }

    const compilerOptionsConvertionResult = ts.convertCompilerOptionsFromJson(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        readJSON(configPath).compilerOptions,
        '.',
    );

    if (compilerOptionsConvertionResult.errors.length) {
        console.log(
            colors.red(
                `The following errors we're received when attempting to read the tsconfig file at ${configPath}`,
            ),
        );
        compilerOptionsConvertionResult.errors.forEach(logDiagnostic);
        exit();
    }

    return compilerOptionsConvertionResult.options;
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

import * as os from 'os';
import * as colors from 'colors';
import * as ts from 'typescript';
import * as glob from 'glob';
import { getAbsolutePath } from '../../util/fileUtil';

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

function globResultToAbsolutePath(globResult: string): string {
    return getAbsolutePath(...globResult.split('/'));
}

export function globAbsolute(pattern: string): string[] {
    return glob.sync(pattern).map(globResultToAbsolutePath);
}

export class StringBuilder {
    private __result = '';

    public write(text: string): void {
        this.__result += text;
    }

    public writeLine(text = ''): void {
        this.write(text + '\n');
    }

    public toString(): string {
        return this.__result;
    }
}

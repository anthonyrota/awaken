import * as prettier from 'prettier';

const configFilePath = prettier.resolveConfigFile.sync();

if (configFilePath === null) {
    throw new Error('Could not resolve prettier config file path.');
}

const config = prettier.resolveConfig.sync(configFilePath);

if (!config) {
    throw new Error('Could not resolve prettier config.');
}

export enum Language {
    JSON,
    TypeScript,
}

function getParserForLanguage(language: Language): prettier.BuiltInParserName {
    switch (language) {
        case Language.JSON: {
            return 'json';
        }
        case Language.TypeScript: {
            return 'typescript';
        }
    }
}

export function format(
    source: string,
    language: Language,
    options?: prettier.Options,
): string {
    return prettier.format(source, {
        ...config,
        ...options,
        parser: getParserForLanguage(language),
    });
}

export function formatWithCursor(
    source: string,
    cursorOffset: number,
    language: Language,
    options?: prettier.Options,
): prettier.CursorResult {
    return prettier.formatWithCursor(source, {
        ...config,
        ...options,
        cursorOffset,
        parser: getParserForLanguage(language),
    } as prettier.CursorOptions);
}

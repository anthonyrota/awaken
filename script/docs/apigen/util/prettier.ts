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

export function format(source: string, language: Language): string {
    return prettier.format(source, {
        ...config,
        parser: language === Language.JSON ? 'json' : 'typescript',
    });
}

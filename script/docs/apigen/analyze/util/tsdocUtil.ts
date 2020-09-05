import {
    AedocDefinitions,
    ApiItem,
    ApiDocumentedItem,
} from '@microsoft/api-extractor-model';
import {
    TSDocTagDefinition,
    TSDocTagSyntaxKind,
    DocComment,
    DocBlock,
    StandardTags,
    TSDocConfiguration,
    TSDocParser,
    TextRange,
} from '@microsoft/tsdoc';
import * as colors from 'colors';
import { UnsupportedApiItemError } from './UnsupportedApiItemError';

const seeTag = new TSDocTagDefinition({
    tagName: '@see',
    syntaxKind: TSDocTagSyntaxKind.BlockTag,
});

export const hideDocTag = new TSDocTagDefinition({
    tagName: '@hideDoc',
    syntaxKind: TSDocTagSyntaxKind.ModifierTag,
});

AedocDefinitions.tsdocConfiguration.addTagDefinitions(
    [seeTag, hideDocTag],
    true,
);

export function getDocComment(apiItem: ApiItem): DocComment {
    if (!(apiItem instanceof ApiDocumentedItem)) {
        throw new UnsupportedApiItemError(apiItem, 'Not documented.');
    }

    if (!apiItem.tsdocComment) {
        throw new UnsupportedApiItemError(apiItem, 'No docComment property.');
    }

    return apiItem.tsdocComment;
}

function getBlocksOfTag(
    blocks: readonly DocBlock[],
    tag: TSDocTagDefinition,
): DocBlock[] {
    return blocks.filter(
        (block) =>
            block.blockTag.tagNameWithUpperCase === tag.tagNameWithUpperCase,
    );
}

export function getExampleBlocks(docComment: DocComment): DocBlock[] {
    return getBlocksOfTag(docComment.customBlocks, StandardTags.example);
}

export function getSeeBlocks(docComment: DocComment): DocBlock[] {
    return getBlocksOfTag(docComment.customBlocks, seeTag);
}

export interface ParseDocCommentParameters {
    textRange: TextRange;
    configuration: TSDocConfiguration;
}

export function parseDocComment(
    parameters: ParseDocCommentParameters,
): DocComment {
    const { textRange } = parameters;
    const tsdocParser = new TSDocParser(parameters.configuration);
    const parserContext = tsdocParser.parseRange(textRange);
    const docComment = parserContext.docComment;

    const errorMessages = parserContext.log.messages.filter(
        (message) => !message.toString().includes('@see'),
    );

    if (errorMessages.length !== 0) {
        console.log(colors.red('Errors parsing TSDoc comment.'));
        console.log(
            colors.red(textRange.buffer.slice(textRange.pos, textRange.end)),
        );
        for (const message of errorMessages) {
            console.log(colors.red(message.toString()));
        }
    }

    return docComment;
}

function addTagDefinitions(
    configuration: TSDocConfiguration,
    baseConfiguration: TSDocConfiguration,
): void {
    for (const tagDefinition of baseConfiguration.tagDefinitions) {
        configuration.addTagDefinition(tagDefinition);
        if (baseConfiguration.isTagSupported(tagDefinition)) {
            configuration.setSupportForTag(tagDefinition, true);
        }
    }
}

export const baseDocTag = new TSDocTagDefinition({
    tagName: '@baseDoc',
    syntaxKind: TSDocTagSyntaxKind.ModifierTag,
});

export const exportBaseDocCommentConfiguration = new TSDocConfiguration();
addTagDefinitions(
    exportBaseDocCommentConfiguration,
    AedocDefinitions.tsdocConfiguration,
);

exportBaseDocCommentConfiguration.addTagDefinitions([baseDocTag], true);

import {
    AedocDefinitions,
    ApiItem,
    ApiDocumentedItem,
} from '@microsoft/api-extractor-model';
import * as tsdoc from '@microsoft/tsdoc';
import { UnsupportedApiItemError } from './UnsupportedApiItemError';

const seeTag = new tsdoc.TSDocTagDefinition({
    tagName: '@see',
    syntaxKind: tsdoc.TSDocTagSyntaxKind.BlockTag,
});

AedocDefinitions.tsdocConfiguration.addTagDefinition(seeTag);

export function getDocComment(apiItem: ApiItem): tsdoc.DocComment {
    if (!(apiItem instanceof ApiDocumentedItem)) {
        throw new UnsupportedApiItemError(apiItem, 'Not documented.');
    }

    if (!apiItem.tsdocComment) {
        throw new UnsupportedApiItemError(apiItem, 'No docComment property.');
    }

    return apiItem.tsdocComment;
}

function getBlocksOfTag(
    blocks: readonly tsdoc.DocBlock[],
    tag: tsdoc.TSDocTagDefinition,
): tsdoc.DocBlock[] {
    return blocks.filter(
        (block) =>
            block.blockTag.tagNameWithUpperCase === tag.tagNameWithUpperCase,
    );
}

export function getExampleBlocks(
    docComment: tsdoc.DocComment,
): tsdoc.DocBlock[] {
    return getBlocksOfTag(docComment.customBlocks, tsdoc.StandardTags.example);
}

export function getSeeBlocks(docComment: tsdoc.DocComment): tsdoc.DocBlock[] {
    return getBlocksOfTag(docComment.customBlocks, seeTag);
}

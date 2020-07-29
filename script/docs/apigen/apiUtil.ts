import * as fs from 'fs-extra';
import * as path from 'path';
import * as colors from 'colors';
import * as tsdoc from '@microsoft/tsdoc';
import * as aeModel from '@microsoft/api-extractor-model';
import { SourceExportMappings } from './sourceExportMappings';
import { StringBuilder } from './util';

interface Context {
    sourceExportMappings: SourceExportMappings;
    apiModel: aeModel.ApiModel;
    memberNameToApiPathMap: Map<string, string>;
}

function getApiItemName(apiItem: aeModel.ApiItem): string {
    const match = /^(.+)_\d+$/.exec(apiItem.displayName);
    if (match) {
        return match[1];
    }
    return apiItem.displayName;
}

const coreApiPathTag = new tsdoc.TSDocTagDefinition({
    tagName: '@coreApiPath',
    syntaxKind: tsdoc.TSDocTagSyntaxKind.InlineTag,
});

const seeTag = new tsdoc.TSDocTagDefinition({
    tagName: '@see',
    syntaxKind: tsdoc.TSDocTagSyntaxKind.BlockTag,
});

aeModel.AedocDefinitions.tsdocConfiguration.addTagDefinitions([
    coreApiPathTag,
    seeTag,
]);

function getCustomInlineTagValue(
    node: tsdoc.DocNode,
    inlineTag: tsdoc.TSDocTagDefinition,
): string | undefined {
    let tagContent: string | undefined;

    function walkNode(node: tsdoc.DocNode): true | void {
        if (node.kind === tsdoc.DocNodeKind.InlineTag) {
            const inlineNode = node as tsdoc.DocInlineTag;
            if (
                inlineNode.tagNameWithUpperCase ===
                inlineTag.tagNameWithUpperCase
            ) {
                tagContent = inlineNode.tagContent;
                return true;
            }
        }

        for (const child of node.getChildNodes()) {
            if (walkNode(child)) {
                return true;
            }
        }
    }

    walkNode(node);

    return tagContent;
}

class UnsupportedApiItemError extends Error {
    constructor(apiItem: aeModel.ApiItem, reason: string) {
        super();
        this.name = 'UnsupportedApiItemError';
        this.message = `The following api item ${
            apiItem.displayName
        } with package scoped name ${apiItem.getScopedNameWithinPackage()} and kind ${
            apiItem.kind
        } is not supported: ${reason}`;
    }
}

function getDocComment(apiItem: aeModel.ApiItem): tsdoc.DocComment {
    if (!(apiItem instanceof aeModel.ApiDocumentedItem)) {
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

function extractCoreApiPath(apiItem: aeModel.ApiItem): string | void {
    const docComment = getDocComment(apiItem);
    const coreApiPathTagValue = getCustomInlineTagValue(
        docComment,
        coreApiPathTag,
    );

    if (coreApiPathTagValue) {
        const name = getApiItemName(apiItem);
        const parsedValue = coreApiPathTagValue.replace(/<name>/g, name);

        return parsedValue;
    }
}

interface ExtractedCustomBlocks {
    exampleBlocks: tsdoc.DocBlock[];
    seeBlocks: tsdoc.DocBlock[];
}

function extractCustomBlocks(apiItem: aeModel.ApiItem): ExtractedCustomBlocks {
    const docComment = getDocComment(apiItem);
    const exampleBlocks = getBlocksOfTag(
        docComment.customBlocks,
        tsdoc.StandardTags.example,
    );
    const seeBlocks = getBlocksOfTag(docComment.customBlocks, seeTag);

    return {
        exampleBlocks,
        seeBlocks,
    };
}
extractCustomBlocks;

interface ExportImplementation<T extends aeModel.ApiItem> {
    addImplementation(apiItem: T): void;
    hasImplementation(): boolean;
    writeAsMarkdown(output: StringBuilder): void;
}

/* eslint-disable no-inner-declarations */
// eslint-disable-next-line @typescript-eslint/no-namespace
namespace MarkdownRenderUtil {
    function unwrapText(text: string): string {
        return text.replace(/[\n\r]+/g, ' ');
    }

    export function escapeMarkdown(text: string): string {
        return (
            text
                // // Markdown.
                // .replace(/[*_{}()#+\-.!]/g, '\\$&')
                // HTML.
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;')
        );
    }

    function getRelativePath(from: string, to: string): string {
        if (from === to) {
            return '';
        }
        const fromSplit = from.split(/[/\\]/g);
        fromSplit.pop();
        const toSplit = to.split(/[/\\]/g);
        const name = toSplit.pop();
        if (!name) {
            throw new Error('No.');
        }
        let i = 0;
        for (; i < fromSplit.length && i < toSplit.length; i++) {
            if (fromSplit[i] !== toSplit[i]) {
                break;
            }
        }
        const start =
            '../'.repeat(fromSplit.length - i) + toSplit.slice(i).join('/');
        return start === ''
            ? name
            : start + (start.endsWith('/') ? '' : '/') + name;
    }

    export function writeLinkToApiItem(
        output: StringBuilder,
        currentApiItemName: string,
        apiItemName: string,
        context: Context,
    ): void {
        const currentApiItemPath = context.memberNameToApiPathMap.get(
            currentApiItemName,
        );
        const apiItemPath = context.memberNameToApiPathMap.get(apiItemName);
        if (!currentApiItemPath || !apiItemPath) {
            throw new Error('No more coding today.');
        }
        const relativePath = getRelativePath(currentApiItemPath, apiItemPath);

        if (relativePath) {
            output.write(`<a href="${relativePath}.md">${apiItemName}</a>`);
        } else {
            output.write(
                `<a href="#${apiItemName
                    .toLowerCase()
                    .replace(/ /g, '-')}">${apiItemName}</a>`,
            );
        }
    }

    export function writeExcerptTokens(
        output: StringBuilder,
        apiItem: aeModel.ApiItem,
        excerpt: aeModel.Excerpt,
        context: Context,
    ): void {
        if (!excerpt.text.trim()) {
            throw new Error(`Received excerpt with no declaration.`);
        }

        output.write('<pre>');
        if (apiItem.kind === aeModel.ApiItemKind.Variable) {
            output.write('var ');
        }
        for (const token of excerpt.spannedTokens) {
            let tokenText = unwrapText(token.text);
            if (token === excerpt.spannedTokens[0]) {
                tokenText = tokenText.replace(/^export declare /, '');
            }

            if (
                token.kind === aeModel.ExcerptTokenKind.Reference &&
                token.canonicalReference &&
                // Idk why this is a thing.
                !token.canonicalReference.toString().endsWith('!~value')
            ) {
                const result = context.apiModel.resolveDeclarationReference(
                    token.canonicalReference,
                    undefined,
                );
                if (result.errorMessage) {
                    console.log(
                        `Error resolving excerpt token ${colors.underline.bold(
                            tokenText,
                        )} reference: ${colors.red(
                            result.errorMessage,
                        )}. The original signature is ${colors.underline.bold(
                            unwrapText(excerpt.text),
                        )}`,
                    );
                }
                if (
                    !result.resolvedApiItem &&
                    // Idek.
                    ['Subject', 'Event'].includes(token.text)
                ) {
                    writeLinkToApiItem(
                        output,
                        getApiItemName(apiItem),
                        token.text,
                        context,
                    );
                    continue;
                }
                if (result.resolvedApiItem) {
                    writeLinkToApiItem(
                        output,
                        getApiItemName(apiItem),
                        getApiItemName(result.resolvedApiItem),
                        context,
                    );
                    continue;
                }
            }

            output.write(escapeMarkdown(tokenText));
        }
        output.write('</pre>');
    }
}
/* eslint-enable no-inner-declarations */

class ExportFunctionImplementation
    implements ExportImplementation<aeModel.ApiFunction> {
    private _displayName?: string;
    private _overloads: aeModel.ApiFunction[] = [];

    constructor(private _context: Context) {}

    public addImplementation(apiFunction: aeModel.ApiFunction): void {
        const apiFunctionName = getApiItemName(apiFunction);
        if (this._displayName === undefined) {
            this._displayName = apiFunctionName;
        } else if (this._displayName !== apiFunctionName) {
            throw new UnsupportedApiItemError(
                apiFunction,
                `Expected displayName property equal to ${this._displayName}.`,
            );
        }
        this._overloads.push(apiFunction);
    }

    public hasImplementation(): boolean {
        return this._displayName !== undefined;
    }

    public writeAsMarkdown(output: StringBuilder): void {
        if (this._displayName === undefined) {
            throw new Error('Not implemented.');
        }

        this._overloads.sort((a, b) => a.overloadIndex - b.overloadIndex);
        this._overloads.forEach((overload, i) => {
            if (overload.overloadIndex !== i + 1) {
                throw new UnsupportedApiItemError(
                    overload,
                    `Invalid overload index ${
                        overload.overloadIndex
                    } expected ${i + 1}. Total overloads: ${
                        this._overloads.length
                    }.`,
                );
            }
        });

        for (const fn of this._overloads) {
            MarkdownRenderUtil.writeExcerptTokens(
                output,
                fn,
                fn.excerpt,
                this._context,
            );
            output.writeLine();
        }
    }

    // `
    // [summary]
    // [examples]
    // ...
    // [overloads]
    // [overload 1]
    // [signature]
    // [description]
    // [params]
    // [returns]
    // ...
    // [see]
    // `;
}

class ExportInterfaceImplementation
    implements ExportImplementation<aeModel.ApiInterface> {
    private _apiInterface?: aeModel.ApiInterface;

    constructor(private _context: Context) {}

    public addImplementation(apiInterface: aeModel.ApiInterface) {
        if (this._apiInterface) {
            throw new UnsupportedApiItemError(
                apiInterface,
                'Duplicate api interface.',
            );
        }
        this._apiInterface = apiInterface;
    }

    public hasImplementation(): boolean {
        return !!this._apiInterface;
    }

    public writeAsMarkdown(output: StringBuilder): void {
        if (!this._apiInterface) {
            throw new Error('Not implemented.');
        }

        MarkdownRenderUtil.writeExcerptTokens(
            output,
            this._apiInterface,
            this._apiInterface.excerpt,
            this._context,
        );
        output.writeLine();
    }
}

class ExportTypeAliasImplementation
    implements ExportImplementation<aeModel.ApiTypeAlias> {
    private _apiTypeAlias?: aeModel.ApiTypeAlias;

    constructor(private _context: Context) {}

    public addImplementation(apiTypeAlias: aeModel.ApiTypeAlias) {
        if (this._apiTypeAlias) {
            throw new UnsupportedApiItemError(
                apiTypeAlias,
                'Duplicate api type alias.',
            );
        }
        this._apiTypeAlias = apiTypeAlias;
    }

    public hasImplementation(): boolean {
        return !!this._apiTypeAlias;
    }

    public writeAsMarkdown(output: StringBuilder): void {
        if (!this._apiTypeAlias) {
            throw new Error('Not implemented.');
        }

        MarkdownRenderUtil.writeExcerptTokens(
            output,
            this._apiTypeAlias,
            this._apiTypeAlias.excerpt,
            this._context,
        );
        output.writeLine();
    }
}

class ExportVariableImplementation
    implements ExportImplementation<aeModel.ApiVariable> {
    private _apiVariable?: aeModel.ApiVariable;

    constructor(private _context: Context) {}

    public addImplementation(apiVariable: aeModel.ApiVariable) {
        if (this._apiVariable) {
            throw new UnsupportedApiItemError(
                apiVariable,
                'Duplicate api variable.',
            );
        }
        this._apiVariable = apiVariable;
    }

    public hasImplementation(): boolean {
        return !!this._apiVariable;
    }

    public writeAsMarkdown(output: StringBuilder): void {
        if (!this._apiVariable) {
            throw new Error('Not implemented.');
        }

        MarkdownRenderUtil.writeExcerptTokens(
            output,
            this._apiVariable,
            this._apiVariable.excerpt,
            this._context,
        );
        output.writeLine();
    }
}

class ExportImplementationGroup {
    private _displayName?: string;
    private _implementations = new Map<
        aeModel.ApiItemKind,
        ExportImplementation<aeModel.ApiItem>
    >([
        [
            aeModel.ApiItemKind.Function,
            new ExportFunctionImplementation(this._context),
        ],
        [
            aeModel.ApiItemKind.Interface,
            new ExportInterfaceImplementation(this._context),
        ],
        [
            aeModel.ApiItemKind.TypeAlias,
            new ExportTypeAliasImplementation(this._context),
        ],
        [
            aeModel.ApiItemKind.Variable,
            new ExportVariableImplementation(this._context),
        ],
    ]);

    constructor(private _context: Context) {}

    public addImplementation(apiItem: aeModel.ApiItem): void {
        const impl = this._implementations.get(apiItem.kind);

        if (!impl) {
            throw new UnsupportedApiItemError(
                apiItem,
                `Invalid kind ${apiItem.kind}`,
            );
        }

        if (this._displayName === undefined) {
            this._displayName = getApiItemName(apiItem);
        } else if (this._displayName !== getApiItemName(apiItem)) {
            throw new UnsupportedApiItemError(
                apiItem,
                `Expected displayName property equal to ${this._displayName}.`,
            );
        }

        impl.addImplementation(apiItem);
    }

    public writeAsMarkdown(output: StringBuilder): void {
        if (
            this._displayName === undefined ||
            Array.from(this._implementations).every(
                ([, impl]) => !impl.hasImplementation(),
            )
        ) {
            throw new Error('No implementations.');
        }
        output.writeLine(`## \`${this._displayName}\``);
        output.writeLine();
        let passedFirstImpl = false;
        for (const [, impl] of this._implementations) {
            if (impl.hasImplementation()) {
                if (passedFirstImpl) {
                    output.writeLine();
                } else {
                    passedFirstImpl = true;
                }
                impl.writeAsMarkdown(output);
            }
        }
    }
}

function getReleaseTag(apiItem: aeModel.ApiItem): aeModel.ReleaseTag {
    if (!aeModel.ApiReleaseTagMixin.isBaseClassOf(apiItem)) {
        throw new UnsupportedApiItemError(apiItem, 'No release tag.');
    }

    return apiItem.releaseTag;
}

class ApiPage {
    private _exportImplementationGroups = new Map<
        string,
        ExportImplementationGroup
    >();

    constructor(private _context: Context) {}

    public addApiItem(apiItem: aeModel.ApiItem): void {
        if (getReleaseTag(apiItem) !== aeModel.ReleaseTag.Public) {
            throw new UnsupportedApiItemError(
                apiItem,
                'Non public Api Items are not supported.',
            );
        }

        const apiItemName = getApiItemName(apiItem);

        let exportImplementationGroup = this._exportImplementationGroups.get(
            apiItemName,
        );

        if (!exportImplementationGroup) {
            exportImplementationGroup = new ExportImplementationGroup(
                this._context,
            );
            this._exportImplementationGroups.set(
                apiItemName,
                exportImplementationGroup,
            );
        }

        exportImplementationGroup.addImplementation(apiItem);
    }

    public renderAsMarkdown(): string {
        const output = new StringBuilder();

        output.writeLine(
            '<!-- Do not edit this file. It is automatically generated by a build script. -->',
        );
        output.writeLine();

        let isNotFirst = false;
        for (const [, implGroup] of this._exportImplementationGroups) {
            if (isNotFirst) {
                output.writeLine();
            } else {
                isNotFirst = true;
            }
            implGroup.writeAsMarkdown(output);
        }

        return output.toString();
    }
}

export class ApiPageMap {
    private _pathToPage = new Map<string, ApiPage>();
    private _context: Context;

    constructor(
        apiModel: aeModel.ApiModel,
        sourceExportMappings: SourceExportMappings,
    ) {
        this._context = {
            sourceExportMappings,
            apiModel,
            memberNameToApiPathMap: new Map<string, string>(),
        };
        const previousPackageNames = new Set<string>();

        for (const package_ of apiModel.members) {
            if (package_.kind !== aeModel.ApiItemKind.Package) {
                throw new UnsupportedApiItemError(
                    package_,
                    'Expected to be a package.',
                );
            }

            const members = (package_ as aeModel.ApiPackage).entryPoints[0]
                .members;
            const packageNames = new Set<string>();

            for (const apiItem of members) {
                const memberName = getApiItemName(apiItem);

                if (previousPackageNames.has(memberName)) {
                    throw new Error(
                        `Duplicate api item name ${memberName} between packages.`,
                    );
                }
                packageNames.add(memberName);

                const apiPath = extractCoreApiPath(apiItem);

                if (!apiPath) {
                    continue;
                }

                if (this._context.memberNameToApiPathMap.has(apiPath)) {
                    throw new UnsupportedApiItemError(
                        apiItem,
                        'Only one item of export name can have @coreApiPath tag.',
                    );
                }

                this._context.memberNameToApiPathMap.set(memberName, apiPath);
            }

            for (const packageName of packageNames) {
                previousPackageNames.add(packageName);
            }
        }

        if (
            previousPackageNames.size !==
            this._context.memberNameToApiPathMap.size
        ) {
            throw new Error(
                `Some api items don't have api path tags. previousPackageNames.size ${previousPackageNames.size}, memberNameToApiPathMap.size ${this._context.memberNameToApiPathMap.size}`,
            );
        }

        for (const package_ of apiModel.members as aeModel.ApiPackage[]) {
            const members = package_.entryPoints[0].members;

            for (const apiItem of members) {
                const memberName = getApiItemName(apiItem);
                const apiPath = this._context.memberNameToApiPathMap.get(
                    memberName,
                );

                if (!apiPath) {
                    throw new UnsupportedApiItemError(
                        apiItem,
                        'No @coreApiPath found.',
                    );
                }

                this._getPage(apiPath).addApiItem(apiItem);
            }
        }
    }

    private _getPage(path: string): ApiPage {
        let page = this._pathToPage.get(path);
        if (!page) {
            page = new ApiPage(this._context);
            this._pathToPage.set(path, page);
        }
        return page;
    }

    private _forEachPage(
        callback: (path: string, page: ApiPage) => void,
    ): void {
        for (const [path, page] of this._pathToPage) {
            callback(path, page);
        }
    }

    public renderAsMarkdownToDirectoryMap(): RenderedDirectoryMap {
        const renderedDirectoryMap = new RenderedDirectoryMap();

        this._forEachPage((path, page) => {
            renderedDirectoryMap.addContentAtPath(
                path + '.md',
                page.renderAsMarkdown(),
            );
        });

        return renderedDirectoryMap;
    }
}

class Folder {
    files = new Map<string, string>();
    folders = new Map<string, Folder>();
}

class RenderedDirectoryMap {
    private _rootFolder = new Folder();

    public addContentAtPath(path: string, content: string): void {
        const splitPath = path.split('/');
        const fileName = splitPath.pop();

        if (!fileName) {
            throw new Error(`Empty path.`);
        }

        let folder = this._rootFolder;
        for (const dirName of splitPath) {
            let nestedFolder = folder.folders.get(dirName);

            if (!nestedFolder) {
                nestedFolder = new Folder();
                folder.folders.set(dirName, nestedFolder);
            }

            folder = nestedFolder;
        }

        if (folder.files.has(fileName)) {
            throw new Error(`Duplicate path ${path}`);
        }

        folder.files.set(fileName, content);
    }

    public writeToDirectory(dirName: string): Promise<void> {
        return this._writeFolderToPath(dirName, this._rootFolder);
    }

    private async _writeFolderToPath(
        dirName: string,
        folder: Folder,
    ): Promise<void> {
        await fs.ensureDir(dirName);

        const promises: Promise<unknown>[] = [];

        for (const [fileName, fileContent] of folder.files) {
            promises.push(
                fs.writeFile(
                    path.join(dirName, fileName),
                    fileContent,
                    'utf-8',
                ),
            );
        }

        for (const [folderName, nestedFolder] of folder.folders) {
            promises.push(
                this._writeFolderToPath(
                    path.join(dirName, folderName),
                    nestedFolder,
                ),
            );
        }

        await Promise.all(promises);
    }
}

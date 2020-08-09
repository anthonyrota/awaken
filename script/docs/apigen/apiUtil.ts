import * as ts from 'typescript';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as aeModel from '@microsoft/api-extractor-model';
import * as writeUtil from './writeUtil';
import * as output from './output';
import {
    TableOfContentsInlineReference,
    TableOfContentsNestedReference,
    TableOfContentsMainReference,
    TableOfContents,
} from '../pageMetadata';
import { SourceMetadata } from './sourceMetadata';
import { APIPageData, assertMappedApiItemNames, forEachPage } from './paths';

interface ExportImplementation<T extends aeModel.ApiItem> {
    readonly actualKind: aeModel.ApiItemKind;
    readonly simplifiedKind: string;
    addImplementation(apiItem: T): void;
    hasImplementation(): boolean;
    writeAsMarkdown(output: output.Container): void;
}

class ExportFunctionImplementation
    implements ExportImplementation<aeModel.ApiFunction> {
    public readonly actualKind = aeModel.ApiItemKind.Function;
    public readonly simplifiedKind = 'Function';
    private _displayName?: string;
    private _overloads: aeModel.ApiFunction[] = [];

    constructor(private _context: writeUtil.Context) {}

    public addImplementation(apiFunction: aeModel.ApiFunction): void {
        const apiFunctionName = writeUtil.getApiItemName(apiFunction);
        if (this._displayName === undefined) {
            this._displayName = apiFunctionName;
        } else if (this._displayName !== apiFunctionName) {
            throw new writeUtil.UnsupportedApiItemError(
                apiFunction,
                `Expected displayName property equal to ${this._displayName}.`,
            );
        }
        this._overloads.push(apiFunction);
    }

    public hasImplementation(): boolean {
        return this._displayName !== undefined;
    }

    public writeAsMarkdown(out: output.Container): void {
        if (this._displayName === undefined) {
            throw new Error('Not implemented.');
        }

        this._overloads.sort((a, b) => a.overloadIndex - b.overloadIndex);
        this._overloads.forEach((overload, i) => {
            if (overload.overloadIndex !== i + 1) {
                throw new writeUtil.UnsupportedApiItemError(
                    overload,
                    `Invalid overload index ${
                        overload.overloadIndex
                    } expected ${i + 1}. Total overloads: ${
                        this._overloads.length
                    }.`,
                );
            }
        });

        const context = this._context;

        writeUtil.writeApiItemAnchor(
            out,
            this._overloads[0],
            context,
            this.simplifiedKind,
        );
        const baseDocContainer = new output.Container();
        writeUtil.writeBaseDoc(
            baseDocContainer,
            this._overloads[0],
            context,
            ts.SyntaxKind.FunctionDeclaration,
        );

        let didNotOnlyWriteSignature = true;
        const overloadsContainer = new output.Container();

        for (const fn of this._overloads) {
            const _didNotOnlyWriteSignature = didNotOnlyWriteSignature;
            const overloadContainer = new output.Container();
            const didWriteSummary = writeUtil.writeSummary(
                overloadContainer,
                fn,
                context,
            );
            const didWriteParameters = writeUtil.writeParameters(
                overloadContainer,
                fn,
                context,
            );
            const didWriteExamples = writeUtil.writeExamples(
                overloadContainer,
                fn,
                context,
            );
            const didWriteSeeBlocks = writeUtil.writeSeeBlocks(
                overloadContainer,
                fn,
                context,
            );
            didNotOnlyWriteSignature =
                didWriteSummary ||
                didWriteParameters ||
                didWriteExamples ||
                didWriteSeeBlocks;
            if (_didNotOnlyWriteSignature || didNotOnlyWriteSignature) {
                writeUtil.writeSignature(overloadsContainer, fn, context);
                if (didNotOnlyWriteSignature) {
                    overloadsContainer.addChildren(
                        ...overloadContainer.getChildren(),
                    );
                }
            } else {
                writeUtil.writeSignatureExcerpt(
                    overloadsContainer,
                    fn,
                    context,
                );
            }
        }

        out.addChildren(...baseDocContainer.getChildren());
        out.addChildren(...overloadsContainer.getChildren());
    }
}

class ExportInterfaceImplementation
    implements ExportImplementation<aeModel.ApiInterface> {
    public readonly actualKind = aeModel.ApiItemKind.Interface;
    public readonly simplifiedKind = 'Interface';
    private _apiInterface?: aeModel.ApiInterface;

    constructor(private _context: writeUtil.Context) {}

    public addImplementation(apiInterface: aeModel.ApiInterface) {
        if (this._apiInterface) {
            throw new writeUtil.UnsupportedApiItemError(
                apiInterface,
                'Duplicate api interface.',
            );
        }
        this._apiInterface = apiInterface;
    }

    public hasImplementation(): boolean {
        return !!this._apiInterface;
    }

    public writeAsMarkdown(output: output.Container): void {
        const interface_ = this._apiInterface;

        if (!interface_) {
            throw new Error('Not implemented.');
        }

        const context = this._context;

        writeUtil.writeApiItemAnchor(
            output,
            interface_,
            context,
            this.simplifiedKind,
        );
        writeUtil.writeBaseDoc(
            output,
            interface_,
            context,
            ts.SyntaxKind.InterfaceDeclaration,
        );
        writeUtil.writeSignature(output, interface_, context);
        writeUtil.writeSummary(output, interface_, context);
        writeUtil.writeExamples(output, interface_, context);
        writeUtil.writeSeeBlocks(output, interface_, context);
    }
}

class ExportTypeAliasImplementation
    implements ExportImplementation<aeModel.ApiTypeAlias> {
    public readonly actualKind = aeModel.ApiItemKind.TypeAlias;
    public readonly simplifiedKind = 'Type';
    private _apiTypeAlias?: aeModel.ApiTypeAlias;

    constructor(private _context: writeUtil.Context) {}

    public addImplementation(apiTypeAlias: aeModel.ApiTypeAlias) {
        if (this._apiTypeAlias) {
            throw new writeUtil.UnsupportedApiItemError(
                apiTypeAlias,
                'Duplicate api type alias.',
            );
        }
        this._apiTypeAlias = apiTypeAlias;
    }

    public hasImplementation(): boolean {
        return !!this._apiTypeAlias;
    }

    public writeAsMarkdown(output: output.Container): void {
        const typeAlias = this._apiTypeAlias;

        if (!typeAlias) {
            throw new Error('Not implemented.');
        }

        const context = this._context;

        writeUtil.writeApiItemAnchor(
            output,
            typeAlias,
            context,
            this.simplifiedKind,
        );
        writeUtil.writeBaseDoc(
            output,
            typeAlias,
            context,
            ts.SyntaxKind.TypeAliasDeclaration,
        );
        writeUtil.writeSignature(output, typeAlias, context);
        writeUtil.writeSummary(output, typeAlias, context);
        writeUtil.writeExamples(output, typeAlias, context);
        writeUtil.writeSeeBlocks(output, typeAlias, context);
    }
}

class ExportVariableImplementation
    implements ExportImplementation<aeModel.ApiVariable> {
    public readonly actualKind = aeModel.ApiItemKind.Variable;
    public readonly simplifiedKind = 'Variable';
    private _apiVariable?: aeModel.ApiVariable;

    constructor(private _context: writeUtil.Context) {}

    public addImplementation(apiVariable: aeModel.ApiVariable) {
        if (this._apiVariable) {
            throw new writeUtil.UnsupportedApiItemError(
                apiVariable,
                'Duplicate api variable.',
            );
        }
        this._apiVariable = apiVariable;
    }

    public hasImplementation(): boolean {
        return !!this._apiVariable;
    }

    public writeAsMarkdown(output: output.Container): void {
        const variable = this._apiVariable;

        if (!variable) {
            throw new Error('Not implemented.');
        }

        const context = this._context;

        writeUtil.writeApiItemAnchor(
            output,
            variable,
            context,
            this.simplifiedKind,
        );
        writeUtil.writeBaseDoc(
            output,
            variable,
            context,
            ts.SyntaxKind.VariableDeclaration,
        );
        writeUtil.writeSignature(output, variable, context);
        writeUtil.writeSummary(output, variable, context);
        writeUtil.writeExamples(output, variable, context);
        writeUtil.writeSeeBlocks(output, variable, context);
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

    constructor(private _context: writeUtil.Context) {}

    public addImplementation(apiItem: aeModel.ApiItem): void {
        const impl = this._implementations.get(apiItem.kind);

        if (!impl) {
            throw new writeUtil.UnsupportedApiItemError(
                apiItem,
                `Invalid kind ${apiItem.kind}`,
            );
        }

        if (this._displayName === undefined) {
            this._displayName = writeUtil.getApiItemName(apiItem);
        } else if (this._displayName !== writeUtil.getApiItemName(apiItem)) {
            throw new writeUtil.UnsupportedApiItemError(
                apiItem,
                `Expected displayName property equal to ${this._displayName}.`,
            );
        }

        impl.addImplementation(apiItem);
    }

    public hasMultipleImplementations(): boolean {
        let num = 0;
        for (const [, impl] of this._implementations) {
            if (impl.hasImplementation()) {
                if (num === 1) {
                    return true;
                }
                num++;
            }
        }
        return false;
    }

    public *getImplementations(): IterableIterator<
        ExportImplementation<aeModel.ApiItem>
    > {
        for (const impl of this._implementations.values()) {
            if (impl.hasImplementation()) {
                yield impl;
            }
        }
    }

    public writeAsMarkdown(container: output.Container): void {
        if (
            this._displayName === undefined ||
            Array.from(this._implementations).every(
                ([, impl]) => !impl.hasImplementation(),
            )
        ) {
            throw new Error('No implementations.');
        }
        container.addChild(
            new output.Heading().addChild(
                new output.CodeSpan().addChild(
                    new output.PlainText(this._displayName),
                ),
            ),
        );
        for (const [, impl] of this._implementations) {
            if (impl.hasImplementation()) {
                impl.writeAsMarkdown(container);
            }
        }
    }
}

function getReleaseTag(apiItem: aeModel.ApiItem): aeModel.ReleaseTag {
    if (!aeModel.ApiReleaseTagMixin.isBaseClassOf(apiItem)) {
        throw new writeUtil.UnsupportedApiItemError(apiItem, 'No release tag.');
    }

    return apiItem.releaseTag;
}

class ApiPage {
    private _nameToImplGroup = new Map<string, ExportImplementationGroup>();

    constructor(
        private _context: writeUtil.Context,
        private _pageData: APIPageData,
    ) {
        for (const item of _pageData.items) {
            this._addApiItemName(item.main);
            if (item.nested) {
                for (const name of item.nested) {
                    this._addApiItemName(name);
                }
            }
        }
    }

    private _addApiItemName(name: string): void {
        const implGroup = new ExportImplementationGroup(this._context);
        this._nameToImplGroup.set(name, implGroup);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        for (const apiItem of this._context.apiItemsByMemberName.get(name)!) {
            if (getReleaseTag(apiItem) !== aeModel.ReleaseTag.Public) {
                throw new writeUtil.UnsupportedApiItemError(
                    apiItem,
                    'Non public api items are not supported.',
                );
            }

            implGroup.addImplementation(apiItem);
        }
    }

    private _getApiItemNameInlineReferences(
        name: string,
    ): TableOfContentsInlineReference[] | undefined {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const implGroup = this._nameToImplGroup.get(name)!;
        if (!implGroup.hasMultipleImplementations()) {
            return;
        }
        const references: TableOfContentsInlineReference[] = [];
        for (const impl of implGroup.getImplementations()) {
            references.push({
                text: impl.simplifiedKind,
                // eslint-disable-next-line max-len
                url_hash_text: writeUtil.getMultiKindApiItemAnchorNameFromNameAndKind(
                    name,
                    impl.actualKind,
                ),
            });
        }
        return references;
    }

    public renderAsMarkdown(): string {
        const tableOfContents: TableOfContents = [];
        for (const item of this._pageData.items) {
            const reference: TableOfContentsMainReference = {
                text: item.main,
                url_hash_text: item.main.toLowerCase(),
            };
            const inlineReferences = this._getApiItemNameInlineReferences(
                item.main,
            );
            if (inlineReferences) {
                reference.inline_references = inlineReferences;
            }
            if (item.nested) {
                reference.nested_references = [];
                for (const name of item.nested) {
                    const nestedReference: TableOfContentsNestedReference = {
                        text: name,
                        url_hash_text: name.toLowerCase(),
                    };
                    // eslint-disable-next-line max-len
                    const inlineReferences = this._getApiItemNameInlineReferences(
                        name,
                    );
                    if (inlineReferences) {
                        nestedReference.inline_references = inlineReferences;
                    }
                    reference.nested_references.push(nestedReference);
                }
            }
            tableOfContents.push(reference);
        }

        const page = new output.Page({
            title: this._pageData.title,
            table_of_contents: tableOfContents,
        });

        for (const [, implGroup] of this._nameToImplGroup) {
            implGroup.writeAsMarkdown(page);
        }

        const mdOutput = new output.MarkdownOutput();
        page.writeAsMarkdown(mdOutput);
        return mdOutput.toString();
    }
}

export class ApiPageMap {
    private _pathToPage = new Map<string, ApiPage>();
    private _context: writeUtil.Context;

    constructor(apiModel: aeModel.ApiModel, sourceMetadata: SourceMetadata) {
        const apiItemsByMemberName = new Map<string, aeModel.ApiItem[]>();

        this._context = {
            sourceMetadata,
            apiModel,
            apiItemsByMemberName,
        };

        for (const package_ of apiModel.members) {
            if (package_.kind !== aeModel.ApiItemKind.Package) {
                throw new writeUtil.UnsupportedApiItemError(
                    package_,
                    'Expected to be a package.',
                );
            }

            const members = (package_ as aeModel.ApiPackage).entryPoints[0]
                .members;
            const apiItemsByMemberName_ = new Map<string, aeModel.ApiItem[]>();

            for (const apiItem of members) {
                const memberName = writeUtil.getApiItemName(apiItem);

                if (apiItemsByMemberName.has(memberName)) {
                    throw new writeUtil.UnsupportedApiItemError(
                        apiItem,
                        `Duplicate api item name ${memberName} between packages.`,
                    );
                }

                let apiItems = apiItemsByMemberName_.get(memberName);
                if (!apiItems) {
                    apiItems = [];
                    apiItemsByMemberName_.set(memberName, apiItems);
                }
                apiItems.push(apiItem);
            }

            for (const [k, v] of apiItemsByMemberName_) {
                apiItemsByMemberName.set(k, v);
            }
        }

        assertMappedApiItemNames(apiItemsByMemberName.keys());

        forEachPage((pathName, pageData) => {
            const page = new ApiPage(this._context, pageData);
            this._pathToPage.set(pathName, page);
        });
    }

    public renderAsMarkdownToDirectoryMap(): RenderedDirectoryMap {
        const renderedDirectoryMap = new RenderedDirectoryMap();

        for (const [path, page] of this._pathToPage) {
            renderedDirectoryMap.addContentAtPath(
                path + '.md',
                page.renderAsMarkdown(),
            );
        }

        return renderedDirectoryMap;
    }
}

class Folder {
    public files = new Map<string, string>();
    public folders = new Map<string, Folder>();
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

    public writeToDirectory(dirName: string): Promise<unknown> {
        return this._writeFolderToPath(dirName, this._rootFolder);
    }

    private async _writeFolderToPath(
        dirName: string,
        folder: Folder,
    ): Promise<unknown> {
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

        return Promise.all(promises);
    }
}

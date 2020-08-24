import * as aeModel from '@microsoft/api-extractor-model';
import * as ts from 'typescript';
import {
    TableOfContentsInlineReference,
    TableOfContentsNestedReference,
    TableOfContentsMainReference,
    TableOfContents,
} from '../pageMetadata';
import {
    buildApiItemAnchor,
    getMultiKindApiItemAnchorNameFromIdentifierAndKind,
} from './analyze/build/buildApiItemAnchor';
import { buildApiItemBaseDoc } from './analyze/build/buildApiItemBaseDoc';
import { buildApiItemExamples } from './analyze/build/buildApiItemExamples';
import { buildApiItemParameters } from './analyze/build/buildApiItemParameters';
import { buildApiItemSeeBlocks } from './analyze/build/buildApiItemSeeBlocks';
import {
    buildApiItemSignature,
    buildApiItemSignatureExcerpt,
} from './analyze/build/buildApiItemSignature';
import { buildApiItemSourceLocationLink } from './analyze/build/buildApiItemSourceLocationLink';
import { buildApiItemSummary } from './analyze/build/buildApiItemSummary';
import { AnalyzeContext } from './analyze/Context';
import {
    ExportIdentifier,
    getUniqueExportIdentifierKey,
} from './analyze/Identifier';
import { SourceMetadata } from './analyze/sourceMetadata';
import { getApiItemIdentifier } from './analyze/util/getApiItemIdentifier';
import { UnsupportedApiItemError } from './analyze/util/UnsupportedApiItemError';
import { DeepCoreNode, Node } from './nodes';
import { BoldNode } from './nodes/Bold';
import { CodeSpanNode } from './nodes/CodeSpan';
import { CollapsibleSectionNode } from './nodes/CollapsibleSection';
import { ContainerNode, ContainerBase } from './nodes/Container';
import { DoNotEditCommentNode } from './nodes/DoNotEditComment';
import { HeadingNode } from './nodes/Heading';
import { LocalPageLinkNode } from './nodes/LocalPageLink';
import { PageNode } from './nodes/Page';
import { PageTitleNode } from './nodes/PageTitle';
import { PlainTextNode } from './nodes/PlainText';
import { SubheadingNode } from './nodes/Subheading';
import { TableOfContentsNode } from './nodes/TableOfContents';
import { APIPageData, packageIdentifierToPath, packageDataList } from './paths';
import { renderDeepCoreNodeAsMarkdown } from './render/markdown';
import { simplifyDeepCoreNode } from './simplify';
import * as folderUtil from './util/Folder';

interface ExportImplementation<T extends aeModel.ApiItem> {
    readonly actualKind: aeModel.ApiItemKind;
    readonly simplifiedKind: string;
    addImplementation(apiItem: T): void;
    hasImplementation(): boolean;
    writeAsMarkdown(output: ContainerBase<DeepCoreNode>): void;
}

function addChild<ChildNode extends Node>(
    container: ContainerBase<ChildNode>,
    child: ChildNode | undefined,
): boolean {
    if (child) {
        container.children.push(child);
        return true;
    }
    return false;
}

function addChildren<ChildNode extends Node>(
    container: ContainerBase<ChildNode>,
    ...children: (ChildNode | undefined)[]
): boolean {
    let didAddAny = false;
    for (const child of children) {
        const didAdd = addChild(container, child);
        if (didAdd) {
            didAddAny = true;
        }
    }
    return didAddAny;
}

class ExportFunctionImplementation
    implements ExportImplementation<aeModel.ApiFunction> {
    public readonly actualKind = aeModel.ApiItemKind.Function;
    public readonly simplifiedKind = 'Function';
    private _identifierKey?: string;
    private _overloads: aeModel.ApiFunction[] = [];

    constructor(private _context: AnalyzeContext) {}

    public addImplementation(apiFunction: aeModel.ApiFunction): void {
        const identifierKey = getUniqueExportIdentifierKey(
            getApiItemIdentifier(apiFunction),
        );
        if (this._identifierKey === undefined) {
            this._identifierKey = identifierKey;
        } else if (this._identifierKey !== identifierKey) {
            throw new UnsupportedApiItemError(
                apiFunction,
                `Expected identifier key property equal to ${this._identifierKey}.`,
            );
        }
        this._overloads.push(apiFunction);
    }

    public hasImplementation(): boolean {
        return this._identifierKey !== undefined;
    }

    public writeAsMarkdown(out: ContainerBase<DeepCoreNode>): void {
        if (this._identifierKey === undefined) {
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

        const context = this._context;

        addChild(
            out,
            buildApiItemAnchor(
                this._overloads[0],
                context,
                this.simplifiedKind,
            ),
        );
        const baseDocContainer = ContainerNode<DeepCoreNode>({});
        addChild(
            baseDocContainer,
            buildApiItemBaseDoc(
                this._overloads[0],
                context,
                ts.SyntaxKind.FunctionDeclaration,
            ),
        );
        addChild(
            baseDocContainer,
            buildApiItemSourceLocationLink(
                this._overloads[0],
                context,
                ts.SyntaxKind.FunctionDeclaration,
            ),
        );

        let didNotOnlyWriteSignature = true;
        const overloadsContainer = ContainerNode<DeepCoreNode>({});

        for (const fn of this._overloads) {
            const _didNotOnlyWriteSignature = didNotOnlyWriteSignature;
            const overloadContainer = ContainerNode<DeepCoreNode>({});
            didNotOnlyWriteSignature = addChildren(
                overloadContainer,
                buildApiItemSummary(fn, context),
                buildApiItemParameters(fn, context),
                buildApiItemExamples(fn, context),
                buildApiItemSeeBlocks(fn, context),
            );
            if (_didNotOnlyWriteSignature || didNotOnlyWriteSignature) {
                addChild(
                    overloadsContainer,
                    buildApiItemSignature(fn, context),
                );
                if (didNotOnlyWriteSignature) {
                    overloadsContainer.children.push(overloadContainer);
                }
            } else {
                addChild(
                    overloadsContainer,
                    buildApiItemSignatureExcerpt(fn, context),
                );
            }
        }

        out.children.push(...baseDocContainer.children);
        out.children.push(...overloadsContainer.children);
    }
}

class ExportInterfaceImplementation
    implements ExportImplementation<aeModel.ApiInterface> {
    public readonly actualKind = aeModel.ApiItemKind.Interface;
    public readonly simplifiedKind = 'Interface';
    private _apiInterface?: aeModel.ApiInterface;

    constructor(private _context: AnalyzeContext) {}

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

    public writeAsMarkdown(output: ContainerBase<DeepCoreNode>): void {
        const interface_ = this._apiInterface;

        if (!interface_) {
            throw new Error('Not implemented.');
        }

        const context = this._context;

        addChildren(
            output,
            buildApiItemAnchor(interface_, context, this.simplifiedKind),
            buildApiItemSourceLocationLink(
                interface_,
                context,
                ts.SyntaxKind.InterfaceDeclaration,
            ),
            buildApiItemSignature(interface_, context),
            buildApiItemSummary(interface_, context),
            buildApiItemExamples(interface_, context),
            buildApiItemSeeBlocks(interface_, context),
        );
    }
}

class ExportTypeAliasImplementation
    implements ExportImplementation<aeModel.ApiTypeAlias> {
    public readonly actualKind = aeModel.ApiItemKind.TypeAlias;
    public readonly simplifiedKind = 'Type';
    private _apiTypeAlias?: aeModel.ApiTypeAlias;

    constructor(private _context: AnalyzeContext) {}

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

    public writeAsMarkdown(output: ContainerBase<DeepCoreNode>): void {
        const typeAlias = this._apiTypeAlias;

        if (!typeAlias) {
            throw new Error('Not implemented.');
        }

        const context = this._context;

        addChildren(
            output,
            buildApiItemAnchor(typeAlias, context, this.simplifiedKind),
            buildApiItemSourceLocationLink(
                typeAlias,
                context,
                ts.SyntaxKind.TypeAliasDeclaration,
            ),
            buildApiItemSignature(typeAlias, context),
            buildApiItemSummary(typeAlias, context),
            buildApiItemExamples(typeAlias, context),
            buildApiItemSeeBlocks(typeAlias, context),
        );
    }
}

class ExportVariableImplementation
    implements ExportImplementation<aeModel.ApiVariable> {
    public readonly actualKind = aeModel.ApiItemKind.Variable;
    public readonly simplifiedKind = 'Variable';
    private _apiVariable?: aeModel.ApiVariable;

    constructor(private _context: AnalyzeContext) {}

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

    public writeAsMarkdown(output: ContainerBase<DeepCoreNode>): void {
        const variable = this._apiVariable;

        if (!variable) {
            throw new Error('Not implemented.');
        }

        const context = this._context;

        addChildren(
            output,
            buildApiItemAnchor(variable, context, this.simplifiedKind),
            buildApiItemSourceLocationLink(
                variable,
                context,
                ts.SyntaxKind.VariableDeclaration,
            ),
            buildApiItemSignature(variable, context),
            buildApiItemSummary(variable, context),
            buildApiItemExamples(variable, context),
            buildApiItemSeeBlocks(variable, context),
        );
    }
}

class ExportImplementationGroup {
    private _identifier?: ExportIdentifier;
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

    constructor(private _context: AnalyzeContext) {}

    public addImplementation(apiItem: aeModel.ApiItem): void {
        const impl = this._implementations.get(apiItem.kind);

        if (!impl) {
            throw new UnsupportedApiItemError(
                apiItem,
                `Invalid kind ${apiItem.kind}`,
            );
        }

        const identifier = getApiItemIdentifier(apiItem);
        const identifierKey = getUniqueExportIdentifierKey(identifier);
        if (this._identifier === undefined) {
            this._identifier = identifier;
        } else {
            const existingIdentifierKey = getUniqueExportIdentifierKey(
                this._identifier,
            );
            if (existingIdentifierKey !== identifierKey) {
                throw new UnsupportedApiItemError(
                    apiItem,
                    `Expected identifier key equal to ${existingIdentifierKey}.`,
                );
            }
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

    public writeAsMarkdown(container: ContainerBase<DeepCoreNode>): void {
        if (
            this._identifier === undefined ||
            [...this._implementations].every(
                ([, impl]) => !impl.hasImplementation(),
            )
        ) {
            throw new Error('No implementations.');
        }
        container.children.push(
            HeadingNode({
                children: [
                    CodeSpanNode({
                        children: [
                            PlainTextNode({
                                text: this._identifier.exportName,
                            }),
                        ],
                    }),
                ],
            }),
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
        throw new UnsupportedApiItemError(apiItem, 'No release tag.');
    }

    return apiItem.releaseTag;
}

class ApiPage {
    private _nameToImplGroup = new Map<string, ExportImplementationGroup>();

    constructor(
        private _context: AnalyzeContext,
        private _pageData: APIPageData,
        private _packageName: string,
    ) {
        for (const item of _pageData.items) {
            this._addExportIdentifier({
                packageName: _packageName,
                exportName: item.main,
            });
            if (item.nested) {
                for (const name of item.nested) {
                    this._addExportIdentifier({
                        packageName: _packageName,
                        exportName: name,
                    });
                }
            }
        }
    }

    private _addExportIdentifier(identifier: ExportIdentifier): void {
        const implGroup = new ExportImplementationGroup(this._context);
        this._nameToImplGroup.set(identifier.exportName, implGroup);
        for (const apiItem of this._context.getApiItemsByExportIdentifier(
            identifier,
        )) {
            if (getReleaseTag(apiItem) !== aeModel.ReleaseTag.Public) {
                throw new UnsupportedApiItemError(
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
                url_hash_text: getMultiKindApiItemAnchorNameFromIdentifierAndKind(
                    {
                        packageName: this._packageName,
                        exportName: name,
                    },
                    impl.actualKind,
                ),
            });
        }
        return references;
    }

    public build(): PageNode<DeepCoreNode> {
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

        const page = PageNode<DeepCoreNode>({
            metadata: {
                title: this._pageData.pageTitle,
                tableOfContents: tableOfContents,
            },
        });

        for (const [, implGroup] of this._nameToImplGroup) {
            implGroup.writeAsMarkdown(page);
        }

        return page;
    }
}

export class ApiPageMap {
    private _pathToPage = new Map<string, ApiPage>();
    private _context: AnalyzeContext;

    constructor(apiModel: aeModel.ApiModel, sourceMetadata: SourceMetadata) {
        const memberIdentifierKeys = new Set<string>();
        this._context = new AnalyzeContext(sourceMetadata, apiModel);

        for (const package_ of apiModel.members) {
            if (package_.kind !== aeModel.ApiItemKind.Package) {
                throw new UnsupportedApiItemError(
                    package_,
                    'Expected to be a package.',
                );
            }

            const members = (package_ as aeModel.ApiPackage).entryPoints[0]
                .members;

            for (const apiItem of members) {
                const memberIdentifier = getApiItemIdentifier(apiItem);
                memberIdentifierKeys.add(
                    getUniqueExportIdentifierKey(memberIdentifier),
                );
                const apiItems = this._context.getApiItemsByExportIdentifier(
                    memberIdentifier,
                    [],
                );
                apiItems.push(apiItem);
            }
        }

        for (const memberIdentifier of memberIdentifierKeys) {
            if (!packageIdentifierToPath.has(memberIdentifier)) {
                throw new Error(`${memberIdentifier} not mapped.`);
            }
        }

        if (memberIdentifierKeys.size !== packageIdentifierToPath.size) {
            throw new Error('Not same number of names mapped.');
        }

        for (const apiPackageData of packageDataList) {
            for (const pageData of apiPackageData.pages) {
                const page = new ApiPage(
                    this._context,
                    pageData,
                    apiPackageData.packageName,
                );
                this._pathToPage.set(
                    `${apiPackageData.packageDirectory}/${pageData.pageDirectory}`,
                    page,
                );
            }
        }
    }

    public build(): Map<string, PageNode<DeepCoreNode>> {
        return new Map(
            Array.from(this._pathToPage, ([path, page]) => {
                const pageNode = page.build();
                simplifyDeepCoreNode(pageNode);
                return [path, pageNode];
            }),
        );
    }
}

export function renderPageNodeMapToFolder(
    pageNodeMap: Map<string, PageNode<DeepCoreNode>>,
): folderUtil.Folder {
    const outFolder = folderUtil.Folder();

    for (const [path, page] of pageNodeMap) {
        folderUtil.addFileToFolder(
            outFolder,
            `${path}.md`,
            renderDeepCoreNodeAsMarkdown(page),
        );
    }

    interface GetPageLinksFunction {
        (inBase: boolean): {
            headingLink: LocalPageLinkNode<DeepCoreNode>;
            tableOfContents: TableOfContentsNode;
        }[];
    }

    const packageDirectoryToPageSummaryMap = new Map<
        string,
        {
            isOneIndexPagePackage: boolean;
            pageTitleTextNode: PlainTextNode;
            getPageLinks: GetPageLinksFunction;
        }
    >();

    for (const packageData of packageDataList) {
        const { pages } = packageData;
        const isOneIndexPagePackage =
            pages.length === 1 && pages[0].pageDirectory === '_index';
        const pageTitleTextNode = PlainTextNode({
            text: `API Reference - ${packageData.packageName}`,
        });
        const getPageLinks: GetPageLinksFunction = (inBase) =>
            pages.map((pageData) => {
                const pageName = isOneIndexPagePackage
                    ? 'README'
                    : pageData.pageDirectory;
                const pagePath = inBase
                    ? `${packageData.packageDirectory}/${pageName}`
                    : pageName;
                return {
                    headingLink: LocalPageLinkNode({
                        destination: pagePath,
                        children: [PlainTextNode({ text: pageData.pageTitle })],
                    }),
                    tableOfContents: TableOfContentsNode({
                        // eslint-disable-next-line max-len
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        tableOfContents: pageNodeMap.get(
                            `${packageData.packageDirectory}/${pageData.pageDirectory}`,
                        )!.metadata.tableOfContents,
                        relativePagePath: pagePath,
                    }),
                };
            });

        packageDirectoryToPageSummaryMap.set(packageData.packageDirectory, {
            isOneIndexPagePackage,
            pageTitleTextNode,
            getPageLinks,
        });

        if (isOneIndexPagePackage) {
            folderUtil.moveFileInFolder(
                outFolder,
                `${packageData.packageDirectory}/_index.md`,
                `${packageData.packageDirectory}/README.md`,
            );
            continue;
        }

        const contents = ContainerNode({
            children: [
                DoNotEditCommentNode({}),
                PageTitleNode({
                    children: [pageTitleTextNode],
                }),
                ...getPageLinks(false).flatMap(
                    ({ headingLink, tableOfContents }) => [
                        HeadingNode({
                            children: [headingLink],
                        }),
                        tableOfContents,
                    ],
                ),
            ],
        });

        folderUtil.addFileToFolder(
            outFolder,
            `${packageData.packageDirectory}/README.md`,
            renderDeepCoreNodeAsMarkdown(contents),
        );
    }

    const packageSummaries = [
        ...packageDirectoryToPageSummaryMap.entries(),
    ].flatMap<DeepCoreNode>(([packageDirectory, packageSummary]) => {
        const {
            isOneIndexPagePackage,
            pageTitleTextNode,
            getPageLinks,
        } = packageSummary;

        const heading = HeadingNode({
            children: [
                LocalPageLinkNode({
                    destination: `${packageDirectory}/README`,
                    children: [pageTitleTextNode],
                }),
            ],
        });

        if (isOneIndexPagePackage) {
            const { tableOfContents } = getPageLinks(true)[0];
            return [heading, tableOfContents];
        }

        return [
            heading,
            CollapsibleSectionNode({
                summaryNode: BoldNode({
                    children: [PlainTextNode({ text: 'Table of Contents' })],
                }),
                children: getPageLinks(true).flatMap(
                    ({ headingLink, tableOfContents }) => [
                        SubheadingNode({
                            children: [headingLink],
                        }),
                        tableOfContents,
                    ],
                ),
            }),
        ];
    });

    const contents = ContainerNode<DeepCoreNode>({
        children: [
            DoNotEditCommentNode({}),
            PageTitleNode({
                children: [PlainTextNode({ text: 'Awaken API Reference' })],
            }),
            // TODO.
            // eslint-disable-next-line max-len
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            ...packageSummaries,
        ],
    });

    folderUtil.addFileToFolder(
        outFolder,
        'README.md',
        renderDeepCoreNodeAsMarkdown(contents),
    );

    return outFolder;
}

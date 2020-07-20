/* eslint-disable max-len */
/**
 * Thanks to Microsoft Corporation and the tsdoc team for the ideas/implementations behind this script:
 * https://github.com/microsoft/tsdoc/blob/master/api-demo/src/advancedDemo.ts
 * https://github.com/microsoft/tsdoc/blob/master/tsdoc/src/emitters/TSDocEmitter.ts
 * https://github.com/microsoft/tsdoc/blob/master/playground/src/DocHtmlView.tsx
 * The TSDoc project is licensed under MIT, and it's license can be found at ./vendor/licenses/@microsoft/tsdoc/LICENSE
 */
/* eslint-enable max-len */

import * as fileUtil from './fileUtil';
import * as ts from 'typescript';
import * as tsdoc from '@microsoft/tsdoc';
import * as colors from 'colors';
import * as os from 'os';
import { getAbsolutePath } from './fileUtil';

const verbose = process.argv.some((arg) => arg === '--verbose' || arg === '-v');

function isDeclarationKind(kind: ts.SyntaxKind): boolean {
    return (
        kind === ts.SyntaxKind.ArrowFunction ||
        kind === ts.SyntaxKind.BindingElement ||
        kind === ts.SyntaxKind.ClassDeclaration ||
        kind === ts.SyntaxKind.ClassExpression ||
        kind === ts.SyntaxKind.Constructor ||
        kind === ts.SyntaxKind.EnumDeclaration ||
        kind === ts.SyntaxKind.EnumMember ||
        kind === ts.SyntaxKind.ExportSpecifier ||
        kind === ts.SyntaxKind.FunctionDeclaration ||
        kind === ts.SyntaxKind.FunctionExpression ||
        kind === ts.SyntaxKind.GetAccessor ||
        kind === ts.SyntaxKind.ImportClause ||
        kind === ts.SyntaxKind.ImportEqualsDeclaration ||
        kind === ts.SyntaxKind.ImportSpecifier ||
        kind === ts.SyntaxKind.InterfaceDeclaration ||
        kind === ts.SyntaxKind.JsxAttribute ||
        kind === ts.SyntaxKind.MethodDeclaration ||
        kind === ts.SyntaxKind.MethodSignature ||
        kind === ts.SyntaxKind.ModuleDeclaration ||
        kind === ts.SyntaxKind.NamespaceExportDeclaration ||
        kind === ts.SyntaxKind.NamespaceImport ||
        kind === ts.SyntaxKind.Parameter ||
        kind === ts.SyntaxKind.PropertyAssignment ||
        kind === ts.SyntaxKind.PropertyDeclaration ||
        kind === ts.SyntaxKind.PropertySignature ||
        kind === ts.SyntaxKind.SetAccessor ||
        kind === ts.SyntaxKind.ShorthandPropertyAssignment ||
        kind === ts.SyntaxKind.TypeAliasDeclaration ||
        kind === ts.SyntaxKind.TypeParameter ||
        kind === ts.SyntaxKind.VariableDeclaration ||
        kind === ts.SyntaxKind.JSDocTypedefTag ||
        kind === ts.SyntaxKind.JSDocCallbackTag ||
        kind === ts.SyntaxKind.JSDocPropertyTag
    );
}

function getJSDocCommentRanges(node: ts.Node, text: string): ts.CommentRange[] {
    const commentRanges: ts.CommentRange[] = [];

    switch (node.kind) {
        case ts.SyntaxKind.Parameter:
        case ts.SyntaxKind.TypeParameter:
        case ts.SyntaxKind.FunctionExpression:
        case ts.SyntaxKind.ArrowFunction:
        case ts.SyntaxKind.ParenthesizedExpression:
            commentRanges.push(
                ...(ts.getTrailingCommentRanges(text, node.pos) || []),
            );
            break;
    }
    commentRanges.push(...(ts.getLeadingCommentRanges(text, node.pos) || []));

    // True if the comment starts with '/**' but not if it is '/**/'
    return commentRanges.filter(
        (comment) =>
            text.charCodeAt(comment.pos + 1) ===
                0x2a /* ts.CharacterCodes.asterisk */ &&
            text.charCodeAt(comment.pos + 2) ===
                0x2a /* ts.CharacterCodes.asterisk */ &&
            text.charCodeAt(comment.pos + 3) !==
                0x2f /* ts.CharacterCodes.slash */,
    );
}

interface FoundComment {
    compilerNode: ts.Node;
    textRange: tsdoc.TextRange;
}

function walkCompilerAstAndFindComments(
    node: ts.Node,
    foundComments: FoundComment[],
): void {
    const buffer: string = node.getSourceFile().getFullText();

    if (isDeclarationKind(node.kind)) {
        const comments: ts.CommentRange[] = getJSDocCommentRanges(node, buffer);

        if (comments.length > 0) {
            // Only extract the first comment;
            const comment = comments[0];
            if (verbose) {
                console.log({
                    nodeFullText: node.getFullText(),
                    commentFullText: buffer.slice(comment.pos, comment.end),
                });
            }
            foundComments.push({
                compilerNode: node,
                textRange: tsdoc.TextRange.fromStringRange(
                    buffer,
                    comment.pos,
                    comment.end,
                ),
            });
            return;
        }
    }

    return node.forEachChild((child) => {
        walkCompilerAstAndFindComments(child, foundComments);
    });
}

function dumpTSDocTree(docNode: tsdoc.DocNode, indent: string): void {
    let dumpText = '';
    if (docNode instanceof tsdoc.DocExcerpt) {
        const content: string = docNode.content.toString();
        dumpText +=
            colors.gray(`${indent}* ${docNode.excerptKind}=`) +
            colors.cyan(JSON.stringify(content));
    } else {
        dumpText += `${indent}- ${docNode.kind}`;
    }
    console.log(dumpText);

    for (const child of docNode.getChildNodes()) {
        dumpTSDocTree(child, indent + '  ');
    }
}

const awakenBaseGroupTag = new tsdoc.TSDocTagDefinition({
    tagName: '@awakenBaseGroup',
    syntaxKind: tsdoc.TSDocTagSyntaxKind.InlineTag,
});

const awakenGroupTag = new tsdoc.TSDocTagDefinition({
    tagName: '@awakenGroup',
    syntaxKind: tsdoc.TSDocTagSyntaxKind.InlineTag,
});

function getCustomInlineTagValue(
    node: tsdoc.DocNode,
    tagName: typeof awakenBaseGroupTag.tagName | typeof awakenGroupTag.tagName,
): string | undefined {
    let tagContent: string | undefined;

    function walkNode(node: tsdoc.DocNode): true | void {
        if (node.kind === tsdoc.DocNodeKind.InlineTag) {
            const inlineNode = node as tsdoc.DocInlineTag;
            if (inlineNode.tagName === tagName) {
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

const tsdocConfiguration = new tsdoc.TSDocConfiguration();

tsdocConfiguration.addTagDefinitions([awakenBaseGroupTag, awakenGroupTag]);

function parseTSDoc(foundComment: FoundComment): tsdoc.DocComment | undefined {
    if (verbose) {
        console.log(os.EOL + colors.green('Comment to be parsed:') + os.EOL);
        console.log(colors.gray('<<<<<<'));
        console.log(foundComment.textRange.toString());
        console.log(colors.gray('>>>>>>'));

        console.log(
            os.EOL +
                'Invoking TSDocParser with custom configuration...' +
                os.EOL,
        );
    }
    const tsdocParser: tsdoc.TSDocParser = new tsdoc.TSDocParser(
        tsdocConfiguration,
    );
    const parserContext: tsdoc.ParserContext = tsdocParser.parseRange(
        foundComment.textRange,
    );
    const docComment: tsdoc.DocComment = parserContext.docComment;

    if (!docComment.modifierTagSet.hasTag(tsdoc.StandardTags.public)) {
        if (verbose) {
            console.log(
                colors.red('This comment is not documenting a public API'),
            );
        }
        return;
    }

    if (verbose) {
        console.log(colors.green('Parser Log Messages:') + os.EOL);
    }

    if (parserContext.log.messages.length === 0) {
        if (verbose) {
            console.log('No errors or warnings.');
        }
    } else {
        if (!verbose) {
            console.log(os.EOL + colors.green('Parser Log Messages:') + os.EOL);
        }
        // eslint-disable-next-line max-len
        const sourceFile: ts.SourceFile = foundComment.compilerNode.getSourceFile();
        for (const message of parserContext.log.messages) {
            // eslint-disable-next-line max-len
            const location: ts.LineAndCharacter = sourceFile.getLineAndCharacterOfPosition(
                message.textRange.pos,
            );
            const formattedMessage: string =
                `${sourceFile.fileName}(${location.line + 1},${
                    location.character + 1
                    // eslint-disable-next-line max-len
                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                }):` + ` [TSDoc] ${message}`;
            console.log(formattedMessage);
        }
    }

    if (verbose) {
        console.log(
            os.EOL + colors.green("Visiting TSDoc's DocNode tree") + os.EOL,
        );
        dumpTSDocTree(docComment, '');
        console.log();
    }

    return docComment;
}

type ParsedComment = {
    groupTagValue: string | undefined;
    baseGroupTagValue: string | undefined;
    nodeName: string;
    compilerNode: ts.Node;
    docComment: tsdoc.DocComment;
};

interface ExtractDocCommentsResult {
    parsedComments: ParsedComment[];
}

function extractDocCommentsFromFiles(
    sourceFilePaths: string[],
    nameReplacementMap: Map<string, string>,
): ExtractDocCommentsResult {
    // eslint-disable-next-line max-len
    const compilerOptions: ts.CompilerOptions = ts.convertCompilerOptionsFromJson(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        fileUtil.readJSON(getAbsolutePath('tsconfig.json')).compilerOptions,
        '.',
    ).options;

    const program: ts.Program = ts.createProgram(
        sourceFilePaths,
        compilerOptions,
    );

    // eslint-disable-next-line max-len
    const compilerDiagnostics: ReadonlyArray<ts.Diagnostic> = program.getSemanticDiagnostics();
    if (compilerDiagnostics.length > 0) {
        for (const diagnostic of compilerDiagnostics) {
            const message: string = ts.flattenDiagnosticMessageText(
                diagnostic.messageText,
                os.EOL,
            );
            if (diagnostic.file) {
                // eslint-disable-next-line max-len
                const location: ts.LineAndCharacter = diagnostic.file.getLineAndCharacterOfPosition(
                    // eslint-disable-next-line max-len
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    diagnostic.start!,
                );
                const formattedMessage: string =
                    `${diagnostic.file.fileName}(${location.line + 1},${
                        location.character + 1
                    }):` + ` [TypeScript] ${message}`;
                console.log(colors.red(formattedMessage));
            } else {
                console.log(colors.red(message));
            }
        }
    } else if (verbose) {
        console.log('No compiler errors or warnings.');
    }

    const parsedComments: ParsedComment[] = [];

    for (const sourceFileName of sourceFilePaths) {
        const sourceFile: ts.SourceFile | undefined = program.getSourceFile(
            sourceFileName,
        );
        if (!sourceFile) {
            throw new Error('Error retrieving source file');
        }

        if (verbose) {
            console.log(
                os.EOL +
                    colors.green('Scanning compiler AST for code comments...') +
                    os.EOL,
            );
        }

        const foundComments: FoundComment[] = [];

        walkCompilerAstAndFindComments(sourceFile, foundComments);

        if (foundComments.length === 0) {
            if (verbose) {
                console.log(
                    colors.red(
                        'No code comments were found in the input file - ' +
                            sourceFileName,
                    ),
                );
            }
        } else {
            for (const comment of foundComments) {
                const parsedDocComment = parseTSDoc(comment);
                if (!parsedDocComment) {
                    continue;
                }

                // eslint-disable-next-line max-len
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
                const identifier = (comment.compilerNode as any)
                    .name as ts.Identifier;
                if (!identifier) {
                    throw new Error('node.name does not exist.');
                }

                let nodeName = identifier.escapedText as string;
                if (typeof nodeName !== 'string') {
                    throw new Error('nodeName is not a string');
                }
                nodeName = nameReplacementMap.get(nodeName) || nodeName;

                const baseGroupTagValue = getCustomInlineTagValue(
                    parsedDocComment,
                    awakenBaseGroupTag.tagName,
                );
                const groupTagValue = getCustomInlineTagValue(
                    parsedDocComment,
                    awakenGroupTag.tagName,
                );

                parsedComments.push({
                    groupTagValue,
                    baseGroupTagValue,
                    nodeName,
                    compilerNode: comment.compilerNode,
                    docComment: parsedDocComment,
                });
            }
        }
    }

    return {
        parsedComments,
    };
}

const sourceFiles = [
    getAbsolutePath('packages', 'core', 'dist', 'awakenCore.d.ts'),
    getAbsolutePath('packages', 'testing', 'dist', 'awakenTesting.d.ts'),
];
// eslint-disable-next-line max-len
const exportAsRegex = /^export \{ ([_a-zA-Z][_a-zA-Z0-9]*) as ([_a-zA-Z][_a-zA-Z0-9]*) \}$/gm;
const nameReplacementMap = new Map<string, string>();
const docTagRegex = /@([a-zA-Z]+)[^a-zA-Z/]/gm;
const docTagNames = new Set<string>();
for (const sourceFile of sourceFiles) {
    const source = fileUtil.readFile(sourceFile);
    let match: RegExpExecArray | null;

    while ((match = exportAsRegex.exec(source))) {
        nameReplacementMap.set(match[1], match[2]);
    }

    while ((match = docTagRegex.exec(source))) {
        docTagNames.add(match[1]);
    }
}

const { parsedComments } = extractDocCommentsFromFiles(
    sourceFiles,
    nameReplacementMap,
);

if (nameReplacementMap.size > 0) {
    console.log(
        colors.green(`${nameReplacementMap.size} names were replaced:`) +
            os.EOL,
    );
    for (const [sourceFileName, replacedName] of nameReplacementMap) {
        console.log(sourceFileName + colors.red(' -> ') + replacedName);
    }
} else {
    console.log(colors.green('No names were replaced.'));
}

console.log(
    os.EOL + colors.green(`${docTagNames.size} unique tags were found:`),
);
const docTagArray = Array.from(docTagNames);
docTagArray.sort();
for (const docTagName of docTagArray) {
    console.log(' '.repeat(4) + colors.red('@') + docTagName);
}

console.log(
    os.EOL +
        colors.green(`Found ${parsedComments.length} documentation comments.`),
);

parsedComments.sort((a, b) => a.nodeName.localeCompare(b.nodeName));

type NodeImplementationDoc = {
    compilerNode: ts.Node;
    docComment: tsdoc.DocComment;
};
type SyntaxKindMap = Map<ts.SyntaxKind, NodeImplementationDoc[]>;
type DocFileItem = {
    nodeName: string;
    bySyntaxKind: SyntaxKindMap;
};

const nodeNameToDocItem = new Map<string, DocFileItem>();
const groupBaseNamesToNodeGroups = new Map<
    string,
    Map</*nodeGroupName*/ string, /*nodeNames*/ Set<string>>
>();
const groupNamesToNodeGroups = new Map<
    string,
    Map</*nodeGroupName*/ string, /*nodeNames*/ Set<string>>
>();
const uniqueNodeKinds = new Set<ts.SyntaxKind>();
const uniqueNodeNames = new Set<string>();

for (const parsedComment of parsedComments) {
    const {
        nodeName,
        baseGroupTagValue,
        groupTagValue,
        compilerNode,
        docComment,
    } = parsedComment;

    uniqueNodeNames.add(nodeName);
    uniqueNodeKinds.add(compilerNode.kind);

    let docFileItem = nodeNameToDocItem.get(nodeName);
    if (!docFileItem) {
        docFileItem = {
            nodeName,
            bySyntaxKind: new Map<ts.SyntaxKind, NodeImplementationDoc[]>(),
        };
        nodeNameToDocItem.set(nodeName, docFileItem);
    }

    let nodeImplementationsDoc = docFileItem.bySyntaxKind.get(
        compilerNode.kind,
    );
    if (!nodeImplementationsDoc) {
        nodeImplementationsDoc = [];
        docFileItem.bySyntaxKind.set(compilerNode.kind, nodeImplementationsDoc);
    }

    nodeImplementationsDoc.push({
        compilerNode,
        docComment,
    });

    let group: string;
    let groupToNodeGroups: Map<
        string,
        Map</*nodeGroupName*/ string, /*nodeNames*/ Set<string>>
    >;

    if (baseGroupTagValue) {
        if (groupTagValue) {
            throw new Error(
                `Both inline tag ${awakenBaseGroupTag.tagName} or ${awakenGroupTag.tagName} are implemented on node ${nodeName}`,
            );
        }

        group = baseGroupTagValue;
        groupToNodeGroups = groupBaseNamesToNodeGroups;
    } else if (groupTagValue) {
        group = groupTagValue;
        groupToNodeGroups = groupNamesToNodeGroups;
    } else {
        continue;
    }

    let groupName: string;
    let nodeGroupName: string;

    const split = group.split('/');

    if (
        (split.length !== 1 && split.length !== 2) ||
        !split[0] ||
        (split.length === 2 && !split[1])
    ) {
        throw new Error(`Invalid group tag value ${group}`);
    }

    if (split.length === 1) {
        groupName = group;
        nodeGroupName = nodeName;
    } else {
        groupName = split[0];
        nodeGroupName = split[1];
    }

    let nodeGroups = groupToNodeGroups.get(groupName);
    if (!nodeGroups) {
        nodeGroups = new Map<
            /*nodeGroupName*/ string,
            /*nodeNames*/ Set<string>
        >();
        groupToNodeGroups.set(groupName, nodeGroups);
    }

    let nodeNames = nodeGroups.get(nodeGroupName);
    if (!nodeNames) {
        nodeNames = new Set<string>();
        nodeGroups.set(nodeGroupName, nodeNames);
    }

    nodeNames.add(nodeName);
}

console.log(colors.green(`Found ${uniqueNodeNames.size} unique node names.`));

let uniqueNodeImplementations = 0;
let totalGroupNodeNames = 0;
const uniqueGroupNodeNameToCount = new Map<string, number>();
for (const groupMap of [groupBaseNamesToNodeGroups, groupNamesToNodeGroups]) {
    for (const [, nodeGroupNameToNodeNamesMap] of groupMap) {
        for (const [, nodeNames] of nodeGroupNameToNodeNamesMap) {
            totalGroupNodeNames += nodeNames.size;
            for (const nodeName of nodeNames) {
                uniqueGroupNodeNameToCount.set(
                    nodeName,
                    (uniqueGroupNodeNameToCount.get(nodeName) || 0) + 1,
                );
                const docItem = nodeNameToDocItem.get(nodeName);
                if (!docItem) {
                    throw new Error(`No doc item for node ${nodeName}`);
                }
                uniqueNodeImplementations += docItem.bySyntaxKind.size;
            }
        }
    }
}

if (totalGroupNodeNames !== uniqueGroupNodeNameToCount.size) {
    const errorLines = [
        `Duplicate node names in groups. totalGroupNodeNames: ${totalGroupNodeNames}, uniqueGroupNodeNames: ${uniqueGroupNodeNameToCount.size}`,
    ];
    for (const [nodeName, nodeNameCount] of uniqueGroupNodeNameToCount) {
        if (nodeNameCount > 1) {
            errorLines.push(`Duplicate node name ${nodeName} in groups.`);
        }
    }
    throw new Error(errorLines.join(os.EOL));
}

if (uniqueNodeNames.size !== totalGroupNodeNames) {
    const missingInlineTagMessages: string[] = [];

    for (const nodeName of uniqueNodeNames) {
        if (!uniqueGroupNodeNameToCount.has(nodeName)) {
            missingInlineTagMessages.push(
                `Neither inline tag ${awakenBaseGroupTag.tagName} or ${awakenGroupTag.tagName} are implemented on node ${nodeName}`,
            );
        }
    }

    throw new Error(missingInlineTagMessages.join(os.EOL));
}

console.log(
    colors.green(
        `Found ${uniqueNodeImplementations} unique node implementations.`,
    ),
);

console.log(
    colors.green(
        `Found ${
            groupBaseNamesToNodeGroups.size
        } base groups consisting of ${Array.from(
            groupBaseNamesToNodeGroups,
        ).reduce(
            (totalNodeGroups, [, nodeGroups]) =>
                totalNodeGroups + nodeGroups.size,
            0,
        )} nodes and ${
            groupBaseNamesToNodeGroups.size
        } nested groups consisting of ${Array.from(
            groupNamesToNodeGroups,
        ).reduce(
            (totalNodeGroups, [, nodeGroups]) =>
                totalNodeGroups + nodeGroups.size,
            0,
        )} nodes`,
    ) + os.EOL,
);

function setToObject<T, U>(transform: (value: T) => U): (set: Set<T>) => U[] {
    return (set) => {
        const result: U[] = [];

        for (const item of set) {
            result.push(transform(item));
        }

        return result;
    };
}

function mapToObject<T, U>(
    transform: (value: T) => U,
): (map: Map<string | number, T>) => { [K in string | number]: U } {
    return (map) => {
        const result: { [K in string | number]: U } = {};

        for (const [key, value] of map) {
            result[key] = transform(value);
        }

        return result;
    };
}

function fromEntries<T>(
    entries: [string | number, T][],
): { [key in string | number]: T } {
    const object: { [key in string | number]: T } = {};

    for (const [key, value] of entries) {
        object[key] = value;
    }

    return object;
}

if (verbose) {
    console.log(
        [
            ...Array.from(groupBaseNamesToNodeGroups).map(
                ([name, nodeGroupNameToNodeNamesMap]) =>
                    `${name}${[
                        '',
                        ...Array.from(
                            nodeGroupNameToNodeNamesMap,
                        ).map(([nodeGroupName, nodeNames]) =>
                            nodeNames.size === 1
                                ? nodeGroupName
                                : `${nodeGroupName}${colors.red(
                                      ':',
                                  )} ${Array.from(nodeNames).join(', ')}`,
                        ),
                    ].join(os.EOL + ' '.repeat(4))}`,
            ),
            ...Array.from(groupNamesToNodeGroups).map(
                ([name, nodeGroupNameToNodeNamesMap]) =>
                    `${name}${colors.red('/')}${[
                        '',
                        ...Array.from(
                            nodeGroupNameToNodeNamesMap,
                        ).map(([nodeGroupName, nodeNames]) =>
                            nodeNames.size === 1
                                ? nodeGroupName
                                : `${nodeGroupName}${colors.red(
                                      ':',
                                  )} ${Array.from(nodeNames).join(', ')}`,
                        ),
                    ].join(os.EOL + ' '.repeat(4))}`,
            ),
        ].join(os.EOL),
    );

    console.log(
        os.EOL +
            colors.green(
                `${
                    uniqueNodeKinds.size
                } Unique SyntaxKinds were found: ${Array.from(uniqueNodeKinds)
                    .map((kind) => ts.SyntaxKind[kind])
                    .join(', ')}`,
            ) +
            os.EOL,
    );

    console.log(colors.green(`Parsed Maps:`) + os.EOL);

    console.dir(
        {
            nodeNameToDocItem: mapToObject((item: DocFileItem) => ({
                ...item,
                bySyntaxKind: fromEntries(
                    Object.entries(
                        mapToObject((docs: NodeImplementationDoc[]) =>
                            docs.map(() => '[NodeImplementationDoc]'),
                        )(item.bySyntaxKind),
                    ).map(([key, value]) => [ts.SyntaxKind[key], value]),
                ),
            }))(nodeNameToDocItem),
            groupBaseNamesToNodeGroups: mapToObject(
                mapToObject(setToObject((value) => value)),
            )(groupBaseNamesToNodeGroups),
            groupNamesToNodeGroups: mapToObject(
                mapToObject(setToObject((value) => value)),
            )(groupNamesToNodeGroups),
        },
        { depth: null },
    );
    console.log();

    console.log(
        colors.green(
            'The following nodes have multiple implementations with the same SyntaxKind:',
        ),
    );

    const countAndDetails: [number, string, string][] = [];

    for (const [nodeName, { bySyntaxKind }] of nodeNameToDocItem) {
        for (const [syntaxKind, docs] of bySyntaxKind) {
            if (docs.length > 1) {
                countAndDetails.push([
                    docs.length,
                    ts.SyntaxKind[syntaxKind],
                    nodeName,
                ]);
            }
        }
    }

    countAndDetails.sort((a, b) => a[2].localeCompare(b[2]));

    const maxOverloadsLength = `${Math.max(
        ...countAndDetails.map(([count]) => count),
    )}`.length;

    const maxSyntaxKindLength = Math.max(
        ...countAndDetails.map(([, syntaxKind]) => syntaxKind.length),
    );

    console.log(
        countAndDetails
            .map(
                ([count, syntaxKind, nodeName]) =>
                    `${' '.repeat(4)}(${colors.red(`${count}`)}) ${' '.repeat(
                        maxOverloadsLength - `${count}`.length,
                    )}${' '.repeat(
                        maxSyntaxKindLength - syntaxKind.length,
                    )}${syntaxKind}${colors.red(':')}${nodeName}`,
            )
            .join(os.EOL) + os.EOL,
    );
}

/* eslint-disable */

// @ts-expect-error
const enum DocumentationMapType {
    Interface,
    Function,
    TypeAlias,
}

declare const x: tsdoc.DocComment;

`
    @awakenGroup
    @public
    @param
    @awakenBaseGroup
    @link
    @example
    @see
    @returns
`;

`

[general description]

[examples]

...

[overloads]

[overload 1]

[signature]
[description]
[params]
[returns]

...

[see]
`;

// @ts-expect-error
function renderDescriptionSection(): string {}

// @ts-expect-error
function getExampleBlocks(docComment: tsdoc.DocComment): tsdoc.DocBlock[] {
    return docComment.customBlocks.filter(
        (x) =>
            x.blockTag.tagNameWithUpperCase ===
            tsdoc.StandardTags.example.tagNameWithUpperCase,
    );
}

// @ts-expect-error
function renderExamplesSection(): string {}

// @ts-expect-error
function renderSignatureSection(): string {}

// @ts-expect-error
function renderParametersSection(): string {}

// @ts-expect-error
function renderReturnsSection(): string {}

// @ts-expect-error
function renderSeeSection(): string {}

// public render(): React.ReactNode {
//     const docComment: tsdoc.DocComment = this.props.docComment;

//     const outputElements: React.ReactNode[] = [];

//     // Summary
//     if (docComment.summarySection) {
//       outputElements.push(
//         <React.Fragment key='summary'>
//           <h2 className='doc-heading'>Summary</h2>
//           { this._renderContainer(docComment.summarySection) }
//         </React.Fragment>
//       );
//     }

//     // Parameters
//     if (docComment.params.count > 0) {
//       const rows: React.ReactNode[] = [];

//       for (const paramBlock of docComment.params.blocks) {
//         rows.push(
//           <tr key={`param_${rows.length}`}>
//             <td>{ paramBlock.parameterName }</td>
//             <td>{ this._renderContainer(paramBlock.content) }</td>
//           </tr>
//         );
//       }

//       outputElements.push(
//         <React.Fragment key='parameters'>
//           <h2 className='doc-heading'>Parameters</h2>
//           <table className='doc-table'>
//             <thead>
//               <tr>
//                 <th>Name</th>
//                 <th>Description</th>
//               </tr>
//             </thead>
//             <tbody>
//               {rows}
//             </tbody>
//           </table>
//         </React.Fragment>
//       );
//     }

//     // Returns
//     if (docComment.returnsBlock) {
//       outputElements.push(
//         <React.Fragment key='returns'>
//           <h2 className='doc-heading'>Return Value</h2>
//           { this._renderContainer(docComment.returnsBlock.content) }
//         </React.Fragment>
//       );
//     }

//     if (docComment.remarksBlock) {
//       outputElements.push(
//         <React.Fragment key='remarks'>
//           <h2 className='doc-heading'>Remarks</h2>
//           { this._renderContainer(docComment.remarksBlock.content) }
//         </React.Fragment>
//       );
//     }

//     const exampleBlocks: tsdoc.DocBlock[] = docComment.customBlocks.filter(x => x.blockTag.tagNameWithUpperCase
//       === tsdoc.StandardTags.example.tagNameWithUpperCase);

//     let exampleNumber: number = 1;
//     for (const exampleBlock of exampleBlocks) {
//       const heading: string = exampleBlocks.length > 1 ? `Example ${exampleNumber}` : 'Example';

//       outputElements.push(
//         <React.Fragment key='seeAlso'>
//           <h2 className='doc-heading'>{heading}</h2>
//           { this._renderContainer(exampleBlock.content) }
//         </React.Fragment>
//       );

//       ++exampleNumber;
//     }

//     if (docComment.seeBlocks.length > 0) {
//       const listItems: React.ReactNode[] = [];
//       for (const seeBlock of docComment.seeBlocks) {
//         listItems.push(
//           <li key={`item_${listItems.length}`}>
//             { this._renderContainer(seeBlock.content) }
//           </li>
//         );
//       }

//       outputElements.push(
//         <React.Fragment key='seeAlso'>
//           <h2 className='doc-heading'>See Also</h2>
//           <ul>
//             {listItems}
//           </ul>
//         </React.Fragment>
//       );
//     }

//     const modifierTags: ReadonlyArray<tsdoc.DocBlockTag> = docComment.modifierTagSet.nodes;

//     if (modifierTags.length > 0) {
//       const modifierElements: React.ReactNode[] = [];

//       for (const modifierTag of modifierTags) {
//         const key: string = `modifier_${modifierElements.length}`;
//         modifierElements.push(
//           <React.Fragment key={key}>
//             { ' ' }
//             <code className='doc-code-span'>{ modifierTag.tagName }</code>
//           </React.Fragment>
//         );
//       }

//       outputElements.push(
//         <React.Fragment key='modifiers'>
//           <h2 className='doc-heading'>Modifiers</h2>
//           { modifierElements }
//         </React.Fragment>
//       );
//     }

//     return <div style={ this.props.style }> {outputElements} </div>;
//   }

//   private _renderContainer(section: tsdoc.DocNodeContainer): React.ReactNode {
//     const elements: React.ReactNode[] = [];
//     for (const node of section.nodes) {
//       const key: string = `key_${elements.length}`;
//       elements.push(this._renderDocNode(node, key));
//     }
//     return (<React.Fragment>{elements}</React.Fragment> );
//   }

//   private _renderDocNode(node: tsdoc.DocNode, key: string): React.ReactNode | undefined {
//   }

function renderContainer(section: tsdoc.DocNodeContainer): string {
    let result = '';
    for (const node of section.nodes) {
        result += renderDocNode(node);
    }
    return result;
}

function renderDocNode(node: tsdoc.DocNode): string {
    switch (node.kind) {
        case 'CodeSpan':
            return `\`${(node as tsdoc.DocCodeSpan).code}\``;
        case 'ErrorText':
            return (node as tsdoc.DocErrorText).text;
        case 'EscapedText':
            return (node as tsdoc.DocEscapedText).decodedText;
        case 'FencedCode':
            return ['`', '```ts', (node as tsdoc.DocCodeSpan).code, '```'].join(
                '\n',
            );
        case 'LinkTag':
            const linkTag = node as tsdoc.DocLinkTag;
            if (linkTag.urlDestination) {
                const linkText = linkTag.linkText || linkTag.urlDestination;
                return `[${linkText}]${linkTag.urlDestination}`;
            }
            let identifier: string | undefined = '';
            if (linkTag.codeDestination) {
                const memberReferences =
                    linkTag.codeDestination.memberReferences;
                if (memberReferences.length > 0) {
                    const memberIdentifier =
                        memberReferences[memberReferences.length - 1]
                            .memberIdentifier;
                    if (memberIdentifier) {
                        identifier = memberIdentifier.identifier;
                    }
                }
            }
            if (!identifier) {
                identifier = linkTag.linkText;
            }
            if (!identifier || !nodeNameToDocItem.has(identifier)) {
                throw new Error(
                    `The link with ${
                        linkTag.codeDestination
                            ? `codeDestination ${linkTag.codeDestination} and `
                            : ''
                    }linkText ${
                        linkTag.linkText
                    } does not point to a valid node name.`,
                );
            }
            return '(Code Link: Not Implemented Yet)';
        case 'Paragraph':
            const trimmed = tsdoc.DocNodeTransforms.trimSpacesInParagraph(
                node as tsdoc.DocParagraph,
            );

            return `\n${renderContainer(trimmed)}`;
        case 'PlainText':
            return (node as tsdoc.DocPlainText).text;
        case 'SoftBreak':
            return ' ';
        default:
            throw new Error(`Unknown node kind: ${node.kind}`);
    }
}

/* @ts-expect-error */
function generateDocumentationForInterfaceDeclaration() {}

/* @ts-expect-error */
function generateDocumentationForFunctionDeclaration() {}

/* @ts-expect-error */
function generateDocumentationForTypeAliasDeclaration() {}

/* @ts-expect-error */
function generateFileDocumentationSection(
    /* @ts-expect-error */
    nodeGroupName: string,
    /* @ts-expect-error */
    nodeNames: Set<string>,
) {}

/* @ts-expect-error */
function generateDocumentationForFile(
    /* @ts-expect-error */
    groupName: string,
    nodeGroupNameToNodeNamesMap: Map<string, Set<string>>,
    /* @ts-expect-error */
    nodeNameToDocItemMap: Map<string, DocFileItem>,
) {
    const __example_file_util__ = {
        asyncReportError: ['asyncReportError'],
        FrameRequestCallback: ['FrameRequestCallback'],
        requestAnimationFrameImplementation: [
            'requestAnimationFrameImplementation',
        ],
        setIntervalImplementation: ['setIntervalImplementation'],
        setTimeoutImplementation: ['setTimeoutImplementation'],
        TimeProvider: ['TimeProvider'],
    };
    __example_file_util__;

    if (nodeGroupNameToNodeNamesMap.size === 1) {
        /* @ts-expect-error */
        const [nodeGroupName, nodeNames] = [...nodeGroupNameToNodeNamesMap][0];

        if (nodeNames.size === 1) {
            /* @ts-expect-error */
            const nodeName = [...nodeNames][0];

            return;
        }

        return;
    }

    /* @ts-expect-error */
    for (const [nodeGroupName, nodeNames] of nodeGroupNameToNodeNamesMap) {
    }
}

// type NodeImplementationDoc = {
//     compilerNode: ts.Node;
//     docComment: tsdoc.DocComment;
// };
// type DocFileItem = {
//     nodeName: string;
//     bySyntaxKind: Map<ts.SyntaxKind, NodeImplementationDoc[]>;
// };

// const nodeNameToDocItem = new Map<string, DocFileItem>();
// const groupBaseNamesToNodeGroups = new Map<
//     string,
//     Map</*nodeGroupName*/ string, /*nodeNames*/ Set<string>>
// >();
// const groupNamesToNodeGroups = new Map<
//     string,
//     Map</*nodeGroupName*/ string, /*nodeNames*/ Set<string>>
// >();

// const nodeNameToDocItem = new Map<string, DocFileItem>();
// const groupBaseNamesToNodeNames = new Map<string, Set<string>>();
// const groupNamesToNodeNames = new Map<string, Set<string>>();

// for (const [baseName, nodeNames] of groupBaseNamesToNodeNames) {
//     console.log('BASE', baseName, nodeNames);
// }

// for (const [name, nodeNames] of groupNamesToNodeGroups) {
//     console.log('SUB', name, nodeNames);
// }

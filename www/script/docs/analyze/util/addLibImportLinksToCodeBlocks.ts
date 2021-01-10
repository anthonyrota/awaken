import * as ts from 'typescript';
import { CoreNodeType, DeepCoreNode } from '../../core/nodes';
import { CodeLink, CodeLinkType } from '../../core/nodes/CodeBlock';
import { walkDeepCoreNode } from '../../core/nodes/util/walk';
import { AnalyzeContext } from '../Context';

export function addLibImportLinksToCodeBlocks(
    node: DeepCoreNode,
    context: AnalyzeContext,
): void {
    const packageNames = context.apiModel.packages.map(
        (package_) => package_.name,
    );
    walkDeepCoreNode(node, (node) => {
        if (node.type !== CoreNodeType.CodeBlock) {
            return;
        }
        if (node.language !== 'ts') {
            return;
        }
        if (node.codeLinks) {
            // TODO.
            throw new Error('unexpected codeLinks in node');
        }
        const sourceFile = ts.createSourceFile(
            'file.ts',
            node.code,
            ts.ScriptTarget.Latest,
            true,
        );
        const codeLinks: CodeLink[] = [];
        function onNode(node: ts.Node): void {
            if (!ts.isImportDeclaration(node)) {
                ts.forEachChild(node, onNode);
                return;
            }
            // TODO.
            if (!ts.isStringLiteral(node.moduleSpecifier)) {
                throw new Error('????');
            }
            const packageName = node.moduleSpecifier.text;
            if (!packageNames.includes(packageName)) {
                return;
            }
            if (!node.importClause) {
                return;
            }
            if (
                !node.importClause.namedBindings ||
                ts.isNamespaceImport(node.importClause.namedBindings)
            ) {
                return;
            }
            node.importClause.namedBindings.elements.forEach(
                (importSpecifier) => {
                    const identifier =
                        importSpecifier.propertyName || importSpecifier.name;
                    const exportName = identifier.getText();
                    codeLinks.push({
                        type: CodeLinkType.DocPage,
                        pageId: context.getPageIdFromExportIdentifier({
                            packageName,
                            exportName,
                        }),
                        // TODO.
                        hash: exportName,
                        startIndex: identifier.getStart(),
                        endIndex: identifier.getEnd(),
                    });
                },
            );
        }
        onNode(sourceFile);
        if (codeLinks.length !== 0) {
            node.codeLinks = codeLinks;
        }
    });
}

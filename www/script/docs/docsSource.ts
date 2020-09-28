import { promises as fs } from 'fs';
import * as path from 'path';
import { rootDir } from '../rootDir';
import { parseMarkdownWithYamlFrontmatter } from './analyze/util/parseMarkdown';
import { ContainerNode } from './core/nodes/Container';
import { Heading123456Level } from './core/nodes/Heading123456';
import { CoreNodeType, DeepCoreNode } from './core/nodes/index';
import { PageNode } from './core/nodes/Page';
import { extractTextNodes } from './core/nodes/util/extractTextNodes';
import { substituteDynamicTextValues } from './core/nodes/util/substituteDynamicTextValues';
import { walkDeepCoreNode } from './core/nodes/util/walk';
import { getDynamicTextVariableReplacementP } from './getDynamicTextVariableReplacement';
import { TableOfContents, TableOfContentsMainReference } from './types';

interface DocsSourceFrontMatter {
    title: string;
    pageId: string;
    websitePath?: string;
}

function validateDocsSourceFrontMatter(
    value: unknown,
): asserts value is DocsSourceFrontMatter {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        throw new Error(`frontmatter ${value} is not a plain object`);
    }

    const requiredStringKeys = ['title', 'pageId'];
    const optionalStringKeys = ['websitePath'];

    for (const key of requiredStringKeys) {
        if (!(key in value)) {
            throw new Error(`No ${key} in frontmatter`);
        }
        if (typeof value[key] !== 'string') {
            throw new Error(`${key} is not a string in frontmatter`);
        }
    }

    for (const key of optionalStringKeys) {
        if (!(key in value)) {
            continue;
        }
        if (typeof value[key] !== 'string') {
            throw new Error(`${key} is not a string in frontmatter`);
        }
    }

    const allKeys = [...requiredStringKeys, ...optionalStringKeys];

    for (const key of Object.keys(value)) {
        if (!allKeys.includes(key)) {
            throw new Error(`Unknown frontmatter key ${key}`);
        }
    }
}

const docsSourceDirectory = path.join(rootDir, 'docs-source');

async function buildDocsSourceSubdirectoryToApiPages(
    subPath,
    pages: PageNode<DeepCoreNode>[],
    pageIdToMdPagePath: Record<string, string>,
    pageIdToWebsitePath: Record<string, string>,
): Promise<unknown> {
    // eslint-disable-next-line max-len
    const getDynamicTextVariableReplacement = await getDynamicTextVariableReplacementP;

    const docsSourceSubdirectory = path.join(docsSourceDirectory, subPath);
    const promises: Promise<unknown>[] = [];

    let foundThing = false;
    for await (const thing of await fs.opendir(docsSourceSubdirectory)) {
        foundThing = true;
        const { name } = thing;

        if (thing.isDirectory()) {
            promises.push(
                buildDocsSourceSubdirectoryToApiPages(
                    path.join(subPath, name),
                    pages,
                    pageIdToMdPagePath,
                    pageIdToWebsitePath,
                ),
            );
            continue;
        }

        const filePath = path.join(docsSourceSubdirectory, name);

        if (!thing.isFile()) {
            throw new Error(`${filePath}: Not a file or directory`);
        }

        const ext = path.extname(filePath);
        if (ext !== '.md') {
            throw new Error(`Non markdown file found ${filePath}`);
        }

        const promise = fs.readFile(filePath, 'utf-8').then((text) => {
            const {
                frontmatter,
                rootContainer,
            } = parseMarkdownWithYamlFrontmatter(text);

            if (!frontmatter) {
                throw new Error(`No frontmatter for docs file ${filePath}`);
            }

            validateDocsSourceFrontMatter(frontmatter.value);

            const { title, pageId, websitePath } = frontmatter.value;

            const mdPagePath = `docs/` + path.join(subPath, name);
            const defaultWebsitePath = mdPagePath.slice(0, -ext.length);
            pageIdToMdPagePath[pageId] = mdPagePath;
            pageIdToWebsitePath[pageId] = websitePath ?? defaultWebsitePath;

            const pageNode = PageNode({
                title,
                tableOfContents: buildTableOfContents(rootContainer),
                pageId,
                children: rootContainer.children,
            });
            substituteDynamicTextValues(
                pageNode,
                getDynamicTextVariableReplacement,
            );
            pages.push(pageNode);
        });

        promises.push(promise);
    }

    if (!foundThing) {
        throw new Error(`Empty directory ${docsSourceSubdirectory}`);
    }

    return Promise.all(promises);
}

export async function buildDocsSourceDirectoryToApiPages(): Promise<{
    pages: PageNode<DeepCoreNode>[];
    pageIdToMdPagePath: Record<string, string>;
    pageIdToWebsitePath: Record<string, string>;
}> {
    const pages: PageNode<DeepCoreNode>[] = [];
    const pageIdToMdPagePath: Record<string, string> = {};
    const pageIdToWebsitePath: Record<string, string> = {};
    await buildDocsSourceSubdirectoryToApiPages(
        '',
        pages,
        pageIdToMdPagePath,
        pageIdToWebsitePath,
    );
    return {
        pages,
        pageIdToMdPagePath,
        pageIdToWebsitePath,
    };
}

function buildTableOfContents(
    rootContainer: ContainerNode<DeepCoreNode>,
): TableOfContents | undefined {
    interface ParentState {
        level: Heading123456Level;
        mainReference: TableOfContentsMainReference;
        parent?: ParentState;
    }

    let tableOfContents: TableOfContents | undefined;
    let parent: ParentState | undefined;

    walkDeepCoreNode(rootContainer, (node) => {
        if (
            node.type === CoreNodeType.Heading123456 &&
            node.alternateId !== undefined
        ) {
            const { level } = node;
            const mainReference: TableOfContentsMainReference = {
                text: extractTextNodes(node)
                    .map((node) => node.text)
                    .join(''),
                urlHashText: node.alternateId,
            };
            const self = { level, mainReference, parent };
            while (parent) {
                if (level > parent.level) {
                    // eslint-disable-next-line max-len
                    const nestedReferences =
                        parent.mainReference.nestedReferences ??
                        (parent.mainReference.nestedReferences = []);
                    nestedReferences.push(mainReference);
                    parent = self;
                    break;
                }
                parent = parent.parent;
            }
            if (!parent) {
                (tableOfContents ?? (tableOfContents = [])).push(mainReference);
                parent = self;
            }
            return;
        }
    });

    return tableOfContents;
}

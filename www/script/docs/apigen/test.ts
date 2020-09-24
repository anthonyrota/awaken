import * as fs from 'fs';
import * as path from 'path';
import { rootDir } from '../../rootDir';
import { parseMarkdownWithYamlFrontmatter } from './analyze/util/parseMarkdown';

const source = fs.readFileSync(
    path.join(rootDir, 'docs-source/introduction.md'),
    'utf-8',
);

console.dir(parseMarkdownWithYamlFrontmatter(source), { depth: null });

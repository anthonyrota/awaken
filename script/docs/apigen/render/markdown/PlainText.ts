import { PlainTextBase } from '../../nodes/PlainText';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteCoreNode } from '.';

const newlineRegexp = /\r?\n/g;

function escapeHashAtEnd(str: string): string {
    return `${str.slice(0, -1)}\\#`;
}

export function writePlainText(
    plainTextNode: PlainTextBase,
    output: MarkdownOutput,
    _writeCoreNode: ParamWriteCoreNode,
): void {
    let { text } = plainTextNode;

    if (!output.inMarkdownCode) {
        text = text
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        if (!output.inHtmlBlockTag) {
            // Escape four space code blocks: Space -> Em space.
            text = text.replace(/^ {4}/gm, ' '.repeat(4));
        }

        if (output.inTable) {
            text = text.replace(/\|/g, '&#124;');
            if (!output.inSingleLineCodeBlock && !output.inHtmlAttribute) {
                text = text.replace(newlineRegexp, '<br>');
            }
        }

        if (!output.inHtmlBlockTag) {
            text = text
                .replace(/\\/, '\\\\')
                .replace(/[*/()[\]<>_]/g, '\\$&')
                .replace(/\n\s*#/g, escapeHashAtEnd);

            let isOnlyWhitespace = true;
            for (const char of output.iterateCharactersBackwards()) {
                if (char === '\n') {
                    break;
                }
                if (char !== ' ') {
                    isOnlyWhitespace = false;
                    break;
                }
            }
            if (isOnlyWhitespace) {
                text = text.replace(/^\s*#/g, escapeHashAtEnd);
            }
        }

        if (output.inHtmlAttribute) {
            text = text.replace(newlineRegexp, '\\n');
        } else if (output.inSingleLineCodeBlock) {
            text = text.split(newlineRegexp).join('</code><br><code>');
        } else if (output.inHtmlBlockTag && !output.inTable) {
            text = text.replace(newlineRegexp, '<br>');
        }
    }

    output.write(text);
}

import { noop } from '../../../util/noop';
import { HtmlElementNode } from '../../nodes/HtmlElement';
import { ImageBase } from '../../nodes/Image';
import { PlainTextNode } from '../../nodes/PlainText';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteRenderMarkdownNode } from '.';

export function writeImage(
    image: ImageBase,
    output: MarkdownOutput,
    writeRenderMarkdownNode: ParamWriteRenderMarkdownNode,
): void {
    output.withInSingleLine(() => {
        if (output.inHtmlBlockTag && !output.inTable) {
            const attributes: Record<string, string> = {
                src: image.src,
            };
            if (image.title !== undefined) {
                attributes.title = image.title;
            }
            if (image.alt !== undefined) {
                attributes.alt = image.alt;
            }
            writeRenderMarkdownNode(
                HtmlElementNode({ tagName: 'img', attributes }),
                output,
                noop,
            );
        }
        output.write('![');
        if (image.alt)
            writeRenderMarkdownNode(PlainTextNode({ text: image.alt }), output);
        output.write('](');
        writeRenderMarkdownNode(PlainTextNode({ text: image.src }), output);
        if (image.title) {
            output.write(' "');
            writeRenderMarkdownNode(
                PlainTextNode({ text: image.title }),
                output,
            );
            output.write('"');
        }
        output.write(')');
    });
}

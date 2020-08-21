import { HtmlElementNode } from '../../nodes/HtmlElement';
import { ImageBase } from '../../nodes/Image';
import { PlainTextNode } from '../../nodes/PlainText';
import { noop } from '../../util';
import { MarkdownOutput } from './MarkdownOutput';
import { ParamWriteCoreNode } from '.';

export function writeImage(
    image: ImageBase,
    output: MarkdownOutput,
    writeCoreNode: ParamWriteCoreNode,
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
            writeCoreNode(
                HtmlElementNode({ tagName: 'img', attributes }),
                output,
                noop,
            );
        }
        output.write('![');
        if (image.alt)
            writeCoreNode(PlainTextNode({ text: image.alt }), output);
        output.write('](');
        writeCoreNode(PlainTextNode({ text: image.src }), output);
        if (image.title) {
            output.write(' "');
            writeCoreNode(PlainTextNode({ text: image.title }), output);
            output.write('"');
        }
        output.write(')');
    });
}

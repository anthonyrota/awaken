import { PlainText } from '../../nodes/PlainText';
import { HtmlElement } from '../../nodes/HtmlElement';
import { Image } from '../../nodes/Image';
import { MarkdownOutput } from './MarkdownOutput';
import { writeVoidHtmlElement } from './HtmlElement';
import { writePlainText } from './PlainText';

export function writeImage(image: Image, output: MarkdownOutput): void {
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
            writeVoidHtmlElement(
                HtmlElement({ tagName: 'img', attributes }),
                output,
            );
        }
        output.write('![');
        if (image.alt) writePlainText(PlainText({ text: image.alt }), output);
        output.write('](');
        writePlainText(PlainText({ text: image.src }), output);
        if (image.title) {
            output.write(' "');
            writePlainText(PlainText({ text: image.title }), output);
            output.write('"');
        }
        output.write(')');
    });
}

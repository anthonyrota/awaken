import { Node, CoreNodeType } from '.';

export interface Image extends Node {
    type: CoreNodeType.Image;
    src: string;
    title?: string;
    alt?: string;
}

export interface ImageParameters {
    src: string;
    title?: string;
    alt?: string;
}

export function Image(parameters: ImageParameters): Image {
    const image: Image = {
        type: CoreNodeType.Image,
        src: parameters.src,
    };
    if (parameters.title !== undefined) {
        image.title = parameters.title;
    }
    if (parameters.alt) {
        image.alt = parameters.alt;
    }
    return image;
}

import { Node, CoreNodeType } from '.';

export interface ImageParameters {
    src: string;
    title?: string;
    alt?: string;
}

export interface ImageBase {
    src: string;
    title?: string;
    alt?: string;
}

export function ImageBase(parameters: ImageParameters): ImageBase {
    const imageBase: ImageBase = {
        src: parameters.src,
    };
    if (parameters.title !== undefined) {
        imageBase.title = parameters.title;
    }
    if (parameters.alt) {
        imageBase.alt = parameters.alt;
    }
    return imageBase;
}

export interface ImageNode extends ImageBase, Node {
    type: CoreNodeType.Image;
}

export function ImageNode(parameters: ImageParameters): ImageNode {
    return {
        type: CoreNodeType.Image,
        ...ImageBase(parameters),
    };
}

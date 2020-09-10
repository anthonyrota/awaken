import { ApiItemKind } from '@microsoft/api-extractor-model';

export function getApiItemTextKind(kind: ApiItemKind): string {
    switch (kind) {
        case ApiItemKind.Function:
            return 'Function';
        case ApiItemKind.Interface:
            return 'Interface';
        case ApiItemKind.TypeAlias:
            return 'Type';
        case ApiItemKind.Variable:
            return 'Variable';
        default:
            throw new Error(`Unsupported kind ${kind}.`);
    }
}

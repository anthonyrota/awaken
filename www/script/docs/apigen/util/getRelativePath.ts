export function getRelativePath(from: string, to: string): string {
    if (from === to) {
        return '';
    }
    const fromSplit = from.split(/[/\\]/g);
    fromSplit.pop();
    const toSplit = to.split(/[/\\]/g);
    const name = toSplit.pop();
    if (!name) {
        throw new Error('No.');
    }
    let i = 0;
    for (; i < fromSplit.length && i < toSplit.length; i++) {
        if (fromSplit[i] !== toSplit[i]) {
            break;
        }
    }
    const start =
        '../'.repeat(fromSplit.length - i) + toSplit.slice(i).join('/');
    return start === ''
        ? name
        : start + (start.endsWith('/') ? '' : '/') + name;
}

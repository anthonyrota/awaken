export class StringBuilder {
    private __result = '';

    public write(text: string): void {
        this.__result += text;
    }

    public writeLine(text = ''): void {
        this.write(text + '\n');
    }

    public toString(): string {
        return this.__result;
    }

    public *iterateCharactersBackwards(): Generator<string, void, undefined> {
        for (let i = this.__result.length - 1; i >= 0; i--) {
            yield this.__result[i];
        }
    }
}

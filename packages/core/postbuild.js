/* eslint-disable @typescript-eslint/no-var-requires */
const {
    getAbsolutePath,
    readFile,
    writeFile,
    renameOutputModule,
} = require('../../fileUtil');

renameOutputModule({
    from: getAbsolutePath('dist', 'awaken.module.js'),
    toDir: getAbsolutePath('dist'),
    toName: 'awaken.mjs',
});

(function () {
    const filePath = getAbsolutePath('dist', 'index.d.ts');
    const toRemove = ' binarySearchNextLargestIndex as _b,';
    const source = readFile(filePath);

    if (!source.includes(toRemove)) {
        throw new Error(`index.d.ts does not contain ${toRemove}`);
    }

    writeFile(filePath, source.replace(toRemove, ''));
})();

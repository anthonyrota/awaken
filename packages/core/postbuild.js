/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const {
    getAbsolutePath,
    renameOutputModule,
} = require('../../script/util/fileUtil');

renameOutputModule({
    from: getAbsolutePath('dist', 'microstream.module.js'),
    toDir: getAbsolutePath('dist'),
    toName: 'microstream.mjs',
});

fs.readdirSync(getAbsolutePath('src')).forEach((file) => {
    fs.unlinkSync(getAbsolutePath('dist', file.replace('.ts', '.d.ts')));
    fs.unlinkSync(getAbsolutePath('dist', file.replace('.ts', '.d.ts.map')));
});

/* eslint-disable @typescript-eslint/no-var-requires */
const {
    getAbsolutePath,
    renameOutputModule,
} = require('../../script/util/fileUtil');
const fs = require('fs');

renameOutputModule({
    from: getAbsolutePath('dist', 'awakenCore.module.js'),
    toDir: getAbsolutePath('dist'),
    toName: 'awakenCore.mjs',
});

fs.readdirSync(getAbsolutePath('src')).forEach((file) => {
    fs.unlinkSync(getAbsolutePath('dist', file.replace('.ts', '.d.ts')));
    fs.unlinkSync(getAbsolutePath('dist', file.replace('.ts', '.d.ts.map')));
});

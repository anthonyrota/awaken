/* eslint-disable @typescript-eslint/no-var-requires */
const { getAbsolutePath, renameOutputModule } = require('./postbuildUtil');
const { sync: removePathSync } = require('rimraf');

renameOutputModule({
    from: getAbsolutePath('testing', 'dist', 'testing.module.js'),
    toDir: getAbsolutePath('testing', 'dist'),
    toName: 'testing.mjs',
});

renameOutputModule({
    from: getAbsolutePath('testing', 'dist', 'testing', 'index.d.ts'),
    toDir: getAbsolutePath('testing', 'dist'),
    toName: 'index.d.ts',
    transformSourceMap: (sourceMap) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        sourceMap.sources = ['../index.ts'];
    },
});

removePathSync(getAbsolutePath('testing', 'dist', 'testing'));

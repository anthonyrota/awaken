/* eslint-disable @typescript-eslint/no-var-requires */
const { getAbsolutePath, renameOutputModule } = require('../../fileUtil');
const rimraf = require('rimraf');

renameOutputModule({
    from: getAbsolutePath('dist', 'testing.module.js'),
    toDir: getAbsolutePath('dist'),
    toName: 'testing.mjs',
});

renameOutputModule({
    from: getAbsolutePath('dist', 'testing', 'src', 'index.d.ts'),
    toDir: getAbsolutePath('dist'),
    toName: 'index.d.ts',
    transformSourceMap: (sourceMap) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        sourceMap.sources = ['../src/index.ts'];
    },
});

rimraf.sync(getAbsolutePath('dist', 'testing'));

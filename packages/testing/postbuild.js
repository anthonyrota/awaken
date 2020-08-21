/* eslint-disable @typescript-eslint/no-var-requires */
const rimraf = require('rimraf');
const {
    getAbsolutePath,
    renameOutputModule,
} = require('../../script/util/fileUtil');

renameOutputModule({
    from: getAbsolutePath('dist', 'awakenTesting.module.js'),
    toDir: getAbsolutePath('dist'),
    toName: 'awakenTesting.mjs',
});

rimraf.sync(getAbsolutePath('dist', 'testing'));

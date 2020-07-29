/* eslint-disable @typescript-eslint/no-var-requires */
const {
    getAbsolutePath,
    renameOutputModule,
} = require('../../script/util/fileUtil');
const rimraf = require('rimraf');

renameOutputModule({
    from: getAbsolutePath('dist', 'awakenTesting.module.js'),
    toDir: getAbsolutePath('dist'),
    toName: 'awakenTesting.mjs',
});

rimraf.sync(getAbsolutePath('dist', 'testing'));

/* eslint-disable @typescript-eslint/no-var-requires */
const rimraf = require('rimraf');
const {
    getAbsolutePath,
    renameOutputModule,
} = require('../../script/util/fileUtil');

renameOutputModule({
    from: getAbsolutePath('dist', 'microstreamTesting.module.js'),
    toDir: getAbsolutePath('dist'),
    toName: 'microstreamTesting.mjs',
});

rimraf.sync(getAbsolutePath('dist', 'testing'));

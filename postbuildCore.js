/* eslint-disable @typescript-eslint/no-var-requires */
const { getAbsolutePath, renameOutputModule } = require('./postbuildUtil');

renameOutputModule({
    from: getAbsolutePath('dist', 'awakening.module.js'),
    toDir: getAbsolutePath('dist'),
    toName: 'awakening.mjs',
});

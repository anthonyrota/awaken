/* eslint-disable @typescript-eslint/no-var-requires */
const { getAbsolutePath, renameOutputModule } = require('../../fileUtil');

renameOutputModule({
    from: getAbsolutePath('dist', 'awaken.module.js'),
    toDir: getAbsolutePath('dist'),
    toName: 'awaken.mjs',
});

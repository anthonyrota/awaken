/* eslint-disable @typescript-eslint/no-var-requires */
const { getAbsolutePath } = require('../script/util/fileUtil');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

const nodeModulesPath = getAbsolutePath('node_modules');
const cachePath = path.join(nodeModulesPath, '.cache');

rimraf.sync(cachePath);

if (
    fs.existsSync(nodeModulesPath) &&
    fs.readdirSync(nodeModulesPath).length === 0
) {
    rimraf.sync(nodeModulesPath);
}

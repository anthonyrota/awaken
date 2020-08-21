/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const { getAbsolutePath } = require('./util/fileUtil');

const nodeModulesPath = getAbsolutePath('node_modules');
const cachePath = path.join(nodeModulesPath, '.cache');

rimraf.sync(cachePath);

if (
    fs.existsSync(nodeModulesPath) &&
    fs.readdirSync(nodeModulesPath).length === 0
) {
    rimraf.sync(nodeModulesPath);
}

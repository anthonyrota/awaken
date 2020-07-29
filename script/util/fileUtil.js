/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
const cwd = process.cwd();

/**
 * @param {string[]} path_
 * @returns {string}
 */
function getAbsolutePath(...path_) {
    return path.join(cwd, ...path_);
}

/**
 * @param {string} from
 * @param {string} to
 */
function copyFile(from, to) {
    fs.writeFileSync(to, fs.readFileSync(from));
}

/**
 * @param {string} path
 * @returns {string}
 */
function readFile(path) {
    return fs.readFileSync(path, 'utf-8');
}

/**
 * @param {string} path
 */
function writeFile(path, text) {
    fs.writeFileSync(path, text, 'utf-8');
}

/**
 * @param {string} path
 * @returns {*}
 */
function readJSON(path) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return JSON.parse(readFile(path));
}

/**
 * @param {string} path
 * @param {*} json
 */
function writeJSON(path, json) {
    writeFile(path, JSON.stringify(json));
}

/**
 * @param {object} params
 * @param {string} params.from
 * @param {string} params.toDir
 * @param {string} params.toName
 * @param {(sourceMap: *) => void} [params.transformSourceMap]
 */
function renameOutputModule({ from, toDir, toName, transformSourceMap }) {
    const to = path.join(toDir, toName);
    copyFile(from, to);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const sourceMap = readJSON(from + '.map');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    sourceMap.file = toName;
    if (transformSourceMap) transformSourceMap(sourceMap);
    writeJSON(to + '.map', sourceMap);
}

module.exports = {
    getAbsolutePath,
    copyFile,
    readFile,
    writeFile,
    readJSON,
    writeJSON,
    renameOutputModule,
};

/* eslint-disable @typescript-eslint/no-var-requires */
const { writeFileSync, readFileSync } = require('fs');
const path = require('path');
const cwd = process.cwd();

/**
 * Gets the absolute path of a file/directory
 * @param {string[]} path_ The path to the directory file/directory.
 * @returns {string} The absolute path of the file/directory.
 */
function getAbsolutePath(...path_) {
    return path.join(cwd, ...path_);
}

/**
 * Copies the source file into the given output path.
 * @param {string} from The absolute path of the file to copy.
 * @param {string} to The absolute path to copy to.
 */
function copyFile(from, to) {
    writeFileSync(to, readFileSync(from));
}

/**
 * @param {string} path
 * @returns {*}
 */
function readJSON(path) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return JSON.parse(readFileSync(path, 'utf-8'));
}

/**
 * @param {string} path
 * @param {*} json
 */
function writeJSON(path, json) {
    writeFileSync(path, JSON.stringify(json), 'utf-8');
}

/**
 * Creates a copy of the given source module and it's source map into the given
 * output path.
 * @param {object} params
 * @param {string} params.from The path of the module.
 * @param {string} params.toDir The path of the output module directory.
 * @param {string} params.toName The name of the output module to point the
 *     source map to.
 * @param {(sourceMap: *) => void} [params.transformSourceMap] Optional function
 *     to mutate the source map before it is written to the given output path.
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
    renameOutputModule,
};

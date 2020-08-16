/* eslint-disable @typescript-eslint/no-var-requires */
const { getAbsolutePath } = require('./util/fileUtil');
const rimraf = require('rimraf');

rimraf.sync(getAbsolutePath('node_modules', '@awaken'));

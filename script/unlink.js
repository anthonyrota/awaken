/* eslint-disable @typescript-eslint/no-var-requires */
const rimraf = require('rimraf');
const { getAbsolutePath } = require('./util/fileUtil');

rimraf.sync(getAbsolutePath('node_modules', '@awaken'));

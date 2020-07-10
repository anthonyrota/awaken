const baseConfig = require('./jest.config');

module.exports = {
    ...baseConfig,
    moduleNameMapper: {
        ...baseConfig.moduleNameMapper,
        '^@awaken/core$': '<rootDir>/packages/core/dist/awaken.js',
        '^@awaken/testing$': '<rootDir>/packages/testing/dist/testing.js',
    },
};

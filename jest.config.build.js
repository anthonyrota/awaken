const baseConfig = require('./jest.config');

module.exports = {
    ...baseConfig,
    moduleNameMapper: {
        ...baseConfig.moduleNameMapper,
        '^@awaken/core$': '<rootDir>/packages/core/dist/awakenCore.js',
        '^@awaken/testing$': '<rootDir>/packages/testing/dist/awakenTesting.js',
    },
};

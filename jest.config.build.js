const baseConfig = require('./jest.config');

module.exports = {
    ...baseConfig,
    moduleNameMapper: {
        ...baseConfig.moduleNameMapper,
        '^@microstream/core$': '<rootDir>/packages/core/dist/microstream.js',
        '^@microstream/testing$':
            '<rootDir>/packages/testing/dist/microstreamTesting.js',
    },
};

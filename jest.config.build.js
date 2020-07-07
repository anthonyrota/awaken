const config = require('./jest.config');

module.exports = {
    ...config,
    moduleNameMapper: {
        ...config.moduleNameMapper,
        '^awakening$': '<rootDir>/dist/awakening.js',
        '^awakening/testing$': '<rootDir>/testing/dist/testing.js',
    },
};

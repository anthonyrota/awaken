module.exports = {
    testEnvironment: 'node',
    verbose: true,
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
        '^.+\\.js$': 'babel-jest',
    },
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    testRegex: '.*\\.test\\.ts$',
    moduleNameMapper: {
        '^@microstream/core$': '<rootDir>/packages/core/src/index.ts',
        '^@microstream/testing$': '<rootDir>/packages/testing/src/index.ts',
    },
    setupFilesAfterEnv: ['jest-extended'],
    timers: 'modern',
    collectCoverageFrom: [
        './packages/core/src/**/*.ts',
        './packages/testing/src/**/*.ts',
    ],
    coverageDirectory: 'coverage',
};

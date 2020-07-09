module.exports = {
    testEnvironment: 'node',
    verbose: true,
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
        '^.+\\.js$': 'babel-jest',
    },
    moduleNameMapper: {
        '^awakening$': '<rootDir>/src/index.ts',
        '^awakening/testing$': '<rootDir>/testing/index.ts',
    },
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    testRegex: '.*\\.test\\.ts$',
    globals: {
        'ts-jest': {
            tsConfig: 'tsconfig.test.json',
        },
    },
    setupFilesAfterEnv: ['jest-extended'],
    coverageDirectory: 'coverage',
    collectCoverageFrom: ['src/**/*.{ts,tsx,js,jsx}', '!src/**/*.d.ts'],
};

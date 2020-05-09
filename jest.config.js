module.exports = {
    testEnvironment: 'node',
    verbose: true,
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
        '^.+\\.js$': 'babel-jest',
    },
    testPathIgnorePatterns: ['/node_modules/', '/build/'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    testRegex: '.*\\.test\\.ts$',
    globals: {
        'ts-jest': {
            tsConfig: 'tsconfig.test.json',
        },
        NODE_ENV: 'test',
    },
    transformIgnorePatterns: ['node_modules/(?!lodash-es)'],
    setupFilesAfterEnv: ['jest-extended'],
    coverageDirectory: 'coverage',
    collectCoverageFrom: ['src/**/*.{ts,tsx,js,jsx}', '!src/**/*.d.ts'],
};

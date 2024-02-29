const config = {
    extensionsToTreatAsEsm: ['.ts', '.esm.js'],
    cacheDirectory: '<rootDir>../../cache/jest',
    globals: {
        'ts-jest': {
            useESM: true,
            isolatedModules: true,
            tsconfig: {
                isolatedModules: true
            }
        }
    },
    transformIgnorePatterns: ['node_modules/(?!.*?\\.esm\\.js$|.*?\\.mjs$)'],
    testPathIgnorePatterns: ['node_modules/(?!.*?\\.esm\\.js$|.*?\\.mjs$)', '<rootDir>/node_modules/'],
    testRegex: '.test.ts$',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest'
    },
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@modules/(.*)$': '<rootDir>/src/modules/$1',
        '^@utils/(.*)$': '<rootDir>/src/utils/$1'
    }
};

module.exports = config;

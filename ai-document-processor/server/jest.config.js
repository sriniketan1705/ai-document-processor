/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  // ts-jest uses tsconfig.json; tests live outside "src" so relax the include
  transform: { '^.+\\.ts$': ['ts-jest', { diagnostics: { ignoreCodes: [151001] } }] },
};

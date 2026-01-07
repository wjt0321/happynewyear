// 集成测试专用配置
const baseConfig = require('./jest.config.js');

module.exports = {
  ...baseConfig,
  displayName: '集成测试',
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.integration.test.ts',
    '<rootDir>/src/**/*.integration.test.ts'
  ],
  testTimeout: 30000, // 集成测试需要更长超时时间
  setupFilesAfterEnv: [
    '<rootDir>/src/test/setup.ts',
    '<rootDir>/src/test/integration-setup.ts'
  ]
};
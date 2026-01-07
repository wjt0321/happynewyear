// 单元测试专用配置
const baseConfig = require('./jest.config.js');

module.exports = {
  ...baseConfig,
  displayName: '单元测试',
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.unit.test.ts',
    '<rootDir>/src/**/*.unit.test.ts'
  ],
  testTimeout: 5000, // 单元测试超时时间更短
  collectCoverageFrom: [
    ...baseConfig.collectCoverageFrom,
    '!src/**/*.integration.test.ts',
    '!src/**/*.property.test.ts'
  ]
};
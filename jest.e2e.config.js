/**
 * Jest配置 - 端到端集成测试
 */

module.exports = {
  // 测试环境
  testEnvironment: 'node',
  
  // 测试文件匹配模式
  testMatch: [
    '**/tests/e2e/**/*.test.js',
    '**/tests/integration/**/*.test.js'
  ],
  
  // 测试超时设置
  testTimeout: 60000, // 60秒
  
  // 设置文件
  setupFilesAfterEnv: [
    '<rootDir>/tests/e2e/setup.js'
  ],
  
  // 覆盖率配置
  collectCoverage: false, // E2E测试不需要覆盖率
  
  // 详细输出
  verbose: true,
  
  // 并发设置
  maxWorkers: 1, // E2E测试串行执行
  
  // 全局变量
  globals: {
    'TEST_ENV': 'e2e'
  },
  
  // 模块路径映射
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@backend/(.*)$': '<rootDir>/backend/src/$1',
    '^@frontend/(.*)$': '<rootDir>/frontend/src/$1'
  },
  
  // 忽略的文件
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/'
  ],
  
  // 报告器配置
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './tests/e2e/reports',
      filename: 'e2e-test-report.html',
      expand: true,
      hideIcon: false,
      pageTitle: '端到端集成测试报告'
    }]
  ],
  
  // 清理模拟
  clearMocks: true,
  restoreMocks: true,
  
  // 错误处理
  bail: false, // 不在第一个失败时停止
  
  // 测试结果处理
  passWithNoTests: false,
  
  // 监听模式配置
  watchman: false,
  
  // 转换配置
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // 环境变量
  setupFiles: [
    '<rootDir>/tests/e2e/env.js'
  ]
};
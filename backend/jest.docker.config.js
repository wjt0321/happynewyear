/**
 * Docker测试专用Jest配置
 * 用于运行容器化部署相关的测试
 */

module.exports = {
  // 基础配置
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // 显示名称
  displayName: 'Docker Tests',
  
  // 文件路径配置 - 只运行Docker测试
  roots: ['<rootDir>/tests/docker'],
  testMatch: [
    '<rootDir>/tests/docker/**/*.test.js'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/', 
    '<rootDir>/dist/',
    '<rootDir>/coverage/'
  ],
  
  // JavaScript文件转换（Docker测试使用JS而不是TS）
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // 测试环境配置
  testTimeout: 300000, // 5分钟超时，因为Docker操作可能很慢
  
  // 性能配置
  maxWorkers: 1, // Docker测试串行运行，避免端口冲突
  cache: false,  // 禁用缓存，确保每次都是全新测试
  
  // 错误处理
  verbose: true,
  bail: true, // 遇到错误立即停止，因为Docker测试依赖性强
  
  // 全局设置
  globalSetup: '<rootDir>/tests/docker/setup.js',
  globalTeardown: '<rootDir>/tests/docker/teardown.js',
  
  // 覆盖率配置（Docker测试不需要代码覆盖率）
  collectCoverage: false,
  
  // 测试报告
  reporters: ['default']
};
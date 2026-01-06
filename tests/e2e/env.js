/**
 * 端到端测试环境变量配置
 */

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.TEST_ENV = 'e2e';

// 数据库配置
process.env.DB_PATH = './test-data/test.db';

// API配置
process.env.PORT = '3000';
process.env.TEST_BACKEND_URL = 'http://localhost:3000';
process.env.TEST_FRONTEND_URL = 'http://localhost:8080';

// 超时配置
process.env.API_TIMEOUT = '10000';
process.env.TEST_TIMEOUT = '60000';

// 调试配置
process.env.DEBUG = 'false';
process.env.VERBOSE = 'true';

console.log('✅ 端到端测试环境变量已配置');
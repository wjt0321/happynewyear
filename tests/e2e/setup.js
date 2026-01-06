/**
 * 端到端测试设置文件
 * 配置测试环境和全局设置
 */

const path = require('path');
const fs = require('fs');

// 全局测试配置
global.TEST_CONFIG = {
  backend: {
    baseUrl: process.env.TEST_BACKEND_URL || 'http://localhost:3000',
    startupTimeout: 30000,
    apiTimeout: 10000
  },
  frontend: {
    baseUrl: process.env.TEST_FRONTEND_URL || 'http://localhost:8080',
    startupTimeout: 30000
  },
  database: {
    testPath: './test-data/test.db',
    backupPath: './test-data/backup.db'
  },
  timeouts: {
    api: 10000,
    startup: 30000,
    test: 60000,
    cooldown: 11000
  }
};

// 测试数据目录
const TEST_DATA_DIR = path.join(__dirname, '..', '..', 'test-data');

// 确保测试数据目录存在
if (!fs.existsSync(TEST_DATA_DIR)) {
  fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
  console.log('✅ 创建测试数据目录');
}

// 全局测试工具函数
global.testUtils = {
  /**
   * 生成测试用openid
   */
  generateTestOpenid: (prefix = 'test') => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },
  
  /**
   * 等待指定时间
   */
  sleep: (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  
  /**
   * 等待冷却时间
   */
  waitForCooldown: () => {
    return global.testUtils.sleep(global.TEST_CONFIG.timeouts.cooldown);
  },
  
  /**
   * 清理测试数据
   */
  cleanupTestData: () => {
    const testDbPath = global.TEST_CONFIG.database.testPath;
    if (fs.existsSync(testDbPath)) {
      try {
        fs.unlinkSync(testDbPath);
        console.log('✅ 清理测试数据库');
      } catch (error) {
        console.warn('⚠️  清理测试数据库失败:', error.message);
      }
    }
  },
  
  /**
   * 备份测试数据
   */
  backupTestData: () => {
    const testDbPath = global.TEST_CONFIG.database.testPath;
    const backupPath = global.TEST_CONFIG.database.backupPath;
    
    if (fs.existsSync(testDbPath)) {
      try {
        fs.copyFileSync(testDbPath, backupPath);
        console.log('✅ 备份测试数据库');
      } catch (error) {
        console.warn('⚠️  备份测试数据库失败:', error.message);
      }
    }
  },
  
  /**
   * 恢复测试数据
   */
  restoreTestData: () => {
    const testDbPath = global.TEST_CONFIG.database.testPath;
    const backupPath = global.TEST_CONFIG.database.backupPath;
    
    if (fs.existsSync(backupPath)) {
      try {
        fs.copyFileSync(backupPath, testDbPath);
        console.log('✅ 恢复测试数据库');
      } catch (error) {
        console.warn('⚠️  恢复测试数据库失败:', error.message);
      }
    }
  },
  
  /**
   * 验证API响应格式
   */
  validateApiResponse: (response, expectedFields = []) => {
    expect(response).toHaveProperty('status');
    expect(response).toHaveProperty('body');
    
    if (expectedFields.length > 0) {
      expectedFields.forEach(field => {
        expect(response.body).toHaveProperty(field);
      });
    }
  },
  
  /**
   * 验证运势数据格式
   */
  validateFortuneData: (fortuneData) => {
    expect(fortuneData).toHaveProperty('id');
    expect(fortuneData).toHaveProperty('text');
    expect(fortuneData).toHaveProperty('isNew');
    
    expect(typeof fortuneData.id).toBe('number');
    expect(typeof fortuneData.text).toBe('string');
    expect(typeof fortuneData.isNew).toBe('boolean');
    
    expect(fortuneData.id).toBeGreaterThan(0);
    expect(fortuneData.text.length).toBeGreaterThan(0);
  },
  
  /**
   * 验证错误响应格式
   */
  validateErrorResponse: (response, expectedStatus = 400) => {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
    expect(typeof response.body.error).toBe('string');
  }
};

// 测试数据生成器
global.testDataGenerator = {
  /**
   * 生成有效的openid列表
   */
  validOpenids: () => [
    'test_openid_12345678901234567890',
    'wx_user_abcdefghijklmnopqrstuvwxyz',
    'miniprogram_user_1234567890abcdef',
    'wechat_test_user_' + Date.now(),
    'integration_test_' + Math.random().toString(36).substr(2, 15)
  ],
  
  /**
   * 生成无效的openid列表
   */
  invalidOpenids: () => [
    '', // 空字符串
    null, // null值
    undefined, // undefined值
    'short', // 太短
    'a'.repeat(100), // 太长
    123, // 数字
    {}, // 对象
    [], // 数组
    true, // 布尔值
    'invalid@openid', // 包含特殊字符
    '   ', // 只有空格
    '\n\t' // 包含换行符和制表符
  ],
  
  /**
   * 生成测试用户批次
   */
  generateUserBatch: (count = 5, prefix = 'batch') => {
    return Array.from({ length: count }, (_, i) => 
      `${prefix}_user_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 6)}`
    );
  }
};

// 全局钩子函数
beforeAll(() => {
  console.log('🚀 开始端到端集成测试');
  console.log(`📡 后端服务: ${global.TEST_CONFIG.backend.baseUrl}`);
  console.log(`🌐 前端服务: ${global.TEST_CONFIG.frontend.baseUrl}`);
  console.log(`🗄️  测试数据库: ${global.TEST_CONFIG.database.testPath}`);
});

afterAll(() => {
  console.log('🧹 端到端集成测试完成');
  
  // 清理测试数据
  global.testUtils.cleanupTestData();
});

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

console.log('✅ 端到端测试环境设置完成');
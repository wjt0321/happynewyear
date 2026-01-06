/**
 * 端到端集成测试
 * 测试完整的用户抽签流程和系统集成
 */

const request = require('supertest');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 测试配置
const TEST_CONFIG = {
  backend: {
    baseUrl: 'http://localhost:3000',
    startupTimeout: 30000
  },
  frontend: {
    baseUrl: 'http://localhost:8080',
    startupTimeout: 30000
  },
  database: {
    testPath: './test-data/test.db'
  },
  timeouts: {
    api: 10000,
    startup: 30000,
    test: 60000
  }
};

// 全局变量
let backendProcess = null;
let testOpenid = null;

/**
 * 测试套件设置
 */
describe('端到端集成测试', () => {
  // 测试超时设置
  jest.setTimeout(TEST_CONFIG.timeouts.test);
  
  beforeAll(async () => {
    console.log('🚀 开始端到端集成测试设置...');
    
    // 生成测试用的openid
    testOpenid = `test_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`📱 测试用户ID: ${testOpenid}`);
    
    // 确保测试数据目录存在
    const testDataDir = path.dirname(TEST_CONFIG.database.testPath);
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }
    
    // 启动后端服务（如果未运行）
    await ensureBackendRunning();
  });
  
  afterAll(async () => {
    console.log('🧹 清理测试环境...');
    
    // 清理测试数据
    if (fs.existsSync(TEST_CONFIG.database.testPath)) {
      try {
        fs.unlinkSync(TEST_CONFIG.database.testPath);
        console.log('✅ 测试数据库已清理');
      } catch (error) {
        console.warn('⚠️  清理测试数据库失败:', error.message);
      }
    }
  });
  
  /**
   * 基础连接测试
   */
  describe('基础连接测试', () => {
    test('后端服务健康检查', async () => {
      const response = await request(TEST_CONFIG.backend.baseUrl)
        .get('/api/health')
        .timeout(TEST_CONFIG.timeouts.api);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('database');
      expect(response.body).toHaveProperty('timestamp');
      
      console.log('✅ 后端健康检查通过');
    });
    
    test('后端根路径访问', async () => {
      const response = await request(TEST_CONFIG.backend.baseUrl)
        .get('/')
        .timeout(TEST_CONFIG.timeouts.api);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('status', 'running');
      
      console.log('✅ 后端根路径访问正常');
    });
    
    test('CORS头信息检查', async () => {
      const response = await request(TEST_CONFIG.backend.baseUrl)
        .get('/api/health')
        .timeout(TEST_CONFIG.timeouts.api);
      
      expect(response.headers).toHaveProperty('access-control-allow-origin');
      
      console.log('✅ CORS配置正常');
    });
  });
  
  /**
   * 完整抽签流程测试
   */
  describe('完整抽签流程测试', () => {
    test('首次抽签流程', async () => {
      console.log('🎲 测试首次抽签流程...');
      
      // 发送抽签请求
      const response = await request(TEST_CONFIG.backend.baseUrl)
        .post('/api/fortune')
        .send({ openid: testOpenid })
        .timeout(TEST_CONFIG.timeouts.api);
      
      // 验证响应
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      
      const fortuneData = response.body.data;
      expect(fortuneData).toHaveProperty('id');
      expect(fortuneData).toHaveProperty('text');
      expect(fortuneData).toHaveProperty('isNew', true);
      
      // 验证运势内容
      expect(typeof fortuneData.id).toBe('number');
      expect(typeof fortuneData.text).toBe('string');
      expect(fortuneData.text.length).toBeGreaterThan(0);
      
      console.log(`✅ 首次抽签成功 - 运势: ${fortuneData.text}`);
    });
    
    test('抽签冷却机制测试', async () => {
      console.log('⏰ 测试抽签冷却机制...');
      
      // 第一次抽签
      const firstResponse = await request(TEST_CONFIG.backend.baseUrl)
        .post('/api/fortune')
        .send({ openid: testOpenid })
        .timeout(TEST_CONFIG.timeouts.api);
      
      expect(firstResponse.status).toBe(200);
      expect(firstResponse.body.success).toBe(true);
      
      // 立即进行第二次抽签（应该被冷却机制阻止）
      const secondResponse = await request(TEST_CONFIG.backend.baseUrl)
        .post('/api/fortune')
        .send({ openid: testOpenid })
        .timeout(TEST_CONFIG.timeouts.api);
      
      expect(secondResponse.status).toBe(429); // Too Many Requests
      expect(secondResponse.body.success).toBe(false);
      expect(secondResponse.body).toHaveProperty('cooldown');
      expect(secondResponse.body.cooldown).toBeGreaterThan(0);
      
      console.log(`✅ 冷却机制正常 - 剩余冷却时间: ${secondResponse.body.cooldown}秒`);
    });
    
    test('多用户并发抽签测试', async () => {
      console.log('👥 测试多用户并发抽签...');
      
      // 创建多个测试用户
      const testUsers = Array.from({ length: 5 }, (_, i) => 
        `concurrent_user_${Date.now()}_${i}`
      );
      
      // 并发发送抽签请求
      const promises = testUsers.map(openid => 
        request(TEST_CONFIG.backend.baseUrl)
          .post('/api/fortune')
          .send({ openid })
          .timeout(TEST_CONFIG.timeouts.api)
      );
      
      const responses = await Promise.all(promises);
      
      // 验证所有请求都成功
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('text');
        
        console.log(`✅ 用户${index + 1}抽签成功`);
      });
      
      // 验证不同用户获得不同的运势（大概率）
      const fortuneIds = responses.map(r => r.body.data.id);
      const uniqueIds = new Set(fortuneIds);
      
      // 至少应该有一些不同的运势
      expect(uniqueIds.size).toBeGreaterThan(1);
      
      console.log(`✅ 并发抽签测试通过 - 获得${uniqueIds.size}种不同运势`);
    });
  });
  
  /**
   * 错误处理场景测试
   */
  describe('错误处理场景测试', () => {
    test('无效openid处理', async () => {
      console.log('❌ 测试无效openid处理...');
      
      const invalidOpenids = [
        '', // 空字符串
        null, // null值
        undefined, // undefined值
        'short', // 太短的openid
        123, // 数字类型
        {}, // 对象类型
      ];
      
      for (const invalidOpenid of invalidOpenids) {
        const response = await request(TEST_CONFIG.backend.baseUrl)
          .post('/api/fortune')
          .send({ openid: invalidOpenid })
          .timeout(TEST_CONFIG.timeouts.api);
        
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body).toHaveProperty('error');
        
        console.log(`✅ 无效openid "${invalidOpenid}" 正确被拒绝`);
      }
    });
    
    test('缺少请求参数处理', async () => {
      console.log('📝 测试缺少请求参数处理...');
      
      // 发送空请求体
      const response = await request(TEST_CONFIG.backend.baseUrl)
        .post('/api/fortune')
        .send({})
        .timeout(TEST_CONFIG.timeouts.api);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('openid');
      
      console.log('✅ 缺少参数正确处理');
    });
    
    test('无效JSON请求处理', async () => {
      console.log('🔧 测试无效JSON请求处理...');
      
      const response = await request(TEST_CONFIG.backend.baseUrl)
        .post('/api/fortune')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .timeout(TEST_CONFIG.timeouts.api);
      
      expect(response.status).toBe(400);
      
      console.log('✅ 无效JSON请求正确处理');
    });
    
    test('不存在的API端点', async () => {
      console.log('🔍 测试不存在的API端点...');
      
      const response = await request(TEST_CONFIG.backend.baseUrl)
        .get('/api/nonexistent')
        .timeout(TEST_CONFIG.timeouts.api);
      
      expect(response.status).toBe(404);
      
      console.log('✅ 404错误正确处理');
    });
  });
  
  /**
   * 数据一致性测试
   */
  describe('数据一致性测试', () => {
    test('用户抽签历史一致性', async () => {
      console.log('📊 测试用户抽签历史一致性...');
      
      const testUser = `history_test_${Date.now()}`;
      const drawCount = 3;
      const drawnFortunes = [];
      
      // 进行多次抽签（需要等待冷却时间）
      for (let i = 0; i < drawCount; i++) {
        if (i > 0) {
          // 等待冷却时间
          await new Promise(resolve => setTimeout(resolve, 11000));
        }
        
        const response = await request(TEST_CONFIG.backend.baseUrl)
          .post('/api/fortune')
          .send({ openid: testUser })
          .timeout(TEST_CONFIG.timeouts.api);
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        
        drawnFortunes.push(response.body.data.id);
        console.log(`✅ 第${i + 1}次抽签完成`);
      }
      
      // 验证没有重复的运势
      const uniqueFortunes = new Set(drawnFortunes);
      expect(uniqueFortunes.size).toBe(drawCount);
      
      console.log('✅ 用户抽签历史一致性验证通过');
    }, 60000); // 增加超时时间以等待冷却
    
    test('运势池完整性验证', async () => {
      console.log('🎯 测试运势池完整性...');
      
      // 获取健康检查信息
      const healthResponse = await request(TEST_CONFIG.backend.baseUrl)
        .get('/api/health')
        .timeout(TEST_CONFIG.timeouts.api);
      
      expect(healthResponse.status).toBe(200);
      expect(healthResponse.body.database).toBe('connected');
      
      // 进行一次抽签验证运势池可用
      const fortuneResponse = await request(TEST_CONFIG.backend.baseUrl)
        .post('/api/fortune')
        .send({ openid: `pool_test_${Date.now()}` })
        .timeout(TEST_CONFIG.timeouts.api);
      
      expect(fortuneResponse.status).toBe(200);
      expect(fortuneResponse.body.success).toBe(true);
      expect(fortuneResponse.body.data.id).toBeGreaterThan(0);
      
      console.log('✅ 运势池完整性验证通过');
    });
  });
  
  /**
   * 性能测试
   */
  describe('性能测试', () => {
    test('API响应时间测试', async () => {
      console.log('⚡ 测试API响应时间...');
      
      const testUser = `perf_test_${Date.now()}`;
      const startTime = Date.now();
      
      const response = await request(TEST_CONFIG.backend.baseUrl)
        .post('/api/fortune')
        .send({ openid: testUser })
        .timeout(TEST_CONFIG.timeouts.api);
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // 响应时间应小于5秒
      
      console.log(`✅ API响应时间: ${responseTime}ms`);
    });
    
    test('并发请求处理能力', async () => {
      console.log('🚀 测试并发请求处理能力...');
      
      const concurrentUsers = 10;
      const testUsers = Array.from({ length: concurrentUsers }, (_, i) => 
        `concurrent_perf_${Date.now()}_${i}`
      );
      
      const startTime = Date.now();
      
      const promises = testUsers.map(openid => 
        request(TEST_CONFIG.backend.baseUrl)
          .post('/api/fortune')
          .send({ openid })
          .timeout(TEST_CONFIG.timeouts.api)
      );
      
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      // 验证所有请求都成功
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
      
      const avgResponseTime = totalTime / concurrentUsers;
      expect(avgResponseTime).toBeLessThan(10000); // 平均响应时间应小于10秒
      
      console.log(`✅ 并发处理测试通过 - 总时间: ${totalTime}ms, 平均: ${avgResponseTime}ms`);
    });
  });
});

/**
 * 辅助函数：确保后端服务运行
 */
async function ensureBackendRunning() {
  try {
    // 尝试连接后端服务
    const response = await request(TEST_CONFIG.backend.baseUrl)
      .get('/api/health')
      .timeout(5000);
    
    if (response.status === 200) {
      console.log('✅ 后端服务已运行');
      return;
    }
  } catch (error) {
    console.log('⚠️  后端服务未运行，尝试启动...');
  }
  
  // 启动后端服务
  const backendPath = path.join(__dirname, '..', '..', 'backend');
  backendProcess = spawn('npm', ['run', 'dev'], {
    cwd: backendPath,
    stdio: 'pipe',
    shell: true
  });
  
  // 等待服务启动
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('后端服务启动超时'));
    }, TEST_CONFIG.backend.startupTimeout);
    
    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('服务器已启动在端口')) {
        clearTimeout(timeout);
        console.log('✅ 后端服务启动成功');
        resolve();
      }
    });
    
    backendProcess.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

/**
 * 辅助函数：生成测试数据
 */
function generateTestData() {
  return {
    validOpenids: [
      'test_openid_12345678901234567890',
      'wx_user_abcdefghijklmnopqrstuvwxyz',
      'miniprogram_user_1234567890abcdef'
    ],
    invalidOpenids: [
      '',
      null,
      undefined,
      'short',
      123,
      {},
      []
    ]
  };
}
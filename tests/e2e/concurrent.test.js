/**
 * 并发用户场景测试
 * 测试系统在多用户同时访问时的表现
 */

const request = require('supertest');

describe('并发用户场景测试', () => {
  const baseUrl = global.TEST_CONFIG.backend.baseUrl;
  const apiTimeout = global.TEST_CONFIG.timeouts.api;
  
  /**
   * 大量并发用户抽签测试
   */
  describe('大量并发抽签测试', () => {
    test('10个用户同时抽签', async () => {
      console.log('👥 测试10个用户同时抽签...');
      
      const userCount = 10;
      const testUsers = global.testDataGenerator.generateUserBatch(userCount, 'concurrent10');
      
      const startTime = Date.now();
      
      // 并发发送抽签请求
      const promises = testUsers.map(openid => 
        request(baseUrl)
          .post('/api/fortune')
          .send({ openid })
          .timeout(apiTimeout)
      );
      
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      // 验证所有请求都成功
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        global.testUtils.validateFortuneData(response.body.data);
        
        console.log(`✅ 用户${index + 1}: ${response.body.data.text.substring(0, 20)}...`);
      });
      
      // 性能验证
      const avgResponseTime = totalTime / userCount;
      expect(avgResponseTime).toBeLessThan(5000); // 平均响应时间小于5秒
      
      console.log(`✅ 10用户并发测试完成 - 总时间: ${totalTime}ms, 平均: ${avgResponseTime.toFixed(2)}ms`);
    }, 30000);
    
    test('50个用户同时抽签', async () => {
      console.log('👥 测试50个用户同时抽签...');
      
      const userCount = 50;
      const testUsers = global.testDataGenerator.generateUserBatch(userCount, 'concurrent50');
      
      const startTime = Date.now();
      
      // 分批并发请求（避免过载）
      const batchSize = 10;
      const batches = [];
      
      for (let i = 0; i < userCount; i += batchSize) {
        const batch = testUsers.slice(i, i + batchSize);
        batches.push(batch);
      }
      
      const allResponses = [];
      
      for (const batch of batches) {
        const batchPromises = batch.map(openid => 
          request(baseUrl)
            .post('/api/fortune')
            .send({ openid })
            .timeout(apiTimeout)
        );
        
        const batchResponses = await Promise.all(batchPromises);
        allResponses.push(...batchResponses);
        
        // 批次间短暂延迟
        await global.testUtils.sleep(100);
      }
      
      const totalTime = Date.now() - startTime;
      
      // 验证所有请求都成功
      let successCount = 0;
      allResponses.forEach((response, index) => {
        if (response.status === 200 && response.body.success) {
          successCount++;
          global.testUtils.validateFortuneData(response.body.data);
        }
      });
      
      // 至少90%的请求应该成功
      const successRate = (successCount / userCount) * 100;
      expect(successRate).toBeGreaterThanOrEqual(90);
      
      console.log(`✅ 50用户并发测试完成 - 成功率: ${successRate.toFixed(1)}%, 总时间: ${totalTime}ms`);
    }, 60000);
  });
  
  /**
   * 并发冷却机制测试
   */
  describe('并发冷却机制测试', () => {
    test('同一用户快速连续请求', async () => {
      console.log('⏰ 测试同一用户快速连续请求...');
      
      const testUser = global.testUtils.generateTestOpenid('cooldown');
      const requestCount = 5;
      
      // 快速连续发送多个请求
      const promises = Array.from({ length: requestCount }, () => 
        request(baseUrl)
          .post('/api/fortune')
          .send({ openid: testUser })
          .timeout(apiTimeout)
      );
      
      const responses = await Promise.all(promises);
      
      // 第一个请求应该成功
      expect(responses[0].status).toBe(200);
      expect(responses[0].body.success).toBe(true);
      
      // 后续请求应该被冷却机制阻止
      let blockedCount = 0;
      for (let i = 1; i < responses.length; i++) {
        if (responses[i].status === 429) {
          expect(responses[i].body.success).toBe(false);
          expect(responses[i].body).toHaveProperty('cooldown');
          blockedCount++;
        }
      }
      
      expect(blockedCount).toBeGreaterThan(0);
      
      console.log(`✅ 冷却机制测试通过 - ${blockedCount}个请求被正确阻止`);
    });
    
    test('多用户交替请求冷却测试', async () => {
      console.log('🔄 测试多用户交替请求冷却...');
      
      const users = global.testDataGenerator.generateUserBatch(3, 'alternating');
      const results = [];
      
      // 每个用户进行两次请求，中间有间隔
      for (const user of users) {
        // 第一次请求
        const firstResponse = await request(baseUrl)
          .post('/api/fortune')
          .send({ openid: user })
          .timeout(apiTimeout);
        
        results.push({ user, attempt: 1, response: firstResponse });
        
        // 短暂延迟
        await global.testUtils.sleep(1000);
        
        // 第二次请求（应该被冷却阻止）
        const secondResponse = await request(baseUrl)
          .post('/api/fortune')
          .send({ openid: user })
          .timeout(apiTimeout);
        
        results.push({ user, attempt: 2, response: secondResponse });
      }
      
      // 验证结果
      results.forEach(({ user, attempt, response }) => {
        if (attempt === 1) {
          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
          console.log(`✅ ${user} 第1次请求成功`);
        } else {
          expect(response.status).toBe(429);
          expect(response.body.success).toBe(false);
          console.log(`✅ ${user} 第2次请求被正确阻止`);
        }
      });
      
      console.log('✅ 多用户交替冷却测试通过');
    });
  });
  
  /**
   * 压力测试
   */
  describe('系统压力测试', () => {
    test('健康检查接口压力测试', async () => {
      console.log('💪 测试健康检查接口压力...');
      
      const requestCount = 100;
      const concurrency = 20;
      
      const startTime = Date.now();
      
      // 分批并发请求
      const batches = [];
      for (let i = 0; i < requestCount; i += concurrency) {
        const batchPromises = Array.from({ length: Math.min(concurrency, requestCount - i) }, () => 
          request(baseUrl)
            .get('/api/health')
            .timeout(apiTimeout)
        );
        batches.push(Promise.all(batchPromises));
      }
      
      const allBatchResults = await Promise.all(batches);
      const allResponses = allBatchResults.flat();
      
      const totalTime = Date.now() - startTime;
      
      // 验证所有请求都成功
      let successCount = 0;
      allResponses.forEach(response => {
        if (response.status === 200) {
          successCount++;
          expect(response.body).toHaveProperty('status', 'ok');
        }
      });
      
      const successRate = (successCount / requestCount) * 100;
      const avgResponseTime = totalTime / requestCount;
      
      expect(successRate).toBeGreaterThanOrEqual(95); // 95%以上成功率
      expect(avgResponseTime).toBeLessThan(1000); // 平均响应时间小于1秒
      
      console.log(`✅ 健康检查压力测试完成 - 成功率: ${successRate.toFixed(1)}%, 平均响应时间: ${avgResponseTime.toFixed(2)}ms`);
    }, 60000);
    
    test('混合API压力测试', async () => {
      console.log('🌪️  测试混合API压力...');
      
      const testUsers = global.testDataGenerator.generateUserBatch(20, 'mixed');
      const requests = [];
      
      // 混合不同类型的请求
      testUsers.forEach((user, index) => {
        if (index % 3 === 0) {
          // 健康检查请求
          requests.push({
            type: 'health',
            promise: request(baseUrl).get('/api/health').timeout(apiTimeout)
          });
        } else if (index % 3 === 1) {
          // 抽签请求
          requests.push({
            type: 'fortune',
            promise: request(baseUrl).post('/api/fortune').send({ openid: user }).timeout(apiTimeout)
          });
        } else {
          // 根路径请求
          requests.push({
            type: 'root',
            promise: request(baseUrl).get('/').timeout(apiTimeout)
          });
        }
      });
      
      const startTime = Date.now();
      const responses = await Promise.all(requests.map(req => req.promise));
      const totalTime = Date.now() - startTime;
      
      // 统计结果
      const stats = {
        health: { total: 0, success: 0 },
        fortune: { total: 0, success: 0 },
        root: { total: 0, success: 0 }
      };
      
      responses.forEach((response, index) => {
        const type = requests[index].type;
        stats[type].total++;
        
        if (response.status === 200 || (type === 'fortune' && response.status === 429)) {
          stats[type].success++;
        }
      });
      
      // 验证结果
      Object.entries(stats).forEach(([type, stat]) => {
        if (stat.total > 0) {
          const successRate = (stat.success / stat.total) * 100;
          expect(successRate).toBeGreaterThanOrEqual(90);
          console.log(`✅ ${type}请求成功率: ${successRate.toFixed(1)}% (${stat.success}/${stat.total})`);
        }
      });
      
      console.log(`✅ 混合API压力测试完成 - 总时间: ${totalTime}ms`);
    }, 60000);
  });
  
  /**
   * 资源竞争测试
   */
  describe('资源竞争测试', () => {
    test('数据库并发访问测试', async () => {
      console.log('🗄️  测试数据库并发访问...');
      
      const userCount = 15;
      const testUsers = global.testDataGenerator.generateUserBatch(userCount, 'dbconcurrent');
      
      // 同时发送大量数据库操作请求
      const promises = testUsers.map(openid => 
        request(baseUrl)
          .post('/api/fortune')
          .send({ openid })
          .timeout(apiTimeout)
      );
      
      const responses = await Promise.all(promises);
      
      // 验证数据一致性
      const successfulResponses = responses.filter(r => r.status === 200 && r.body.success);
      const fortuneIds = successfulResponses.map(r => r.body.data.id);
      
      // 检查是否有重复的运势ID（不应该有，因为每个用户应该得到不同的运势）
      const uniqueIds = new Set(fortuneIds);
      
      // 由于运势池有限，可能会有重复，但应该大部分是唯一的
      const uniqueRatio = uniqueIds.size / fortuneIds.length;
      expect(uniqueRatio).toBeGreaterThan(0.5); // 至少50%是唯一的
      
      console.log(`✅ 数据库并发访问测试通过 - 唯一运势比例: ${(uniqueRatio * 100).toFixed(1)}%`);
    });
  });
});
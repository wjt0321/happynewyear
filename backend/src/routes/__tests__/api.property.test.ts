import request from 'supertest';
import express from 'express';
import routes from '../index';
import { database } from '../../database';
import { FortuneCategory } from '../../types';
import {
  corsMiddleware,
  securityMiddleware,
  requestLogger,
  jsonErrorHandler,
  globalErrorHandler,
  notFoundHandler
} from '../../middleware';

// 模拟数据库
jest.mock('../../database');
const mockDatabase = database as jest.Mocked<typeof database>;

// 创建测试用的Express应用（不启动服务器）
const createTestApp = () => {
  const app = express();
  
  // 基础中间件
  app.use(securityMiddleware);
  app.use(corsMiddleware);
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(jsonErrorHandler);
  
  // API路由
  app.use('/api', routes);
  
  // 404处理
  app.use(notFoundHandler);
  
  // 全局错误处理
  app.use(globalErrorHandler);
  
  return app;
};

describe('API接口属性测试', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * 属性 4: 用户身份识别一致性
   * 对于任何API请求，系统必须通过openid正确识别用户身份，且同一openid在所有请求中代表同一用户
   * 验证需求：需求 2.5, 8.3
   * Feature: wechat-fortune-draw, Property 4: 用户身份识别一致性
   */
  test('属性 4: 用户身份识别一致性 - 20次迭代', async () => {
    for (let iteration = 0; iteration < 20; iteration++) {
      // 清理之前的mock调用记录
      jest.clearAllMocks();
      
      // 生成随机的openid（模拟微信用户标识）
      const testOpenid = `wx_user_${Math.random().toString(36).substring(2, 15)}`;
      
      // 模拟数据库返回
      mockDatabase.getLastDrawTime.mockResolvedValue(null);
      mockDatabase.getAvailableFortunes.mockResolvedValue([
        { id: 1, text: '测试运势', category: 'general' as FortuneCategory, created_at: '2024-01-01' }
      ]);
      mockDatabase.recordUserDraw.mockResolvedValue();

      // 发送抽签请求
      const response = await request(app)
        .post('/api/fortune')
        .send({ openid: testOpenid });

      // 验证属性：系统必须正确识别用户身份
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // 验证数据库调用使用了正确的openid
      expect(mockDatabase.getLastDrawTime).toHaveBeenCalledWith(testOpenid);
      expect(mockDatabase.getAvailableFortunes).toHaveBeenCalledWith(testOpenid);
      expect(mockDatabase.recordUserDraw).toHaveBeenCalledWith(testOpenid, 1);
      
      // 验证同一openid在所有调用中保持一致
      const lastDrawCalls = mockDatabase.getLastDrawTime.mock.calls;
      const availableFortuneCalls = mockDatabase.getAvailableFortunes.mock.calls;
      const recordDrawCalls = mockDatabase.recordUserDraw.mock.calls;
      
      // 验证每个调用都使用了正确的openid
      expect(lastDrawCalls[0][0]).toBe(testOpenid);
      expect(availableFortuneCalls[0][0]).toBe(testOpenid);
      expect(recordDrawCalls[0][0]).toBe(testOpenid);
    }
  });

  /**
   * 属性 5: API请求格式验证
   * 对于任何发送到/api/fortune的请求，系统必须验证请求包含有效的openid字段
   * 验证需求：需求 5.2
   * Feature: wechat-fortune-draw, Property 5: API请求格式验证
   */
  test('属性 5: API请求格式验证 - 15次迭代', async () => {
    for (let iteration = 0; iteration < 15; iteration++) {
      // 生成各种无效的请求数据
      const invalidRequests = [
        {}, // 缺少openid
        { openid: null }, // openid为null
        { openid: undefined }, // openid为undefined
        { openid: '' }, // openid为空字符串
        { openid: '123' }, // openid太短（小于10位）
        { openid: 123 }, // openid不是字符串
        { openid: [] }, // openid是数组
        { openid: {} }, // openid是对象
        { wrongField: 'wx_user_123456789' }, // 字段名错误
      ];

      // 随机选择一个无效请求
      const invalidRequest = invalidRequests[Math.floor(Math.random() * invalidRequests.length)];

      const response = await request(app)
        .post('/api/fortune')
        .send(invalidRequest);

      // 验证属性：系统必须拒绝无效请求
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      
      // 验证错误消息包含相关信息
      const errorMessage = response.body.error.toLowerCase();
      expect(
        errorMessage.includes('openid') || 
        errorMessage.includes('参数') || 
        errorMessage.includes('格式')
      ).toBe(true);
      
      // 验证数据库不会被调用（因为请求被拒绝）
      expect(mockDatabase.getLastDrawTime).not.toHaveBeenCalled();
      expect(mockDatabase.getAvailableFortunes).not.toHaveBeenCalled();
      expect(mockDatabase.recordUserDraw).not.toHaveBeenCalled();
      
      // 清理mock调用记录
      jest.clearAllMocks();
    }
  });

  /**
   * 属性 6: API响应格式一致性
   * 对于任何成功的抽签请求，API响应必须包含id、text、isNew三个必需字段
   * 验证需求：需求 5.3
   * Feature: wechat-fortune-draw, Property 6: API响应格式一致性
   */
  test('属性 6: API响应格式一致性 - 25次迭代', async () => {
    for (let iteration = 0; iteration < 25; iteration++) {
      const testOpenid = `wx_user_${iteration}_${Math.random().toString(36).substring(2, 10)}`;
      
      // 随机生成运势数据
      const fortuneId = Math.floor(Math.random() * 50) + 1;
      const fortuneText = `新年运势${fortuneId}：${Math.random() > 0.5 ? '大吉' : '吉利'}`;
      const categories: FortuneCategory[] = ['wealth', 'career', 'love', 'health', 'study', 'general'];
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      
      // 模拟成功的抽签条件
      mockDatabase.getLastDrawTime.mockResolvedValue(null);
      mockDatabase.getAvailableFortunes.mockResolvedValue([
        { 
          id: fortuneId, 
          text: fortuneText, 
          category: randomCategory, 
          created_at: '2024-01-01' 
        }
      ]);
      mockDatabase.recordUserDraw.mockResolvedValue();

      const response = await request(app)
        .post('/api/fortune')
        .send({ openid: testOpenid });

      // 验证属性：成功响应必须包含标准格式
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      
      // 验证必需字段存在且类型正确
      const data = response.body.data;
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('text');
      expect(data).toHaveProperty('isNew');
      
      // 验证字段类型
      expect(typeof data.id).toBe('number');
      expect(typeof data.text).toBe('string');
      expect(typeof data.isNew).toBe('boolean');
      
      // 验证字段值的合理性
      expect(data.id).toBe(fortuneId);
      expect(data.text).toBe(fortuneText);
      expect(data.isNew).toBe(true); // 新抽取的运势应该标记为新的
      
      // 验证响应不包含多余的敏感字段
      expect(data).not.toHaveProperty('created_at');
      expect(data).not.toHaveProperty('category'); // 分类信息不应该暴露给前端
      
      // 验证响应结构的一致性
      const responseKeys = Object.keys(response.body);
      expect(responseKeys).toContain('success');
      expect(responseKeys).toContain('data');
      expect(responseKeys.length).toBeGreaterThanOrEqual(2);
      
      // 清理mock调用记录
      jest.clearAllMocks();
    }
  });

  /**
   * 健康检查接口响应格式验证
   * 验证需求：需求 5
   */
  test('健康检查接口响应格式一致性 - 10次迭代', async () => {
    for (let iteration = 0; iteration < 10; iteration++) {
      // 随机模拟数据库连接状态
      const isConnected = Math.random() > 0.2; // 80%概率连接成功
      mockDatabase.checkConnection.mockResolvedValue(isConnected);

      const response = await request(app).get('/api/health');

      // 验证响应格式
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('database');
      
      // 验证字段类型和值
      expect(response.body.status).toBe('ok');
      expect(typeof response.body.timestamp).toBe('string');
      expect(['connected', 'error']).toContain(response.body.database);
      
      // 验证时间戳格式（ISO 8601）
      expect(() => new Date(response.body.timestamp)).not.toThrow();
      
      // 验证数据库状态与mock返回值一致
      expect(response.body.database).toBe(isConnected ? 'connected' : 'error');
      
      // 清理mock调用记录
      jest.clearAllMocks();
    }
  });

  /**
   * 冷却期响应格式验证
   * 验证冷却期间的响应格式一致性
   */
  test('冷却期响应格式一致性 - 10次迭代', async () => {
    for (let iteration = 0; iteration < 10; iteration++) {
      const testOpenid = `cooldown_user_${iteration}`;
      
      // 模拟冷却期内的抽签时间（1-9秒前）
      const secondsAgo = Math.floor(Math.random() * 9) + 1;
      const recentTime = new Date(Date.now() - secondsAgo * 1000);
      
      mockDatabase.getLastDrawTime.mockResolvedValue(recentTime);

      const response = await request(app)
        .post('/api/fortune')
        .send({ openid: testOpenid });

      // 验证冷却期响应格式
      expect(response.status).toBe(429); // Too Many Requests
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.cooldown).toBeDefined();
      
      // 验证冷却时间的合理性
      expect(typeof response.body.cooldown).toBe('number');
      expect(response.body.cooldown).toBeGreaterThan(0);
      expect(response.body.cooldown).toBeLessThanOrEqual(10);
      
      // 验证错误消息包含等待提示
      expect(response.body.error).toContain('请等待');
      
      // 清理mock调用记录
      jest.clearAllMocks();
    }
  });
});
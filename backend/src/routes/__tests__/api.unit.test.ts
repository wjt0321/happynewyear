import request from 'supertest';
import express from 'express';
import routes from '../index';
import { database } from '../../database';
import { FortuneCategory } from '../../types';
import {
  corsMiddleware,
  securityMiddleware,
  jsonErrorHandler,
  globalErrorHandler,
  notFoundHandler
} from '../../middleware';

// 模拟数据库
jest.mock('../../database');
const mockDatabase = database as jest.Mocked<typeof database>;

// 创建测试用的Express应用
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

describe('API接口单元测试 - 简化版', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/fortune - 有效请求处理', () => {
    test('应该成功处理有效的抽签请求', async () => {
      const testOpenid = 'wx_valid_user_1234567890';
      
      // 模拟成功的抽签条件
      mockDatabase.getLastDrawTime.mockResolvedValue(null);
      mockDatabase.getAvailableFortunes.mockResolvedValue([
        { 
          id: 1, 
          text: '新年大吉，万事如意！', 
          category: 'general' as FortuneCategory, 
          created_at: '2024-01-01' 
        }
      ]);
      mockDatabase.recordUserDraw.mockResolvedValue();

      const response = await request(app)
        .post('/api/fortune')
        .send({ openid: testOpenid });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
      expect(response.body.data.text).toBe('新年大吉，万事如意！');
      expect(response.body.data.isNew).toBe(true);
    });

    test('应该正确处理冷却期内的请求', async () => {
      const testOpenid = 'wx_cooldown_user_123';
      
      // 模拟5秒前的抽签时间（冷却期内）
      const recentTime = new Date(Date.now() - 5000);
      mockDatabase.getLastDrawTime.mockResolvedValue(recentTime);

      const response = await request(app)
        .post('/api/fortune')
        .send({ openid: testOpenid });

      expect(response.status).toBe(429); // Too Many Requests
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('请等待');
      expect(response.body.cooldown).toBeGreaterThan(0);
    });

    test('应该正确处理运势池耗尽的情况', async () => {
      const testOpenid = 'wx_exhausted_user_123';
      
      // 模拟运势池耗尽
      mockDatabase.getLastDrawTime.mockResolvedValue(null);
      mockDatabase.getAvailableFortunes.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/fortune')
        .send({ openid: testOpenid });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('恭喜您！已经抽完了所有运势');
    });
  });

  describe('POST /api/fortune - 无效openid处理', () => {
    test('应该拒绝缺少openid的请求', async () => {
      const response = await request(app)
        .post('/api/fortune')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('缺少必需参数: openid');
    });

    test('应该拒绝openid太短的请求', async () => {
      const response = await request(app)
        .post('/api/fortune')
        .send({ openid: '123456789' }); // 只有9位，少于10位

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('openid格式无效');
    });

    test('应该接受有效长度的openid', async () => {
      const validOpenid = 'wx_1234567890'; // 正好10位以上
      
      mockDatabase.getLastDrawTime.mockResolvedValue(null);
      mockDatabase.getAvailableFortunes.mockResolvedValue([
        { id: 1, text: '测试运势', category: 'general' as FortuneCategory, created_at: '2024-01-01' }
      ]);
      mockDatabase.recordUserDraw.mockResolvedValue();

      const response = await request(app)
        .post('/api/fortune')
        .send({ openid: validOpenid });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/fortune - 服务器错误处理', () => {
    test('应该处理JSON格式错误', async () => {
      const response = await request(app)
        .post('/api/fortune')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('JSON格式错误');
    });
  });

  describe('GET /api/health - 健康检查接口', () => {
    test('应该返回健康状态（数据库连接正常）', async () => {
      mockDatabase.checkConnection.mockResolvedValue(true);

      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.database).toBe('connected');
      expect(response.body.timestamp).toBeDefined();
    });

    test('应该返回健康状态（数据库连接异常）', async () => {
      mockDatabase.checkConnection.mockResolvedValue(false);

      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.database).toBe('error');
    });
  });

  describe('404处理', () => {
    test('应该返回404错误对于不存在的路由', async () => {
      const response = await request(app).get('/api/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('接口不存在');
    });
  });
});
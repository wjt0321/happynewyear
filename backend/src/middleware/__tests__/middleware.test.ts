import request from 'supertest';
import express from 'express';
import {
  corsMiddleware,
  requestLogger,
  validateFortuneRequest,
  globalErrorHandler,
  notFoundHandler,
  jsonErrorHandler
} from '../index';

describe('中间件测试', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
  });

  describe('CORS中间件', () => {
    beforeEach(() => {
      app.use(corsMiddleware);
      app.get('/test', (req, res) => {
        res.json({ message: 'test' });
      });
    });

    test('应该设置正确的CORS头', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:8080')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    test('应该处理OPTIONS预检请求', async () => {
      await request(app)
        .options('/test')
        .set('Origin', 'http://localhost:8080')
        .set('Access-Control-Request-Method', 'GET')
        .expect(204);
    });
  });

  describe('请求验证中间件', () => {
    beforeEach(() => {
      app.use(express.json());
      app.post('/fortune', validateFortuneRequest, (req, res) => {
        res.json({ success: true });
      });
    });

    test('有效的openid应该通过验证', async () => {
      await request(app)
        .post('/fortune')
        .send({ openid: 'valid_openid_12345' })
        .expect(200);
    });

    test('缺少openid应该返回400错误', async () => {
      const response = await request(app)
        .post('/fortune')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('缺少必需参数');
    });

    test('无效的openid格式应该返回400错误', async () => {
      const response = await request(app)
        .post('/fortune')
        .send({ openid: 'short' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('openid格式无效');
    });

    test('非字符串openid应该返回400错误', async () => {
      const response = await request(app)
        .post('/fortune')
        .send({ openid: 12345 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('openid格式无效');
    });
  });

  describe('JSON错误处理中间件', () => {
    beforeEach(() => {
      app.use(express.json());
      app.use(jsonErrorHandler);
      app.post('/test', (req, res) => {
        res.json({ received: req.body });
      });
    });

    test('有效JSON应该正常处理', async () => {
      await request(app)
        .post('/test')
        .send({ valid: 'json' })
        .expect(200);
    });

    test('无效JSON应该返回400错误', async () => {
      const response = await request(app)
        .post('/test')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('JSON格式错误');
    });
  });

  describe('全局错误处理中间件', () => {
    beforeEach(() => {
      app.get('/error', (req, res, next) => {
        const error = new Error('测试错误');
        next(error);
      });

      app.get('/sqlite-constraint', (req, res, next) => {
        const error = new Error('SQLITE_CONSTRAINT: UNIQUE constraint failed');
        next(error);
      });

      app.get('/sqlite-cantopen', (req, res, next) => {
        const error = new Error('SQLITE_CANTOPEN: unable to open database file');
        next(error);
      });

      app.use(globalErrorHandler);
    });

    test('一般错误应该返回500状态码', async () => {
      const response = await request(app)
        .get('/error')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('服务器内部错误');
    });

    test('SQLite约束错误应该返回409状态码', async () => {
      const response = await request(app)
        .get('/sqlite-constraint')
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('数据冲突');
    });

    test('SQLite连接错误应该返回503状态码', async () => {
      const response = await request(app)
        .get('/sqlite-cantopen')
        .expect(503);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('数据库服务暂时不可用');
    });
  });

  describe('404处理中间件', () => {
    beforeEach(() => {
      app.use(notFoundHandler);
    });

    test('不存在的路由应该返回404', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('接口不存在');
    });
  });

  describe('请求日志中间件', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      app.use(requestLogger);
      app.get('/test', (req, res) => {
        res.json({ message: 'test' });
      });
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    test('应该记录请求日志', async () => {
      await request(app)
        .get('/test')
        .expect(200);

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0][0];
      expect(logCall).toContain('GET /test');
      expect(logCall).toContain('200');
    });
  });
});
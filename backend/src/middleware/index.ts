import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from '../config';
import { AppError } from '../utils/errors';

/**
 * CORS中间件配置
 */
export const corsMiddleware = cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
});

/**
 * 安全头中间件
 */
export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
});

/**
 * 请求日志中间件
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const { method, url, ip } = req;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    console.log(`${new Date().toISOString()} - ${method} ${url} - ${statusCode} - ${duration}ms - ${ip}`);
  });
  
  next();
};

/**
 * JSON解析错误处理中间件
 */
export const jsonErrorHandler = (error: any, req: Request, res: Response, next: NextFunction): void => {
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({
      success: false,
      error: 'JSON格式错误'
    });
    return;
  }
  next(error);
};

/**
 * 请求体验证中间件
 */
export const validateFortuneRequest = (req: Request, res: Response, next: NextFunction): void => {
  const { openid } = req.body;
  
  if (!openid) {
    res.status(400).json({
      success: false,
      error: '缺少必需参数: openid'
    });
    return;
  }
  
  if (typeof openid !== 'string' || openid.length < 10) {
    res.status(400).json({
      success: false,
      error: 'openid格式无效'
    });
    return;
  }
  
  next();
};

/**
 * 微信登录请求验证中间件
 */
export const validateWeChatLoginRequest = (req: Request, res: Response, next: NextFunction): void => {
  const { code } = req.body;
  
  if (!code) {
    res.status(400).json({
      success: false,
      error: '缺少必需参数: code'
    });
    return;
  }
  
  if (typeof code !== 'string' || code.length < 10) {
    res.status(400).json({
      success: false,
      error: '登录凭证格式无效'
    });
    return;
  }
  
  next();
};

/**
 * 全局错误处理中间件
 */
export const globalErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error('全局错误:', err);
  
  // 处理自定义错误
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
      ...(err.details && { details: err.details })
    });
    return;
  }
  
  // 数据库约束错误
  if (err.message.includes('SQLITE_CONSTRAINT')) {
    res.status(409).json({
      success: false,
      error: '数据冲突，请重试',
      code: 'DATABASE_CONSTRAINT'
    });
    return;
  }
  
  // 数据库连接错误
  if (err.message.includes('SQLITE_CANTOPEN')) {
    res.status(503).json({
      success: false,
      error: '数据库服务暂时不可用',
      code: 'DATABASE_UNAVAILABLE'
    });
    return;
  }
  
  // 默认服务器错误
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
    code: 'INTERNAL_ERROR'
  });
};

/**
 * 404处理中间件
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: '接口不存在'
  });
};
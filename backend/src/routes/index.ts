import { Router, Request, Response } from 'express';
import { fortuneService } from '../services/fortuneService';
import { authService } from '../services/authService';
import { database } from '../database';
import { validateFortuneRequest, validateWeChatLoginRequest } from '../middleware';
import { FortuneRequest, HealthResponse, WeChatLoginRequest, WeChatLoginResponse } from '../types';

const router = Router();

/**
 * 健康检查接口
 * GET /api/health
 */
router.get('/health', async (req: Request, res: Response<HealthResponse>) => {
  const isDbConnected = await database.checkConnection();
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: isDbConnected ? 'connected' : 'error'
  });
});

/**
 * 微信登录接口
 * POST /api/auth/login
 */
router.post('/auth/login', validateWeChatLoginRequest, async (req: Request<{}, WeChatLoginResponse, WeChatLoginRequest>, res: Response<WeChatLoginResponse>) => {
  const { code } = req.body;
  
  try {
    console.log('收到微信登录请求，code:', code);
    
    // 使用code换取openid
    const loginResult = await authService.exchangeCodeForOpenid(code);
    
    if (loginResult.success && loginResult.openid) {
      // 创建或更新用户信息
      const userResult = await authService.createOrUpdateUser(loginResult.openid);
      
      if (!userResult.success) {
        console.warn('用户信息处理失败:', userResult.error);
        // 即使用户信息处理失败，登录仍然可以成功
      }
      
      console.log('微信登录成功，openid:', loginResult.openid);
      res.json(loginResult);
    } else {
      console.error('微信登录失败:', loginResult.error);
      res.status(400).json(loginResult);
    }
  } catch (error) {
    console.error('微信登录接口错误:', error);
    res.status(500).json({
      success: false,
      error: '登录服务暂时不可用，请稍后重试'
    });
  }
});

/**
 * 抽签接口
 * POST /api/fortune
 */
router.post('/fortune', validateFortuneRequest, async (req: Request<{}, any, FortuneRequest>, res: Response) => {
  const { openid } = req.body;
  
  try {
    const result = await fortuneService.drawFortune(openid);
    
    if (result.success) {
      res.json(result);
    } else {
      // 根据错误类型返回不同的状态码
      if (result.cooldown && result.cooldown > 0) {
        res.status(429).json(result); // Too Many Requests
      } else if (result.error?.includes('抽完了所有运势')) {
        res.status(200).json(result); // 正常完成，但没有更多运势
      } else {
        res.status(400).json(result); // Bad Request
      }
    }
  } catch (error) {
    console.error('抽签接口错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

/**
 * 获取用户统计信息接口（可选，用于调试）
 * GET /api/stats/:openid
 */
router.get('/stats/:openid', async (req: Request, res: Response): Promise<void> => {
  const { openid } = req.params;
  
  if (!openid || openid.length < 10) {
    res.status(400).json({
      success: false,
      error: 'openid格式无效'
    });
    return;
  }
  
  try {
    const stats = await fortuneService.getUserStats(openid);
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取用户统计信息错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

export default router;
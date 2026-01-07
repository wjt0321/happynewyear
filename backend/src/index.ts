import express from 'express';
import { config } from './config';
import routes from './routes';
import {
  corsMiddleware,
  securityMiddleware,
  requestLogger,
  jsonErrorHandler,
  globalErrorHandler,
  notFoundHandler
} from './middleware';

// 创建Express应用
const app = express();

// 基础中间件
app.use(securityMiddleware);
app.use(corsMiddleware);
app.use(requestLogger);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// JSON解析错误处理
app.use(jsonErrorHandler);

// API路由
app.use('/api', routes);

// 根路径健康检查
app.get('/', (req, res) => {
  res.json({
    message: '微信小程序新年抽签应用后端服务',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// 404处理
app.use(notFoundHandler);

// 全局错误处理
app.use(globalErrorHandler);

// 启动服务器
const server = app.listen(config.port, () => {
  console.log(`🚀 服务器已启动在端口 ${config.port}`);
  console.log(`📊 健康检查: http://localhost:${config.port}/api/health`);
  console.log(`🎲 抽签接口: http://localhost:${config.port}/api/fortune`);
  console.log(`🗄️  数据库路径: ${config.database.path}`);
});

// 优雅关闭处理
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

export default app;
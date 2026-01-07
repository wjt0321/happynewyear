import * as fs from 'fs';
import * as path from 'path';

// 测试环境配置
process.env.NODE_ENV = 'test';

// 测试前清理
beforeAll(() => {
  // 清理可能存在的测试数据库文件
  const testDbPath = './test-data/test.db';
  if (fs.existsSync(testDbPath)) {
    try {
      fs.unlinkSync(testDbPath);
    } catch (error) {
      // 忽略文件锁定错误
    }
  }
});

// 测试后清理
afterAll(async () => {
  // 等待一段时间确保数据库连接关闭
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // 清理测试数据库文件
  const testDbPath = './test-data/test.db';
  if (fs.existsSync(testDbPath)) {
    try {
      fs.unlinkSync(testDbPath);
    } catch (error) {
      // 忽略文件锁定错误
    }
  }
  
  // 清理测试数据目录
  const testDataDir = './test-data';
  if (fs.existsSync(testDataDir)) {
    try {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    } catch (error) {
      // 忽略清理错误
    }
  }
});
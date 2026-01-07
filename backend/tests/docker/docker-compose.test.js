/**
 * Docker Compose部署测试
 * 测试Docker Compose配置是否正确工作
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

describe('Docker Compose部署测试', () => {
  const projectRoot = path.resolve(__dirname, '../../..');
  const testComposeFile = 'docker-compose.test.yml';
  const testEnvFile = '.env.test';

  // 测试超时时间
  jest.setTimeout(300000); // 5分钟

  beforeAll(() => {
    // 切换到项目根目录
    process.chdir(projectRoot);

    // 创建测试用的compose文件
    const testComposeContent = `
version: '3.8'

services:
  fortune-backend-test:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: runtime
    image: wechat-fortune-draw:compose-test
    container_name: fortune-backend-compose-test
    ports:
      - "3002:3000"
    environment:
      - NODE_ENV=test
      - PORT=3000
      - DB_PATH=/app/data/fortune.db
    volumes:
      - ./test-data:/app/data
      - ./test-logs:/app/logs
    healthcheck:
      test: ["CMD", "node", "-e", "const http = require('http'); const options = { host: 'localhost', port: 3000, path: '/api/health', timeout: 2000 }; const req = http.request(options, (res) => { if (res.statusCode === 200) { process.exit(0); } else { process.exit(1); } }); req.on('error', () => process.exit(1)); req.on('timeout', () => process.exit(1)); req.end();"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    networks:
      - test-network

networks:
  test-network:
    driver: bridge
`;

    fs.writeFileSync(testComposeFile, testComposeContent);

    // 创建测试环境变量文件
    const testEnvContent = `
NODE_ENV=test
PORT=3000
DB_PATH=/app/data/fortune.db
`;
    fs.writeFileSync(testEnvFile, testEnvContent);

    // 创建测试数据目录
    if (!fs.existsSync('./test-data')) {
      fs.mkdirSync('./test-data', { recursive: true });
    }
    if (!fs.existsSync('./test-logs')) {
      fs.mkdirSync('./test-logs', { recursive: true });
    }

    // 清理可能存在的测试容器
    try {
      execSync(`docker-compose -f ${testComposeFile} down -v`, { stdio: 'ignore' });
    } catch (error) {
      // 忽略错误
    }
  });

  afterAll(() => {
    // 清理测试资源
    try {
      execSync(`docker-compose -f ${testComposeFile} down -v`, { stdio: 'ignore' });
      execSync('docker rmi wechat-fortune-draw:compose-test', { stdio: 'ignore' });
    } catch (error) {
      // 忽略清理错误
    }

    // 删除测试文件
    try {
      fs.unlinkSync(testComposeFile);
      fs.unlinkSync(testEnvFile);
      fs.rmSync('./test-data', { recursive: true, force: true });
      fs.rmSync('./test-logs', { recursive: true, force: true });
    } catch (error) {
      // 忽略删除错误
    }
  });

  test('应该能够解析Docker Compose配置文件', () => {
    // 验证compose文件语法
    expect(() => {
      execSync(`docker-compose -f ${testComposeFile} config`, { 
        stdio: 'pipe' 
      });
    }).not.toThrow();
  });

  test('应该能够构建和启动服务', async () => {
    console.log('构建和启动Docker Compose服务...');
    
    // 构建并启动服务
    execSync(`docker-compose -f ${testComposeFile} up -d --build`, {
      stdio: 'pipe'
    });

    // 等待服务启动
    await new Promise(resolve => setTimeout(resolve, 30000));

    // 检查服务状态
    const services = execSync(`docker-compose -f ${testComposeFile} ps`, {
      encoding: 'utf8'
    });

    expect(services).toContain('fortune-backend-compose-test');
    expect(services).toContain('Up');
  });

  test('服务应该通过健康检查', async () => {
    let healthCheckPassed = false;
    let attempts = 0;
    const maxAttempts = 30;

    while (!healthCheckPassed && attempts < maxAttempts) {
      try {
        const healthResponse = execSync('curl -f http://localhost:3002/api/health', {
          encoding: 'utf8',
          stdio: 'pipe'
        });
        
        const healthData = JSON.parse(healthResponse);
        if (healthData.status === 'ok') {
          healthCheckPassed = true;
        }
      } catch (error) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    expect(healthCheckPassed).toBe(true);
  });

  test('数据卷应该正确挂载', () => {
    // 检查数据目录挂载
    const dataMount = execSync('docker-compose -f docker-compose.test.yml exec -T fortune-backend-test ls -la /app/data', {
      encoding: 'utf8'
    });

    expect(dataMount).toContain('total');

    // 在容器内创建测试文件
    execSync('docker-compose -f docker-compose.test.yml exec -T fortune-backend-test touch /app/data/test-file.txt');

    // 检查宿主机上是否存在该文件
    expect(fs.existsSync('./test-data/test-file.txt')).toBe(true);
  });

  test('网络配置应该正确工作', () => {
    // 检查网络是否创建
    const networks = execSync('docker network ls', {
      encoding: 'utf8'
    });

    expect(networks).toContain('test-network');

    // 检查容器网络连接
    const networkInfo = execSync('docker-compose -f docker-compose.test.yml exec -T fortune-backend-test ip route', {
      encoding: 'utf8'
    });

    expect(networkInfo).toContain('172.');
  });

  test('环境变量应该正确传递', () => {
    // 检查环境变量
    const nodeEnv = execSync('docker-compose -f docker-compose.test.yml exec -T fortune-backend-test printenv NODE_ENV', {
      encoding: 'utf8'
    }).trim();

    expect(nodeEnv).toBe('test');

    const dbPath = execSync('docker-compose -f docker-compose.test.yml exec -T fortune-backend-test printenv DB_PATH', {
      encoding: 'utf8'
    }).trim();

    expect(dbPath).toBe('/app/data/fortune.db');
  });

  test('服务应该能够正确响应API请求', async () => {
    // 测试健康检查接口
    const healthResponse = execSync('curl -s http://localhost:3002/api/health', {
      encoding: 'utf8'
    });

    const healthData = JSON.parse(healthResponse);
    expect(healthData.status).toBe('ok');
    expect(healthData.database).toBe('connected');

    // 测试根路径
    const rootResponse = execSync('curl -s http://localhost:3002/', {
      encoding: 'utf8'
    });

    const rootData = JSON.parse(rootResponse);
    expect(rootData.message).toContain('微信小程序新年抽签应用后端服务');
  });

  test('日志应该正确输出', () => {
    // 获取服务日志
    const logs = execSync(`docker-compose -f ${testComposeFile} logs fortune-backend-test`, {
      encoding: 'utf8'
    });

    expect(logs).toContain('服务器已启动在端口');
    expect(logs).toContain('数据库路径:');
  });

  test('应该能够正确停止和清理服务', () => {
    // 停止服务
    execSync(`docker-compose -f ${testComposeFile} down`, {
      stdio: 'pipe'
    });

    // 检查容器是否已停止
    const runningContainers = execSync('docker ps --filter "name=fortune-backend-compose-test"', {
      encoding: 'utf8'
    });

    expect(runningContainers).not.toContain('fortune-backend-compose-test');
  });

  test('应该能够处理服务重启', async () => {
    console.log('测试服务重启...');
    
    // 重新启动服务
    execSync(`docker-compose -f ${testComposeFile} up -d`, {
      stdio: 'pipe'
    });

    // 等待服务启动
    await new Promise(resolve => setTimeout(resolve, 20000));

    // 验证服务正常运行
    const healthResponse = execSync('curl -s http://localhost:3002/api/health', {
      encoding: 'utf8'
    });

    const healthData = JSON.parse(healthResponse);
    expect(healthData.status).toBe('ok');

    // 重启服务
    execSync(`docker-compose -f ${testComposeFile} restart`, {
      stdio: 'pipe'
    });

    // 等待重启完成
    await new Promise(resolve => setTimeout(resolve, 15000));

    // 再次验证服务正常
    const healthResponse2 = execSync('curl -s http://localhost:3002/api/health', {
      encoding: 'utf8'
    });

    const healthData2 = JSON.parse(healthResponse2);
    expect(healthData2.status).toBe('ok');
  });
});
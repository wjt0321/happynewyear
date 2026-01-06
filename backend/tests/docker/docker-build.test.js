/**
 * Docker镜像构建测试
 * 测试Docker镜像是否能正确构建和运行
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

describe('Docker镜像构建测试', () => {
  const projectRoot = path.resolve(__dirname, '../../..');
  const backendDir = path.resolve(__dirname, '../..');
  const imageName = 'wechat-fortune-draw:test';
  const containerName = 'fortune-test-container';

  // 测试超时时间（构建可能需要较长时间）
  jest.setTimeout(300000); // 5分钟

  beforeAll(() => {
    // 确保测试环境干净
    try {
      execSync(`docker rm -f ${containerName}`, { stdio: 'ignore' });
    } catch (error) {
      // 容器不存在，忽略错误
    }
    
    try {
      execSync(`docker rmi ${imageName}`, { stdio: 'ignore' });
    } catch (error) {
      // 镜像不存在，忽略错误
    }
  });

  afterAll(() => {
    // 清理测试资源
    try {
      execSync(`docker rm -f ${containerName}`, { stdio: 'ignore' });
      execSync(`docker rmi ${imageName}`, { stdio: 'ignore' });
    } catch (error) {
      // 忽略清理错误
    }
  });

  test('应该能够成功构建Docker镜像', () => {
    console.log('开始构建Docker镜像...');
    
    // 构建Docker镜像
    const buildCommand = `docker build -t ${imageName} .`;
    
    expect(() => {
      const output = execSync(buildCommand, { 
        cwd: backendDir,
        stdio: 'pipe',
        encoding: 'utf8'
      });
      console.log('构建输出:', output);
    }).not.toThrow();

    // 验证镜像是否存在
    const images = execSync('docker images --format "{{.Repository}}:{{.Tag}}"', { 
      encoding: 'utf8' 
    });
    
    expect(images).toContain(imageName);
  });

  test('应该能够启动容器并通过健康检查', async () => {
    console.log('启动测试容器...');
    
    // 启动容器
    const runCommand = `docker run -d --name ${containerName} -p 3001:3000 -e NODE_ENV=test ${imageName}`;
    
    execSync(runCommand, { stdio: 'pipe' });

    // 等待容器启动
    await new Promise(resolve => setTimeout(resolve, 10000));

    // 检查容器状态
    const containerStatus = execSync(`docker ps --filter "name=${containerName}" --format "{{.Status}}"`, {
      encoding: 'utf8'
    }).trim();

    expect(containerStatus).toMatch(/Up/);

    // 测试健康检查端点
    let healthCheckPassed = false;
    let attempts = 0;
    const maxAttempts = 30;

    while (!healthCheckPassed && attempts < maxAttempts) {
      try {
        const healthResponse = execSync('curl -f http://localhost:3001/api/health', {
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

  test('容器应该正确挂载数据目录', () => {
    // 检查容器内的数据目录
    const dataDir = execSync(`docker exec ${containerName} ls -la /app/data`, {
      encoding: 'utf8'
    });

    expect(dataDir).toContain('total');
    
    // 检查数据目录权限
    const dataDirPerms = execSync(`docker exec ${containerName} stat -c "%U:%G %a" /app/data`, {
      encoding: 'utf8'
    }).trim();

    expect(dataDirPerms).toMatch(/nodejs:nodejs/);
  });

  test('容器应该以非root用户运行', () => {
    // 检查运行用户
    const currentUser = execSync(`docker exec ${containerName} whoami`, {
      encoding: 'utf8'
    }).trim();

    expect(currentUser).toBe('nodejs');

    // 检查用户ID
    const userId = execSync(`docker exec ${containerName} id -u`, {
      encoding: 'utf8'
    }).trim();

    expect(userId).toBe('1001');
  });

  test('容器应该正确处理环境变量', () => {
    // 检查环境变量
    const nodeEnv = execSync(`docker exec ${containerName} printenv NODE_ENV`, {
      encoding: 'utf8'
    }).trim();

    expect(nodeEnv).toBe('test');

    const port = execSync(`docker exec ${containerName} printenv PORT`, {
      encoding: 'utf8'
    }).trim();

    expect(port).toBe('3000');
  });

  test('容器应该能够正确响应API请求', async () => {
    // 测试根路径
    const rootResponse = execSync('curl -s http://localhost:3001/', {
      encoding: 'utf8'
    });

    const rootData = JSON.parse(rootResponse);
    expect(rootData.message).toContain('微信小程序新年抽签应用后端服务');
    expect(rootData.status).toBe('running');

    // 测试抽签API（应该返回错误，因为没有提供openid）
    const fortuneResponse = execSync('curl -s -X POST http://localhost:3001/api/fortune -H "Content-Type: application/json" -d "{}"', {
      encoding: 'utf8'
    });

    const fortuneData = JSON.parse(fortuneResponse);
    expect(fortuneData.success).toBe(false);
    expect(fortuneData.error).toContain('openid');
  });

  test('容器日志应该包含启动信息', () => {
    // 获取容器日志
    const logs = execSync(`docker logs ${containerName}`, {
      encoding: 'utf8'
    });

    expect(logs).toContain('服务器已启动在端口');
    expect(logs).toContain('健康检查:');
    expect(logs).toContain('抽签接口:');
  });

  test('容器应该正确处理信号和优雅关闭', async () => {
    // 发送SIGTERM信号
    execSync(`docker kill -s SIGTERM ${containerName}`);

    // 等待容器关闭
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 检查容器状态
    const containerStatus = execSync(`docker ps -a --filter "name=${containerName}" --format "{{.Status}}"`, {
      encoding: 'utf8'
    }).trim();

    expect(containerStatus).toMatch(/Exited/);

    // 检查退出码
    const exitCode = execSync(`docker inspect ${containerName} --format="{{.State.ExitCode}}"`, {
      encoding: 'utf8'
    }).trim();

    expect(exitCode).toBe('0');
  });
});
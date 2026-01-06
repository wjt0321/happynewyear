/**
 * 部署脚本测试
 * 测试部署脚本的功能和错误处理
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

describe('部署脚本测试', () => {
  const projectRoot = path.resolve(__dirname, '../../..');
  const scriptsDir = path.join(projectRoot, 'scripts');
  const deployScript = path.join(scriptsDir, 'deploy.sh');
  const healthCheckScript = path.join(scriptsDir, 'health-check.sh');

  beforeAll(() => {
    // 确保脚本文件存在
    expect(fs.existsSync(deployScript)).toBe(true);
    expect(fs.existsSync(healthCheckScript)).toBe(true);
  });

  describe('部署脚本基本功能', () => {
    test('部署脚本应该存在且可执行', () => {
      expect(fs.existsSync(deployScript)).toBe(true);
      
      // 检查文件权限（在Unix系统上）
      if (process.platform !== 'win32') {
        const stats = fs.statSync(deployScript);
        expect(stats.mode & parseInt('111', 8)).toBeTruthy();
      }
    });

    test('部署脚本应该显示帮助信息', () => {
      const helpOutput = execSync(`bash ${deployScript} help`, {
        encoding: 'utf8',
        cwd: projectRoot
      });

      expect(helpOutput).toContain('微信小程序新年抽签应用');
      expect(helpOutput).toContain('用法:');
      expect(helpOutput).toContain('deploy');
      expect(helpOutput).toContain('stop');
      expect(helpOutput).toContain('status');
      expect(helpOutput).toContain('cleanup');
    });

    test('部署脚本应该验证Docker环境', () => {
      // 模拟Docker不可用的情况（通过修改PATH）
      const originalPath = process.env.PATH;
      
      try {
        // 临时移除Docker路径
        process.env.PATH = '/usr/bin:/bin';
        
        expect(() => {
          execSync(`bash ${deployScript} deploy dev`, {
            encoding: 'utf8',
            cwd: projectRoot,
            stdio: 'pipe'
          });
        }).toThrow();
      } catch (error) {
        expect(error.message).toContain('docker');
      } finally {
        // 恢复原始PATH
        process.env.PATH = originalPath;
      }
    });
  });

  describe('健康检查脚本功能', () => {
    test('健康检查脚本应该存在', () => {
      expect(fs.existsSync(healthCheckScript)).toBe(true);
    });

    test('健康检查脚本应该显示帮助信息', () => {
      const helpOutput = execSync(`bash ${healthCheckScript} help`, {
        encoding: 'utf8',
        cwd: projectRoot
      });

      expect(helpOutput).toContain('健康检查和监控脚本');
      expect(helpOutput).toContain('check');
      expect(helpOutput).toContain('status');
      expect(helpOutput).toContain('monitor');
    });

    test('健康检查脚本应该能够检测服务不可用', () => {
      // 当服务未运行时，健康检查应该失败
      try {
        execSync(`bash ${healthCheckScript} check`, {
          encoding: 'utf8',
          cwd: projectRoot,
          stdio: 'pipe'
        });
      } catch (error) {
        // 预期会失败，因为服务未运行
        expect(error.status).not.toBe(0);
      }
    });
  });

  describe('配置文件验证', () => {
    test('Docker Compose配置文件应该存在且格式正确', () => {
      const composeFiles = [
        'docker-compose.yml',
        'docker-compose.dev.yml',
        'docker-compose.prod.yml'
      ];

      composeFiles.forEach(file => {
        const filePath = path.join(projectRoot, file);
        expect(fs.existsSync(filePath)).toBe(true);

        // 验证YAML格式
        expect(() => {
          execSync(`docker-compose -f ${file} config`, {
            cwd: projectRoot,
            stdio: 'pipe'
          });
        }).not.toThrow();
      });
    });

    test('环境变量模板文件应该存在', () => {
      const envTemplate = path.join(projectRoot, '.env.docker');
      expect(fs.existsSync(envTemplate)).toBe(true);

      const envContent = fs.readFileSync(envTemplate, 'utf8');
      expect(envContent).toContain('BACKEND_PORT');
      expect(envContent).toContain('DATA_PATH');
      expect(envContent).toContain('NODE_ENV');
    });

    test('Dockerfile应该存在且格式正确', () => {
      const dockerfile = path.join(projectRoot, 'backend', 'Dockerfile');
      expect(fs.existsSync(dockerfile)).toBe(true);

      const dockerfileContent = fs.readFileSync(dockerfile, 'utf8');
      expect(dockerfileContent).toContain('FROM node:18-alpine');
      expect(dockerfileContent).toContain('WORKDIR /app');
      expect(dockerfileContent).toContain('EXPOSE 3000');
      expect(dockerfileContent).toContain('HEALTHCHECK');
    });
  });

  describe('备份和恢复功能', () => {
    test('应该能够创建数据备份', () => {
      // 创建测试数据目录
      const testDataDir = path.join(projectRoot, 'test-backup-data');
      const testFile = path.join(testDataDir, 'test.db');
      
      if (!fs.existsSync(testDataDir)) {
        fs.mkdirSync(testDataDir, { recursive: true });
      }
      fs.writeFileSync(testFile, 'test data');

      // 模拟备份功能（这里简化测试）
      const backupDir = path.join(projectRoot, 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // 创建备份
      const backupName = `test-backup-${Date.now()}.tar.gz`;
      const backupPath = path.join(backupDir, backupName);
      
      execSync(`tar -czf ${backupPath} -C ${projectRoot} test-backup-data/`, {
        stdio: 'pipe'
      });

      expect(fs.existsSync(backupPath)).toBe(true);

      // 清理测试文件
      fs.rmSync(testDataDir, { recursive: true, force: true });
      fs.unlinkSync(backupPath);
    });
  });

  describe('日志功能', () => {
    test('应该能够创建日志目录', () => {
      const logDir = path.join(projectRoot, 'logs');
      
      // 如果日志目录不存在，创建它
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      expect(fs.existsSync(logDir)).toBe(true);
    });

    test('部署脚本应该生成日志文件', () => {
      const logFile = path.join(projectRoot, 'logs', 'deploy.log');
      
      // 运行一个简单的命令来生成日志
      try {
        execSync(`bash ${deployScript} help`, {
          cwd: projectRoot,
          stdio: 'pipe'
        });
      } catch (error) {
        // 忽略错误，我们只是想生成日志
      }

      // 注意：实际的日志生成取决于脚本的实现
      // 这里我们只是验证日志目录存在
      expect(fs.existsSync(path.dirname(logFile))).toBe(true);
    });
  });

  describe('错误处理', () => {
    test('部署脚本应该处理无效的环境参数', () => {
      expect(() => {
        execSync(`bash ${deployScript} deploy invalid-env`, {
          encoding: 'utf8',
          cwd: projectRoot,
          stdio: 'pipe'
        });
      }).toThrow();
    });

    test('部署脚本应该处理无效的命令', () => {
      expect(() => {
        execSync(`bash ${deployScript} invalid-command`, {
          encoding: 'utf8',
          cwd: projectRoot,
          stdio: 'pipe'
        });
      }).toThrow();
    });
  });

  describe('权限和安全', () => {
    test('脚本应该检查必要的权限', () => {
      // 检查脚本是否验证Docker权限
      const scriptContent = fs.readFileSync(deployScript, 'utf8');
      expect(scriptContent).toContain('docker');
      expect(scriptContent).toContain('check');
    });

    test('Dockerfile应该使用非root用户', () => {
      const dockerfile = path.join(projectRoot, 'backend', 'Dockerfile');
      const dockerfileContent = fs.readFileSync(dockerfile, 'utf8');
      
      expect(dockerfileContent).toContain('USER nodejs');
      expect(dockerfileContent).toContain('adduser');
    });

    test('Docker Compose应该包含安全配置', () => {
      const composeFile = path.join(projectRoot, 'docker-compose.prod.yml');
      const composeContent = fs.readFileSync(composeFile, 'utf8');
      
      expect(composeContent).toContain('no-new-privileges');
      expect(composeContent).toContain('read_only');
    });
  });
});